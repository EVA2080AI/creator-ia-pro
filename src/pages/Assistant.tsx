import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Menu, Send, Square, Loader2, Paperclip, FileText,
  LayoutTemplate, Image as ImageIcon, PenLine, BarChart3, Scale, Dice5, Wallet, Sparkles, Bot,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useCopyCodeButtons } from "@/hooks/useCopyCodeButtons";
import { useProjectCards } from "@/hooks/useProjectCards";
import { BasaltShellSidebar } from "@/components/layout/BasaltShellSidebar";
import { hasSeenBasaltGuide } from "@/lib/basalt-guide";
import {
  getAssistant, brandCssVars,
  type Assistant, type AssistantWelcomeCard,
} from "@/lib/assistants";
import {
  loadConversations, saveConversation, CONTINUE_PROMPT, joinContinuation,
  type ConversationSummary, type StoredMsg,
} from "@/lib/basalt";
import { toast } from "sonner";
import { mdToHtml } from "@/lib/markdown";
import { useDocAttachments } from "@/hooks/useDocAttachments";
import { PendingDocChips, SentDocChips, SentImages } from "@/components/basalt/DocChips";
import { Activity, Sources } from "@/components/basalt/SearchActivity";
import { LinkSuggestions } from "@/components/basalt/LinkSuggestions";
import { MessageActions, EditButton } from "@/components/basalt/MessageActions";
import { findLinks } from "@/lib/links";
import { activityLabel, mergeSources, readBasaltEvent, type SearchSource } from "@/lib/stream-events";
import { ConversationList } from "@/components/basalt/ConversationList";
import { ThreadSkeleton } from "@/components/basalt/ThreadSkeleton";
import { useConversationHistory } from "@/hooks/useConversationHistory";
import { DOC_ACCEPT } from "@/lib/doc-extract";
import { IMAGE_ACCEPT, imagesFromTransfer, recentImages } from "@/lib/image-attach";
import { getModel } from "@/lib/ai/models";
import { ATTACH_CARD_PROMPT, DEFAULT_DOC_PROMPT, DEFAULT_IMAGE_PROMPT, DOC_ANALYSIS_PROMPT, buildApiMessages, hasDocuments, type DocPayload } from "@/lib/doc-context";
import "./Assistant.css";

// Homologado con Basalt.tsx (auditoría UX 2026-09-29: "los expertos...
// deben ser un solo nombre" + "deben tener también persistir sus chat") —
// usa el MISMO BasaltShellSidebar en vez de un <nav> propio armado a mano,
// que había divergido en silencio: menú de Cuenta pelado, sin Guía rápida,
// sin Arena IA/Canvas IA, sin selector de modelo, historial sin truncar.

const ICONS: Record<string, typeof LayoutTemplate> = {
  layout: LayoutTemplate,
  image: ImageIcon,
  pen: PenLine,
  chart: BarChart3,
  compare: Scale,
  dice: Dice5,
  pay: Wallet,
  file: FileText,
};

// Adjuntar documentos sirve en cualquier Experto (un contrato en Legal, una hoja de vida en Talento,
// un P&G en Financiero), pero las tarjetas de bienvenida vienen de la base de datos y no traen la
// tarjeta de adjuntar. Se agrega desde acá, con el texto del dominio de cada uno.
const ATTACH_CARD_LABEL: Record<string, string> = {
  legal: "Analizar un contrato",
  riesgos: "Analizar un contrato o una póliza",
  financiero: "Analizar un estado financiero",
  talento: "Revisar una hoja de vida",
  operaciones: "Revisar un procedimiento o manual",
  comunicaciones: "Revisar un documento antes de publicarlo",
};

function CardIcon({ name }: { name?: string }) {
  const Icon = (name && ICONS[name]) || Sparkles;
  return <Icon className="w-4 h-4" />;
}

export default function AssistantPage() {
  const { slug = "mentor" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth("/auth");

  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [loadingAssistant, setLoadingAssistant] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Mismo tema global que el resto de la app — antes cada Experto tenía su
  // propio estado de tema local, y hasta forzaba oscuro según brand.theme,
  // peleando con la preferencia del usuario (auditoría UX 2026-09-29).
  const { resolvedTheme: theme, setTheme } = useTheme();
  // Se calcula una sola vez al montar — mismo mecanismo que Basalt.tsx, por
  // si el primer contacto de un usuario nuevo es un link directo a un
  // Experto en vez de /a/basalt.
  const [autoGuide] = useState(() => !hasSeenBasaltGuide());

  const [convId, setConvId] = useState<string>(() => crypto.randomUUID());
  /** Título puesto a mano de la conversación abierta (ver persist en Basalt.tsx). */
  const [convTitle, setConvTitle] = useState("");

  const [messages, setMessages] = useState<StoredMsg[]>([]);
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Mensaje cuya respuesta se cortó por el límite de tiempo del servidor
  // (finish_reason "length") — habilita "Continuar" (igual que en Basalt.tsx).
  const [truncatedId, setTruncatedId] = useState<string | null>(null);
  // Qué está haciendo el modelo mientras no hay texto, y qué costaron las búsquedas
  // de cada respuesta en esta sesión (ver src/lib/stream-events.ts).
  const [activity, setActivity] = useState("");
  const [searchCost, setSearchCost] = useState<Record<string, number>>({});

  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const userId = user?.id ?? "";
  // Documentos adjuntos: el texto vive solo en memoria (por mensaje) y viaja en el campo `documents`
  // de la petición, que el servidor usa para responder pero NO archiva (ver api/ai/chat.ts). En el
  // historial queda únicamente el nombre y el tamaño.
  const docsByMsg = useRef(new Map<string, DocPayload[]>());
  /** Fotos por mensaje, solo en memoria — ver Basalt.tsx. */
  const imagesByMsg = useRef(new Map<string, string[]>());
  const { docs: pendingDocs, ready: readyDocs, images: pendingImages, busy: docsBusy, addFiles, addUrl, remove: removeDoc, clear: clearDocs } = useDocAttachments();
  // Enlaces pegados en el compositor que todavía no se leyeron. El modelo no puede
  // abrir una URL: sin esto, o inventa el contenido o dice que no puede (ver links.ts).
  const pendingLinks = useMemo(
    () => findLinks(input).filter((u) => !pendingDocs.some((d) => d.url === u)),
    [input, pendingDocs],
  );

  // Último mensaje del usuario: es el que se puede editar y reenviar (editar uno del
  // medio tiraría todo lo que vino después). Casi nunca es el último del hilo: la
  // respuesta va debajo.
  const lastUserIdx = useMemo(() => messages.map((m) => m.role).lastIndexOf("user"), [messages]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    setLoadingAssistant(true);
    setMessages([]);
    setConvId(crypto.randomUUID());
    setError(null);
    clearDocs();
    getAssistant(slug).then((a) => {
      setAssistant(a);
      setLoadingAssistant(false);
    });
  }, [slug, clearDocs]);

  const stickToBottom = useCallback(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // Lista, apertura, borrado y anclado del historial: lo mismo que usa Basalt.tsx.
  const chats = useConversationHistory({
    userId,
    assistantSlug: slug,
    onMessages: setMessages,
    onOpened: () => requestAnimationFrame(stickToBottom),
  });
  const { threadStatus } = chats;

  useCopyCodeButtons(scrollerRef);
  useProjectCards(scrollerRef);

  const newChat = () => {
    abortRef.current?.abort();
    chats.reset();
    setConvId(crypto.randomUUID());
    setConvTitle("");
    setMessages([]);
    setError(null);
    setTruncatedId(null);
    clearDocs();
    setSidebarOpen(false);
  };

  const openConversation = (c: ConversationSummary) => {
    abortRef.current?.abort();
    setConvId(c.id);
    setConvTitle(c.title);
    setError(null);
    setTruncatedId(null);
    clearDocs();
    setSidebarOpen(false);
    chats.open(c);
  };

  const removeConversation = (id: string) => {
    chats.remove(id);
    if (id === convId) newChat();
  };

  const sendPrompt = useCallback(async (prompt: string, opts?: { continueFrom?: string; retry?: boolean; base?: StoredMsg[] }) => {
    // `base` permite rehacer una respuesta sobre un hilo ya recortado sin esperar al
    // estado (ver regenerate), igual que en Basalt.tsx.
    const base = opts?.base ?? messages;
    // Adjuntar sin escribir nada = pedir el análisis completo (igual que en Basalt).
    const attached = opts?.continueFrom || opts?.retry ? [] : readyDocs;
    const attachedImages = opts?.continueFrom || opts?.retry ? [] : pendingImages;
    const text = prompt.trim() || (attached.length ? DEFAULT_DOC_PROMPT : attachedImages.length ? DEFAULT_IMAGE_PROMPT : "");
    // Nunca escribir sobre una conversación cuyos mensajes aún no llegaron: al
    // guardar se sube el hilo COMPLETO desde el estado local, así que hacerlo con
    // el hilo a medias borraría lo anterior.
    if (!text || generating || !assistant || threadStatus !== "idle" || (!opts?.continueFrom && docsBusy)) return;
    // Un Experto trae su modelo fijo: si ese no ve, decirlo antes de cobrar el mensaje.
    if (attachedImages.length && !getModel(assistant.defaultModel).vision) {
      toast.error(`${assistant.name} usa ${getModel(assistant.defaultModel).label}, que no puede ver imágenes.`, {
        description: "Pregúntale a Basalt con un modelo con visión, o describe la imagen con palabras.",
      });
      return;
    }

    // "Continuar": retoma un mensaje cortado, pegando el texto nuevo al final
    // del mismo mensaje (joinContinuation) en vez de abrir uno nuevo.
    const continued = opts?.continueFrom ? base.find((m) => m.id === opts.continueFrom && m.role === "model") : undefined;
    const prefix = continued?.text ?? "";

    // "Reintentar" tras un error: la pregunta del usuario ya está en el hilo (solo se quitó la
    // respuesta vacía), así que se reenvía tal cual en vez de agregarla por segunda vez.
    const retrying = !continued && !!opts?.retry && base[base.length - 1]?.role === "user";
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
    const history = continued || retrying ? base : [...base, userMsg];
    if (!continued && !retrying) {
      setMessages(history);
      setInput("");
    }
    setGenerating(true);
    setError(null);
    setTruncatedId(null);
    requestAnimationFrame(stickToBottom);

    const modelMsgId = continued ? continued.id : crypto.randomUUID();
    if (!continued) setMessages((prev) => [...prev, { id: modelMsgId, role: "model", text: "" }]);
    let cutOff = false;

    // Los documentos de los mensajes ANTERIORES se pegan dentro de su mensaje (solo van al modelo como
    // contexto, no se re-archivan); los del último salen aparte, en `documents`.
    const apiMessages = buildApiMessages(history.slice(-20), docsByMsg.current);
    const lastId = history[history.length - 1]?.role === "user" ? history[history.length - 1].id : "";
    const lastDocs = continued ? [] : docsByMsg.current.get(lastId) ?? [];
    if (lastDocs.length) apiMessages[apiMessages.length - 1] = { role: "user", content: text };
    if (continued) apiMessages.push({ role: "user", content: text });

    abortRef.current = new AbortController();
    let sources: SearchSource[] = [];
    let searchCredits = 0;
    let respondedWith = assistant.defaultModel;
    setActivity("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "include",
        signal: abortRef.current.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: assistant.defaultModel,
          // Las reglas de documentos también en las preguntas de seguimiento (el documento ya está en
          // el historial y no vuelve a viajar en `documents`).
          systemPrompt: (assistant.persona.systemPrompt || "") + (hasDocuments(history.slice(-20)) ? `\n\n${DOC_ANALYSIS_PROMPT}` : "") || undefined,
          // Mismo tope que Basalt.tsx — sin esto, una conversación larga con
          // un Experto arriesga pegar contra el límite de contexto del
          // modelo (auditoría UX 2026-09-29).
          messages: apiMessages,
          // Los documentos del último mensaje van aparte: el servidor los pasa al modelo pero archiva
          // la conversación sin ellos (el historial de los Expertos sí se guarda en el servidor).
          documents: lastDocs.length ? lastDocs.map((d) => ({ name: d.name, text: d.text, truncated: d.truncated })) : undefined,
          // Las fotos del mensaje actual o, si no trae, las de la última pregunta con foto
          // (que siguen en memoria): así una pregunta de seguimiento no se responde a ciegas.
          ...(() => {
            const fotos = attachedImages.length
              ? { urls: attachedImages.map((d) => d.image!.dataUrl), names: attachedImages.map((d) => d.name) }
              : recentImages(history, imagesByMsg.current);
            return fotos.urls.length ? { images: fotos.urls, imageNames: fotos.names } : {};
          })(),
          assistantId: assistant.id,
          temperature: 0.7,
        }),
      });

      if (!res.ok || res.headers.get("content-type")?.includes("application/json")) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Error ${res.status}`);
      }
      respondedWith = res.headers.get("X-Model-Used") || assistant.defaultModel;

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
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
            // Evento nuestro (búsqueda, fuentes, datos de la cuenta), no un chunk del modelo.
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
            if (json.choices?.[0]?.finish_reason === "length") cutOff = true;
            const delta = json.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length) {
              acc += delta;
              const now = Date.now();
              if (now - lastPaint > 40) {
                setMessages((prev) => prev.map((m) => (m.id === modelMsgId ? { ...m, text: joinContinuation(prefix, acc) } : m)));
                lastPaint = now;
                stickToBottom();
              }
            }
          } catch {
            /* fragmento no-JSON */
          }
        }
      }
      const finalText = joinContinuation(prefix, acc);
      const withSources = (previous?: SearchSource[]) => {
        const all = mergeSources(previous, sources);
        return all.length ? all : undefined;
      };
      setMessages((prev) => prev.map((m) => (m.id === modelMsgId ? { ...m, text: finalText, sources: withSources(m.sources), model: respondedWith } : m)));
      if (searchCredits) setSearchCost((prev) => ({ ...prev, [modelMsgId]: (prev[modelMsgId] ?? 0) + searchCredits }));
      if (!acc.trim()) {
        if (!continued) setMessages((prev) => prev.filter((m) => m.id !== modelMsgId));
        setError("El modelo no devolvió texto. Prueba a reformular la pregunta.");
      } else {
        if (cutOff) setTruncatedId(modelMsgId);
        if (userId) {
          const final: StoredMsg[] = continued
            ? history.map((m) => (m.id === modelMsgId ? { ...m, text: finalText, sources: withSources(m.sources), model: respondedWith } : m))
            : [...history, { id: modelMsgId, role: "model", text: finalText, sources: withSources(), model: respondedWith }];
          // El título puesto a mano gana: cada guardado sube el hilo completo y, sin esto,
          // volvería a derivarse del primer mensaje.
          const title = convTitle.trim() || (history.find((m) => m.role === "user")?.text ?? text).slice(0, 60);
          void saveConversation(userId, { id: convId, title, updatedAt: Date.now(), messages: final }, slug)
            .then(() => chats.refresh());
        }
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        // detenido a propósito — conserva lo que se alcanzó a generar
      } else {
        if (!continued) setMessages((prev) => prev.filter((m) => m.id !== modelMsgId));
        setError(e instanceof Error ? e.message : "Error al generar la respuesta.");
      }
    } finally {
      setGenerating(false);
      setActivity("");
      abortRef.current = null;
      stickToBottom();
    }
  }, [assistant, generating, messages, stickToBottom, userId, convId, convTitle, slug, readyDocs, pendingImages, docsBusy, clearDocs, threadStatus, chats]);

  /** Rehace la última respuesta del Experto (su modelo es fijo: no hay "otro modelo"). */
  const regenerate = useCallback((msgId: string) => {
    if (generating) return;
    const i = messages.findIndex((m) => m.id === msgId);
    if (i < 1) return;
    const recortado = messages.slice(0, i);
    if (recortado[recortado.length - 1]?.role !== "user") return;
    setMessages(recortado);
    setTruncatedId(null);
    void sendPrompt(recortado[recortado.length - 1].text, { retry: true, base: recortado });
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

  const handleStop = () => abortRef.current?.abort();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendPrompt(input);
  };

  const cssVars = useMemo(() => (assistant ? brandCssVars(assistant.brand) : {}), [assistant]);

  const welcomeCards = useMemo<AssistantWelcomeCard[]>(() => {
    const cards = assistant?.welcome.cards || [];
    if (cards.some((c) => c.prompt === ATTACH_CARD_PROMPT)) return cards;
    return [...cards, { label: ATTACH_CARD_LABEL[slug] || "Analizar un documento", prompt: ATTACH_CARD_PROMPT, icon: "file" }];
  }, [assistant, slug]);

  if (authLoading || loadingAssistant) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-[#131314]">
        <Loader2 className="h-7 w-7 animate-spin text-zinc-300 dark:text-zinc-600" />
      </div>
    );
  }

  if (!assistant) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-white dark:bg-[#131314] text-center px-6">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No encontramos este asistente.</p>
        <button onClick={() => navigate("/a/basalt")} className="text-sm font-bold text-primary underline">Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="asst-app" data-asst-theme={theme} style={cssVars as React.CSSProperties}>
      <Helmet><title>{assistant.name} | Creator IA Pro</title></Helmet>

      <BasaltShellSidebar
        activePath=""
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        theme={theme}
        setTheme={setTheme}
        onNewChat={newChat}
        autoOpenGuide={autoGuide}
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
          <div className="asst-brand-name">{assistant.name}</div>
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
              <h1 className="asst-hello">{assistant.welcome.title || `Hola, soy ${assistant.name}`}</h1>
              <p className="asst-hello-sub">{assistant.welcome.subtitle || assistant.tagline}</p>
              <div className="asst-cards">
                {welcomeCards.map((c: AssistantWelcomeCard) => (
                  <button
                    key={c.label}
                    className="asst-card"
                    onClick={() => (c.prompt === ATTACH_CARD_PROMPT ? fileInputRef.current?.click() : void sendPrompt(c.prompt))}
                  >
                    <span>{c.label}</span>
                    <span className="asst-card-ic"><CardIcon name={c.icon} /></span>
                  </button>
                ))}
              </div>
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
                            disabled={generating}
                            onRegenerate={i === messages.length - 1 ? () => regenerate(m.id) : undefined}
                          />
                        ) : null}
                        {/* Lo que está pasando ahora, al final del mensaje (ver Basalt.tsx). */}
                        {generating && i === messages.length - 1 ? (
                          activity ? <Activity label={activity} /> : m.text ? null : <div className="asst-shimmer"><i /><i /><i /></div>
                        ) : null}
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
              {error && (
                <div className="asst-err" role="alert">
                  <span>⚠️ {error}</span>
                  <button onClick={() => void sendPrompt(messages[messages.length - 1]?.text || "", { retry: true })}>Reintentar</button>
                </div>
              )}
            </div>
          )}
        </div>

        <form className="asst-composer" onSubmit={handleSubmit}>
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
          <div className="asst-pill">
            <button
              type="button"
              className="asst-attach"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Adjuntar un documento o una imagen"
              title="Adjuntar un documento (PDF, Word, texto) o una imagen para analizarla"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <textarea
              rows={1}
              value={input}
              aria-label={`Escribe tu mensaje para ${assistant.name}`}
              aria-describedby="asst-enviar-ayuda"
              placeholder={pendingDocs.length ? "Pregunta sobre el documento, o envía para un análisis completo…" : `Pregúntale a ${assistant.name}…`}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 170) + "px";
              }}
              onPaste={(e) => {
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
              onClick={generating ? handleStop : undefined}
              disabled={threadStatus !== "idle" && !generating}
              className={`asst-send ${generating ? "stop" : (input.trim() || readyDocs.length) && !docsBusy && threadStatus === "idle" ? "ready" : ""}`}
              aria-label={generating ? "Detener" : "Enviar"}
            >
              {generating ? <Square className="w-3.5 h-3.5" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
