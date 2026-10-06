import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Menu, Send, Square, Loader2, Scale, Paperclip, FileText, Download, Code2,
  LayoutTemplate, Image as ImageIcon, PenLine, BarChart3, Dice5, Sparkles, Bot,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useCopyCodeButtons } from "@/hooks/useCopyCodeButtons";
import { useProjectCards } from "@/hooks/useProjectCards";
import { GitHubExportDialog } from "@/components/basalt/GitHubExportDialog";
import { useProfile } from "@/hooks/useProfile";
import { ModelPicker } from "@/components/basalt/ModelPicker";
import { ConversationList } from "@/components/basalt/ConversationList";
import { ThreadSkeleton } from "@/components/basalt/ThreadSkeleton";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import { PendingDocChips, SentDocChips, SentImages } from "@/components/basalt/DocChips";
import { MemoryPanel, MemoryToggle } from "@/components/basalt/MemoryPanel";
import { Activity, Sources } from "@/components/basalt/SearchActivity";
import { LinkSuggestions } from "@/components/basalt/LinkSuggestions";
import { MessageActions, EditButton } from "@/components/basalt/MessageActions";
import { GuidedTour, type TourStep } from "@/components/basalt/GuidedTour";
import { findLinks } from "@/lib/links";
import { useDocAttachments } from "@/hooks/useDocAttachments";
import { DOC_ACCEPT } from "@/lib/doc-extract";
import { IMAGE_ACCEPT, imagesFromTransfer, recentImages } from "@/lib/image-attach";
import { ATTACH_CARD_PROMPT, DEFAULT_DOC_PROMPT, DEFAULT_IMAGE_PROMPT, DOC_ANALYSIS_PROMPT, buildApiMessages, hasDocuments, type DocPayload } from "@/lib/doc-context";
import { BasaltShellSidebar } from "@/components/layout/BasaltShellSidebar";
import { hasSeenBasaltGuide, markBasaltGuideSeen } from "@/lib/basalt-guide";
import { brandCssVars } from "@/lib/assistants";
import { toast } from "sonner";
import { mdToHtml } from "@/lib/markdown";
import { CHAT_MODELS, IMAGE_MODELS, DEFAULT_IMAGE_MODEL_ID, canAccessModel, getImageModel, getModel, AUTO_MODEL_ID, resolveAutoModel } from "@/lib/ai/models";
import {
  BASALT_ASSISTANT as A, buildSystemPrompt, parseBasaltReply,
  saveConversation, loadMemory, saveMemory, migrateLegacyLocalStorage,
  CONTINUE_PROMPT, joinContinuation,
  type ConversationSummary, type StoredMsg,
} from "@/lib/basalt";
import { activityLabel, mergeSources, readBasaltEvent, type SearchSource } from "@/lib/stream-events";
import { downloadMarkdown, safeFileName, toMarkdown } from "@/lib/export-conversation";
import { ChatError, canRetry, chatError, errorAction } from "@/lib/chat-errors";
import { createAsset } from "@/lib/assets";
import "./Assistant.css";

/** Opciones de sendPrompt: continuar un mensaje cortado, rehacer el último (sin
 *  duplicar la burbuja del usuario), partir de un hilo recortado y/o usar otro modelo. */
interface SendOpts {
  continueFrom?: string;
  retry?: boolean;
  base?: StoredMsg[];
  model?: string;
}

/** El recorrido señala la interfaz REAL (pedido 2026-10-05: "aquí creas un nuevo
 *  chat…"). Los objetivos llevan data-tour; un paso cuyo objetivo no se ve, se salta. */
const TOUR_STEPS: TourStep[] = [
  { target: "chat", title: "Habla con Basalt", text: "Escríbele aquí lo que necesites: un plan de mercadeo, analizar un contrato, construir una página web completa." },
  { target: "adjuntar", title: "Adjunta archivos", text: "Un contrato en PDF o Word para revisarlo, o una foto para que la mire. También puedes pegar un enlace y te ofrece leerlo." },
  { target: "modelo", title: "Elige el modelo", text: "Hay 21 modelos — o deja \"Auto\" y Basalt elige por ti (siempre entre los gratis). Los de pago muestran su costo antes de usarlos." },
  { target: "nuevo-chat", title: "Nuevo chat", text: "Empieza una conversación limpia cuando cambies de tema. Las anteriores quedan guardadas en \"Conversaciones\".", drawer: true },
  { target: "expertos", title: "Expertos", text: "Asistentes por área —Legal, Marketing y más— y los que crees tú. Mismo chat, enfoque distinto.", drawer: true },
  { target: "memoria", title: "Memoria", text: "Lo que le cuentes de tu negocio queda aquí: puedes añadir, corregir u olvidar datos cuando quieras.", drawer: true },
];

const ICONS: Record<string, typeof LayoutTemplate> = {
  layout: LayoutTemplate, image: ImageIcon, pen: PenLine, chart: BarChart3, compare: Scale, dice: Dice5, file: FileText, code: Code2,
};

const MODEL_KEY = "basalt:model";
const IMAGE_MODEL_KEY = "basalt:image-model";

function readModel() {
  try {
    const m = localStorage.getItem(MODEL_KEY);
    if (m === AUTO_MODEL_ID || (m && CHAT_MODELS.some((x) => x.id === m))) return m;
  } catch { /* sin storage */ }
  // Sin preferencia guardada: Auto. Quien ya eligió un modelo a mano conserva el suyo.
  return AUTO_MODEL_ID;
}

function readImageModel() {
  try {
    const m = localStorage.getItem(IMAGE_MODEL_KEY);
    if (m && IMAGE_MODELS.some((x) => x.id === m)) return m;
  } catch { /* sin storage */ }
  return DEFAULT_IMAGE_MODEL_ID;
}

export default function BasaltPage() {
  const [params, setParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth("/auth");
  const userId = user?.id ?? "";
  const { profile } = useProfile(user?.id);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Un solo tema para toda la app (antes Basalt tenía su propio estado local
  // de tema, desincronizado del toggle global — auditoría UX 2026-09-29).
  const { resolvedTheme: theme, setTheme } = useTheme();
  const [model, setModel] = useState(readModel);
  const [imageModel, setImageModel] = useState(readImageModel);
  // Se calcula una sola vez al montar: si cambia durante la sesión (al cerrar
  // la guía) no debe reabrirse solo por un re-render. La primera visita abre el
  // RECORRIDO (señala la interfaz); el modal queda como resumen en "Guía rápida".
  const [autoGuide] = useState(() => !hasSeenBasaltGuide());
  const [tourOpen, setTourOpen] = useState(autoGuide);

  const [convId, setConvId] = useState<string>(() => crypto.randomUUID());
  // Título de la conversación abierta. El servidor lo recibe en cada guardado (que sube
  // el hilo completo): sin esto, el guardado siguiente lo volvería a derivar del primer
  // mensaje y se perdería el nombre que el usuario puso a mano.
  const [convTitle, setConvTitle] = useState("");
  const [messages, setMessages] = useState<StoredMsg[]>([]);

  const [memory, setMemory] = useState<string[]>([]);
  /** La memoria no se pudo cargar: NO se escribe nada mientras tanto (guardar sube la
   *  lista completa y borraría del servidor lo que sí hay). */
  const [memoryError, setMemoryError] = useState(false);
  const [showMemory, setShowMemory] = useState(false);

  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Código del servidor para el último error: decide qué se ofrece (planes, reintentar). */
  const [errorCode, setErrorCode] = useState<string | undefined>();

  // En la pantalla de bienvenida el aviso va DESPUÉS de las tarjetas: en un teléfono
  // (664px) queda fuera de la vista, así que un primer mensaje fallido se veía como
  // "no pasó nada". Se lleva a la vista en cuanto aparece.
  useEffect(() => {
    if (!error) return;
    requestAnimationFrame(() => document.querySelector(".asst-err")?.scrollIntoView({ block: "center", behavior: "smooth" }));
  }, [error]);
  // Id del mensaje cuya respuesta se cortó por el límite de tiempo del servidor
  // (finish_reason "length") — habilita el botón "Continuar".
  const [truncatedId, setTruncatedId] = useState<string | null>(null);
  // Qué está haciendo el modelo mientras no hay texto: buscar en la web, leer los
  // datos de la cuenta… (eventos del servidor, ver src/lib/stream-events.ts).
  const [activity, setActivity] = useState("");
  // Créditos que costaron las búsquedas de cada respuesta, por id de mensaje. No se
  // guarda en la base: es el aviso del cobro de ESTA sesión, no parte del historial.
  const [searchCost, setSearchCost] = useState<Record<string, number>>({});

  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const autoSentRef = useRef(false);
  const lastPromptRef = useRef("");
  // Documentos adjuntos (contratos, informes…): el texto vive solo en memoria, por mensaje; en el
  // historial guardado queda únicamente el nombre y el tamaño (ver doc-context.ts).
  const docsByMsg = useRef(new Map<string, DocPayload[]>());
  // Fotos por mensaje, solo en memoria (igual que los documentos): sirven para que una
  // pregunta de seguimiento —"¿y qué dice abajo?"— siga viendo la imagen. Nunca se
  // guardan: una imagen dentro de la fila de la conversación es justo lo que se sacó de
  // `saved_asset` cuando una lista de 4 pesaba 6 MB.
  const imagesByMsg = useRef(new Map<string, string[]>());
  const { docs: pendingDocs, ready: readyDocs, images: pendingImages, busy: docsBusy, addFiles, addUrl, remove: removeDoc, clear: clearDocs, restore: restoreDocs } = useDocAttachments();
  // Enlaces pegados en el compositor que todavía no se leyeron. El modelo no puede
  // abrir una URL: sin esto, o inventa el contenido o dice que no puede (ver links.ts).
  const pendingLinks = useMemo(
    () => findLinks(input).filter((u) => !pendingDocs.some((d) => d.url === u)),
    [input, pendingDocs],
  );

  // El título que lleva el archivo descargado: el puesto a mano si lo hay, y si no el
  // mismo que se usa al guardar (el primer mensaje recortado).
  const exportTitle = convTitle.trim() || messages.find((m) => m.role === "user")?.text.slice(0, 60) || "Conversación";

  // Último mensaje del usuario: es el que se puede editar y reenviar (editar uno del
  // medio tiraría todo lo que vino después). Casi nunca es el último del hilo: la
  // respuesta va debajo.
  const lastUserIdx = useMemo(() => messages.map((m) => m.role).lastIndexOf("user"), [messages]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  // Lista, apertura, borrado y anclado del historial: lo mismo que usan los Expertos.
  const chats = useConversationHistory({
    userId,
    onMessages: setMessages,
    onOpened: () => requestAnimationFrame(stickToBottom),
  });
  const { threadStatus } = chats;

  const cargarMemoria = useCallback(async () => {
    if (!userId) return;
    await migrateLegacyLocalStorage(userId);
    const facts = await loadMemory(userId);
    setMemoryError(facts === null);
    if (facts) setMemory(facts);
  }, [userId]);

  useEffect(() => { void cargarMemoria(); }, [cargarMemoria]);

  useEffect(() => {
    try { localStorage.setItem(MODEL_KEY, model); } catch { /* sin storage */ }
  }, [model]);

  useEffect(() => {
    try { localStorage.setItem(IMAGE_MODEL_KEY, imageModel); } catch { /* sin storage */ }
  }, [imageModel]);

  // Una elección guardada que el plan actual ya no permite (bajó de plan, o la eligió
  // cuando el catálogo era otro) terminaba en un 403 en cada mensaje: se vuelve al
  // modelo por defecto en cuanto se conoce el plan.
  const tier = profile?.subscription_tier;
  useEffect(() => {
    if (!tier) return;
    // Auto no se valida contra el plan: resuelve solo a modelos gratis.
    if (model !== AUTO_MODEL_ID && !canAccessModel(tier, getModel(model).minTier)) setModel(AUTO_MODEL_ID);
    if (!canAccessModel(tier, getImageModel(imageModel).minTier)) setImageModel(DEFAULT_IMAGE_MODEL_ID);
  }, [tier, model, imageModel]);

  const stickToBottom = useCallback(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useCopyCodeButtons(scrollerRef);
  useProjectCards(scrollerRef);

  const persist = useCallback((id: string, msgs: StoredMsg[]) => {
    if (!userId || !msgs.length) return;
    const first = msgs.find((m) => m.role === "user")?.text ?? "Nueva conversación";
    const title = convTitle.trim() || first.slice(0, 60);
    void saveConversation(userId, { id, title, updatedAt: Date.now(), messages: msgs })
      .then(() => chats.refresh());
  }, [userId, chats, convTitle]);

  const generateImages = useCallback(async (base: StoredMsg[], msgId: string, imgs: { prompt: string; format: string }[]) => {
    const results = await Promise.all(imgs.map(async (img) => {
      try {
        const res = await fetch("/api/ai/image", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: img.prompt, aspectRatio: img.format, model: imageModel }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.ok) return { ...img, error: body?.error || `Error ${res.status}` };
        const url = body.imageUrl as string;
        // Se sube a /api/assets (misma tabla que "Mis Activos") para que
        // sobreviva a un reload — ver el comentario en saveConversation()
        // (src/lib/basalt.ts) sobre por qué la url pesada no se guarda tal
        // cual en el historial de la conversación.
        const asset = await createAsset({ assetUrl: url, type: "image", prompt: img.prompt, tags: ["basalt-chat"] });
        return { ...img, url, assetId: asset?.id };
      } catch (e) {
        return { ...img, error: e instanceof Error ? e.message : "No se pudo generar la imagen." };
      }
    }));
    const final = base.map((m) => (m.id === msgId ? { ...m, images: results } : m));
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, images: results } : m)));
    return final;
  }, [imageModel]);

  const sendPrompt = useCallback(async (prompt: string, opts?: SendOpts) => {
    const isContinue = !!opts?.continueFrom;
    // `base` permite rehacer una respuesta sobre un hilo ya recortado sin esperar a que
    // el estado se actualice (regenerar borra la respuesta vieja y vuelve a preguntar).
    const base = opts?.base ?? messages;
    const elegido = opts?.model ?? model;
    const attached = isContinue ? [] : readyDocs;
    const attachedImages = isContinue ? [] : pendingImages;
    const text = prompt.trim() || (attached.length ? DEFAULT_DOC_PROMPT : attachedImages.length ? DEFAULT_IMAGE_PROMPT : "");
    // Nunca escribir sobre una conversación cuyos mensajes aún no llegaron: al
    // guardar se sube el hilo COMPLETO desde el estado local, así que hacerlo con
    // el hilo a medias borraría lo anterior.
    if (!text || generating || threadStatus !== "idle" || (!isContinue && docsBusy)) return;
    // "Auto" se resuelve AQUÍ a un modelo concreto (gratis), con lo que ya se sabe
    // del mensaje: si trae fotos y si pinta a código. El servidor nunca ve "auto".
    const modelToUse = elegido === AUTO_MODEL_ID
      ? resolveAutoModel({ hasImages: attachedImages.length > 0, text }).id
      : elegido;
    // Avisar ANTES de cobrar: con un modelo sin visión la foto se ignoraría en silencio.
    if (attachedImages.length && !getModel(modelToUse).vision) {
      const alternativa = CHAT_MODELS.find((m) => m.vision && m.free && canAccessModel(tier, m.minTier));
      toast.error(`${getModel(modelToUse).label} no puede ver imágenes.`, {
        description: alternativa ? `Cambia a ${alternativa.label} y vuelve a enviarla.` : "Elige un modelo con visión en el selector de arriba.",
        action: alternativa ? { label: `Usar ${alternativa.label}`, onClick: () => setModel(alternativa.id) } : undefined,
      });
      return;
    }
    const pendingSnapshot = pendingDocs;

    // "Continuar": retoma un mensaje cortado por el límite de tiempo. No agrega
    // burbuja de usuario ni mensaje nuevo — el texto nuevo se pega al final del
    // mensaje cortado (joinContinuation), así un proyecto de varios archivos
    // sigue siendo UNA tarjeta con vista previa.
    const continued = opts?.continueFrom ? base.find((m) => m.id === opts.continueFrom && m.role === "model") : undefined;
    const prefix = continued?.text ?? "";

    let history: StoredMsg[];
    let modelMsgId: string;
    if (continued) {
      history = base;
      modelMsgId = continued.id;
    } else if (opts?.retry) {
      // La pregunta ya está en el hilo (regenerar): no se agrega una burbuja nueva.
      history = base;
      modelMsgId = crypto.randomUUID();
      setMessages([...history, { id: modelMsgId, role: "model", text: "" }]);
    } else {
      lastPromptRef.current = text;
      const userMsg: StoredMsg = { id: crypto.randomUUID(), role: "user", text };
      if (attached.length || attachedImages.length) {
        userMsg.attachments = [
          ...attached.map((d) => ({ name: d.name, chars: d.doc!.chars, pages: d.doc!.pages, truncated: d.doc!.truncated, kind: d.url ? ("web" as const) : ("doc" as const) })),
          ...attachedImages.map((d) => ({ name: d.name, chars: 0, kind: "image" as const })),
        ];
        if (attached.length) docsByMsg.current.set(userMsg.id, attached.map((d) => ({ name: d.name, text: d.doc!.text, truncated: d.doc!.truncated })));
        if (attachedImages.length) imagesByMsg.current.set(userMsg.id, attachedImages.map((d) => d.image!.dataUrl));
        clearDocs();
      }
      history = [...base, userMsg];
      modelMsgId = crypto.randomUUID();
      setMessages([...history, { id: modelMsgId, role: "model", text: "" }]);
      setInput("");
    }
    setGenerating(true);
    setError(null);
    setErrorCode(undefined);
    setTruncatedId(null);
    requestAnimationFrame(stickToBottom);

    // Si algo falla, el texto que el usuario acababa de escribir no se pierde:
    // antes se borraba del input y, en el primer mensaje de un chat, la
    // pantalla de bienvenida volvía sin ningún error visible — se leía como
    // "escribo y se reinicia".
    const restoreInput = () => {
      if (continued) return;
      setInput((cur) => cur || text);
      if (attached.length) restoreDocs(pendingSnapshot);
    };

    abortRef.current = new AbortController();
    let acc = "";
    let cutOff = false;
    let sources: SearchSource[] = [];
    let searchCredits = 0;
    let respondedWith = modelToUse;
    setActivity("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "include",
        signal: abortRef.current.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelToUse,
          systemPrompt: buildSystemPrompt(memory) + (hasDocuments(history.slice(-20)) ? `\n\n${DOC_ANALYSIS_PROMPT}` : ""),
          messages: [
            ...buildApiMessages(history.slice(-20), docsByMsg.current),
            ...(continued ? [{ role: "user", content: text }] : []),
          ],
          // Las fotos del mensaje que se está enviando o, si no trae, las de la última
          // pregunta con foto: así "¿y qué dice abajo?" sigue viendo la imagen.
          ...(() => {
            const fotos = attachedImages.length
              ? { urls: attachedImages.map((d) => d.image!.dataUrl), names: attachedImages.map((d) => d.name) }
              : recentImages(history, imagesByMsg.current);
            return fotos.urls.length ? { images: fotos.urls, imageNames: fotos.names } : {};
          })(),
          temperature: 0.7,
        }),
      });

      if (!res.ok || res.headers.get("content-type")?.includes("application/json")) {
        const body = await res.json().catch(() => null);
        // Con el código, el aviso puede ofrecer la salida (ver src/lib/chat-errors.ts).
        throw chatError(body, res.status);
      }
      // El servidor ya mandaba esta cabecera y nadie la leía: es la que permite decir
      // QUÉ modelo respondió cada mensaje (y recordarlo al reabrir la conversación).
      respondedWith = res.headers.get("X-Model-Used") || modelToUse;

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let lastPaint = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            // Evento nuestro (búsqueda, fuentes, datos de la cuenta) — no es un chunk del modelo.
            const ev = readBasaltEvent(json);
            if (ev) {
              if (ev.type === "sources") {
                setActivity("");
                searchCredits += ev.credits;
                sources = mergeSources(sources, ev.sources);
                if (sources.length) {
                  const snapshot = sources;
                  setMessages((prev) => prev.map((m) => (m.id === modelMsgId ? { ...m, sources: snapshot } : m)));
                }
              } else {
                setActivity(activityLabel(ev));
                stickToBottom();
              }
              continue;
            }
            const choice = json.choices?.[0];
            if (choice?.finish_reason === "length") cutOff = true;
            const delta = choice?.delta?.content;
            if (typeof delta === "string" && delta.length) {
              acc += delta;
              const now = Date.now();
              if (now - lastPaint > 40) {
                const { visible } = parseBasaltReply(acc);
                setMessages((prev) => prev.map((m) => (m.id === modelMsgId ? { ...m, text: joinContinuation(prefix, visible) } : m)));
                lastPaint = now;
                stickToBottom();
              }
            }
          } catch { /* fragmento no-JSON */ }
        }
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setMessages(base);
        setError(e instanceof Error ? e.message : "Error al generar la respuesta.");
        setErrorCode(e instanceof ChatError ? e.code : undefined);
        restoreInput();
        setGenerating(false);
        setActivity("");
        abortRef.current = null;
        return;
      }
    }
    setActivity("");

    const { visible, memories, images } = parseBasaltReply(acc);
    if (!visible && !images.length) {
      setMessages(base);
      setError("El modelo no devolvió texto. Prueba a reformular la pregunta.");
      restoreInput();
      setGenerating(false);
      abortRef.current = null;
      return;
    }
    if (searchCredits) setSearchCost((prev) => ({ ...prev, [modelMsgId]: (prev[modelMsgId] ?? 0) + searchCredits }));

    const finalText = joinContinuation(prefix, visible);
    const withSources = (previous?: SearchSource[]) => {
      const all = mergeSources(previous, sources);
      return all.length ? all : undefined;
    };
    let final: StoredMsg[] = continued
      ? history.map((m) => (m.id === modelMsgId ? { ...m, text: finalText, images: images.length ? [...(m.images ?? []), ...images] : m.images, sources: withSources(m.sources), model: respondedWith } : m))
      : [...history, { id: modelMsgId, role: "model", text: finalText, images: images.length ? images : undefined, sources: withSources(), model: respondedWith }];
    setMessages(final);
    if (cutOff) setTruncatedId(modelMsgId);

    // Si la memoria no cargó, no se escribe: subiríamos una lista incompleta encima
    // de la buena (ver loadMemory en src/lib/basalt.ts).
    if (memories.length && userId && !memoryError) {
      const next = [...memory, ...memories.filter((f) => !memory.includes(f))];
      setMemory(next);
      void saveMemory(userId, next);
    }

    setGenerating(false);
    abortRef.current = null;
    stickToBottom();

    if (images.length) {
      final = await generateImages(final, modelMsgId, images);
      stickToBottom();
    }
    persist(convId, final);
  }, [generating, messages, model, tier, memory, memoryError, userId, convId, stickToBottom, generateImages, persist, setParams, readyDocs, pendingImages, docsBusy, pendingDocs, clearDocs, restoreDocs, threadStatus]);

  // /a/basalt?q=... (desde /chat o el dashboard) envía el primer mensaje solo.
  useEffect(() => {
    const q = params.get("q");
    if (!q || autoSentRef.current || authLoading || !userId) return;
    autoSentRef.current = true;
    setParams({}, { replace: true });
    void sendPrompt(q);
  }, [params, authLoading, userId, sendPrompt, setParams]);

  /** Rehace la última respuesta, opcionalmente con OTRO modelo. */
  const regenerate = useCallback((msgId: string, modelId?: string) => {
    if (generating) return;
    const i = messages.findIndex((m) => m.id === msgId);
    if (i < 1) return;
    const pregunta = [...messages.slice(0, i)].reverse().find((m) => m.role === "user");
    if (!pregunta) return;
    const recortado = messages.slice(0, i);
    setMessages(recortado);
    setTruncatedId(null);
    void sendPrompt(pregunta.text, { retry: true, base: recortado, model: modelId });
  }, [generating, messages, sendPrompt]);

  /** Devuelve el mensaje al compositor y descarta lo que vino después. */
  const editMessage = useCallback((msgId: string) => {
    if (generating) return;
    const i = messages.findIndex((m) => m.id === msgId);
    if (i < 0) return;
    setInput(messages[i].text);
    setMessages(messages.slice(0, i));
    setTruncatedId(null);
    requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>(".asst-pill textarea")?.focus());
  }, [generating, messages]);

  const newChat = () => {
    abortRef.current?.abort();
    chats.reset();
    setConvId(crypto.randomUUID());
    setConvTitle("");
    setMessages([]);
    setError(null);
    setErrorCode(undefined);
    setTruncatedId(null);
    setSidebarOpen(false);
    docsByMsg.current.clear();
    clearDocs();
  };

  const openConversation = (c: ConversationSummary) => {
    abortRef.current?.abort();
    setConvId(c.id);
    setConvTitle(c.title);
    setError(null);
    setErrorCode(undefined);
    setTruncatedId(null);
    setSidebarOpen(false);
    chats.open(c);
  };

  const removeConversation = (id: string) => {
    chats.remove(id);
    if (id === convId) newChat();
  };

  /** Un solo camino para todo lo que toca la memoria (añadir, corregir, olvidar). */
  const updateMemory = (next: string[]) => {
    if (memoryError) return;
    setMemory(next);
    void saveMemory(userId, next);
  };

  if (authLoading) {
    // bg-white fijo sin dark: — antes de que monte .asst-app no hay
    // data-asst-theme, así que usa la clase .dark global (Tailwind) en vez
    // del atributo propio de Basalt (auditoría UX 2026-09-29).
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-[#131314]">
        <Loader2 className="h-7 w-7 animate-spin text-zinc-300 dark:text-zinc-600" />
      </div>
    );
  }

  const errorAccion = errorAction(errorCode);
  const errorBanner = error && (
    <div className="asst-err" role="alert">
      <span>⚠️ {error}</span>
      {/* Si lo que falta son créditos o plan, lo que resuelve es ver planes, no
          reintentar (que vuelve a fallar igual). */}
      {errorAccion && <Link className="asst-err-cta" to={errorAccion.to}>{errorAccion.label}</Link>}
      {canRetry(errorCode) && <button onClick={() => void sendPrompt(lastPromptRef.current)}>Reintentar</button>}
    </div>
  );

  return (
    <div className="asst-app" data-asst-theme={theme} style={brandCssVars(A.brand) as React.CSSProperties}>
      <Helmet><title>Basalt | Creator IA Pro</title></Helmet>

      <BasaltShellSidebar
        activePath=""
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        theme={theme}
        setTheme={setTheme}
        onNewChat={newChat}
        onStartTour={() => { setSidebarOpen(false); setTourOpen(true); }}
        beforeExperts={
          <>
            <MemoryToggle count={memory.length} open={showMemory} onToggle={() => setShowMemory((v) => !v)} />
            {showMemory && <MemoryPanel facts={memory} onChange={updateMemory} readOnly={!userId} error={memoryError} onRetry={() => void cargarMemoria()} />}
          </>
        }
        extraNav={
          <ConversationList
            {...chats.listProps}
            activeId={convId}
            onOpen={openConversation}
            onDelete={removeConversation}
            onRename={(id, title) => { chats.rename(id, title); if (id === convId) setConvTitle(title); }}
          />
        }
      />

      <GuidedTour
        steps={TOUR_STEPS}
        open={tourOpen}
        onClose={() => { setTourOpen(false); markBasaltGuideSeen(); }}
        onDrawer={setSidebarOpen}
      />

      <main
        id="main-content"
        className={`asst-main${dragging ? " asst-dragging" : ""}`}
        onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setDragging(true); } }}
        onDragLeave={(e) => { if (e.currentTarget === e.target) setDragging(false); }}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          setDragging(false);
          void addFiles(e.dataTransfer.files);
        }}
      >
        <header className="asst-topbar">
          <button className="asst-icon-btn asst-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú" aria-expanded={sidebarOpen} aria-controls="asst-menu" style={{ display: sidebarOpen ? "none" : undefined }}>
            <Menu className="w-4 h-4" />
          </button>
          <div className="asst-brand-name">Basalt</div>
          {/* Un solo selector para texto/código y motor de imagen (Basalt decide solo cuándo
              generar una imagen — etiqueta <imagen>, ver SYSTEM_PROMPT —; el motor elegido
              es CON QUÉ lo hace). Reemplaza a dos <select> nativos de 11px sin candado de plan. */}
          {/* Descargar lo hablado. Un análisis de contrato se necesita FUERA del chat
              (correo, expediente, abogado) y hasta ahora había que copiar mensaje por
              mensaje — y al borrar la conversación se perdía. */}
          {messages.length > 0 && !generating && (
            <button
              className="asst-icon-btn asst-export-btn"
              onClick={() => downloadMarkdown(safeFileName(exportTitle), toMarkdown(exportTitle, messages))}
              aria-label="Descargar la conversación en Markdown"
              title="Descargar la conversación (.md)"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          <ModelPicker model={model} imageModel={imageModel} tier={tier} onModel={setModel} onImageModel={setImageModel} />
        </header>

        {/* aria-live: sin esto, a quien usa un lector de pantalla la respuesta le
            llegaba en silencio — veía el chat "congelado" mientras escribía. */}
        <div className="asst-scroller" ref={scrollerRef} aria-live="polite" aria-busy={generating}>
          {threadStatus !== "idle" ? (
            <ThreadSkeleton
              title={chats.openingTitle}
              status={threadStatus}
              onRetry={() => openConversation({ id: convId, title: chats.openingTitle, updatedAt: Date.now() })}
            />
          ) : messages.length === 0 ? (
            <section className="asst-welcome">
              <h1 className="asst-hello">{A.welcome.title}</h1>
              <p className="asst-hello-sub">{A.welcome.subtitle}</p>
              <div className="asst-cards">
                {(A.welcome.cards || []).map((c) => {
                  const Icon = (c.icon && ICONS[c.icon]) || Sparkles;
                  return (
                    <button key={c.label} className="asst-card" onClick={() => (c.prompt === ATTACH_CARD_PROMPT ? fileInputRef.current?.click() : void sendPrompt(c.prompt))}>
                      <span>{c.label}</span>
                      <span className="asst-card-ic"><Icon className="w-4 h-4" /></span>
                    </button>
                  );
                })}
              </div>
              {errorBanner}
            </section>
          ) : (
            <div className="asst-thread">
              {messages.map((m, i) => (
                <div key={m.id} className={`asst-msg ${m.role}`}>
                  {m.role === "user" ? (
                    <>
                      <div className="asst-bubble">
                        <SentImages urls={imagesByMsg.current.get(m.id)} />
                        {m.attachments?.length ? <SentDocChips docs={m.attachments.filter((a) => a.kind !== "image" || !imagesByMsg.current.has(m.id))} /> : null}
                        {m.text}
                      </div>
                      {/* Editar solo el último: cambiar uno del medio tiraría el resto del hilo. */}
                      {!generating && i === lastUserIdx && <EditButton onEdit={() => editMessage(m.id)} />}
                    </>
                  ) : (
                    <>
                      <div className="asst-avatar"><Bot className="w-3.5 h-3.5 text-white" /></div>
                      <div className="asst-body">
                        {m.text ? (
                          <div className="asst-md" dangerouslySetInnerHTML={{ __html: mdToHtml(m.text) }} />
                        ) : null}
                        {m.sources?.length ? <Sources items={m.sources} credits={searchCost[m.id]} /> : null}
                        {m.text && !(generating && i === messages.length - 1) ? (
                          <MessageActions
                            text={m.text}
                            model={m.model}
                            tier={tier}
                            disabled={generating}
                            onRegenerate={i === messages.length - 1 ? () => regenerate(m.id) : undefined}
                            onRegenerateWith={i === messages.length - 1 ? (id) => regenerate(m.id, id) : undefined}
                          />
                        ) : null}
                        {/* Buscando / leyendo la cuenta. Va al final —después del texto y de las
                            fuentes— porque es lo que está pasando AHORA: si todavía no hay nada
                            que leer reemplaza al shimmer, y si ya hay texto se agrega debajo (el
                            modelo puede volver a buscar a mitad de la respuesta). */}
                        {generating && i === messages.length - 1 ? (
                          activity ? <Activity label={activity} /> : m.text ? null : <div className="asst-shimmer"><i /><i /><i /></div>
                        ) : null}
                        {m.images?.map((img, k) => (
                          <div key={k} style={{ marginTop: 12 }}>
                            {img.url ? (
                              <a href={img.url} download={`basalt-pieza-${k + 1}.png`} target="_blank" rel="noreferrer">
                                <img src={img.url} alt={img.prompt} style={{ maxWidth: "100%", maxHeight: 480, borderRadius: 14, border: "1px solid var(--asst-border)" }} />
                              </a>
                            ) : img.error ? (
                              <p style={{ fontSize: 12, color: "#dc2626" }}>No se pudo generar la pieza: {img.error}</p>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--asst-txt-3)", padding: "24px 16px", background: "var(--asst-panel)", borderRadius: 14 }}>
                                <Loader2 className="w-4 h-4 animate-spin" /> Generando pieza gráfica ({img.format})…
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
              {truncatedId && !generating && messages[messages.length - 1]?.id === truncatedId && (
                <div className="asst-cut" role="status">
                  <span>La respuesta se cortó por el límite de tiempo del modelo.</span>
                  <button onClick={() => void sendPrompt(CONTINUE_PROMPT, { continueFrom: truncatedId })}>Continuar</button>
                </div>
              )}
              {errorBanner}
            </div>
          )}
        </div>

        <form className="asst-composer" onSubmit={(e) => { e.preventDefault(); void sendPrompt(input); }}>
          <LinkSuggestions urls={pendingLinks} onRead={(u) => void addUrl(u)} />
          <PendingDocChips docs={pendingDocs} onRemove={removeDoc} />
          <input
            ref={fileInputRef}
            type="file"
            accept={`${DOC_ACCEPT},${IMAGE_ACCEPT}`}
            multiple
            hidden
            aria-label="Adjuntar documentos o imágenes"
            onChange={(e) => { if (e.target.files?.length) void addFiles(e.target.files); e.target.value = ""; }}
          />
          <p id="asst-enviar-ayuda" className="sr-only">Enter envía el mensaje; Shift y Enter hacen un salto de línea.</p>
          <div className="asst-pill" data-tour="chat">
            <button
              type="button"
              className="asst-attach"
              data-tour="adjuntar"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Adjuntar un documento o una imagen"
              title="Adjuntar un documento (PDF, Word, texto) o una imagen para analizarla"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <textarea
              rows={1}
              value={input}
              aria-label="Escribe tu mensaje para Basalt"
              aria-describedby="asst-enviar-ayuda"
              placeholder={pendingDocs.length ? "Pregunta sobre el documento, o envía para un análisis completo…" : "Pregúntale a Basalt…"}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 170) + "px";
              }}
              onPaste={(e) => {
                // Pegar una captura (Cmd+V) es como adjuntarla: sin esto el portapapeles
                // no dejaba nada y parecía que el chat no aceptaba imágenes.
                const fotos = imagesFromTransfer(e.clipboardData?.items);
                if (fotos.length) { e.preventDefault(); void addFiles(fotos); }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendPrompt(input);
                }
              }}
            />
            <button
              type={generating ? "button" : "submit"}
              onClick={generating ? () => abortRef.current?.abort() : undefined}
              disabled={threadStatus !== "idle" && !generating}
              className={`asst-send ${generating ? "stop" : (input.trim() || readyDocs.length) && !docsBusy && threadStatus === "idle" ? "ready" : ""}`}
              aria-label={generating ? "Detener" : "Enviar"}
            >
              {generating ? <Square className="w-3.5 h-3.5" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </main>
      <GitHubExportDialog />
    </div>
  );
}
