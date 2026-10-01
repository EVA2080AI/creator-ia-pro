import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Menu, Send, Square, Loader2, Brain, Scale, Paperclip, FileText,
  LayoutTemplate, Image as ImageIcon, PenLine, BarChart3, Dice5, Sparkles, Bot, X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useCopyCodeButtons } from "@/hooks/useCopyCodeButtons";
import { useProjectCards } from "@/hooks/useProjectCards";
import { useProfile } from "@/hooks/useProfile";
import { ModelPicker } from "@/components/basalt/ModelPicker";
import { ConversationList } from "@/components/basalt/ConversationList";
import { PendingDocChips, SentDocChips } from "@/components/basalt/DocChips";
import { useDocAttachments } from "@/hooks/useDocAttachments";
import { DOC_ACCEPT } from "@/lib/doc-extract";
import { ATTACH_CARD_PROMPT, DEFAULT_DOC_PROMPT, DOC_ANALYSIS_PROMPT, buildApiMessages, hasDocuments, type DocPayload } from "@/lib/doc-context";
import { BasaltShellSidebar } from "@/components/layout/BasaltShellSidebar";
import { hasSeenBasaltGuide } from "@/lib/basalt-guide";
import { brandCssVars } from "@/lib/assistants";
import { toast } from "sonner";
import { mdToHtml } from "@/lib/markdown";
import { CHAT_MODELS, IMAGE_MODELS, DEFAULT_IMAGE_MODEL_ID, canAccessModel, getImageModel, getModel } from "@/lib/ai/models";
import {
  BASALT_ASSISTANT as A, buildSystemPrompt, parseBasaltReply,
  loadConversations, saveConversation, deleteConversation, setConversationPinned, loadMemory, saveMemory,
  migrateLegacyLocalStorage, CONTINUE_PROMPT, joinContinuation,
  getCachedMessages, loadConversationMessages, prefetchConversation,
  type ConversationSummary, type StoredMsg,
} from "@/lib/basalt";
import { createAsset } from "@/lib/assets";
import "./Assistant.css";

const ICONS: Record<string, typeof LayoutTemplate> = {
  layout: LayoutTemplate, image: ImageIcon, pen: PenLine, chart: BarChart3, compare: Scale, dice: Dice5, file: FileText,
};

const MODEL_KEY = "basalt:model";
const IMAGE_MODEL_KEY = "basalt:image-model";

function readModel() {
  try {
    const m = localStorage.getItem(MODEL_KEY);
    if (m && CHAT_MODELS.some((x) => x.id === m)) return m;
  } catch { /* sin storage */ }
  return A.defaultModel;
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
  // la guía) no debe reabrirse solo por un re-render.
  const [autoGuide] = useState(() => !hasSeenBasaltGuide());

  const [convId, setConvId] = useState<string>(() => crypto.randomUUID());
  const [messages, setMessages] = useState<StoredMsg[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  // Sin esto, "Conversaciones" se ve igual vacía mientras carga que cuando
  // de verdad no hay ninguna — se lee como sección rota (auditoría UX
  // 2026-09-29), a diferencia de "Memoria" que sí distingue los dos casos.
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [memory, setMemory] = useState<string[]>([]);
  const [showMemory, setShowMemory] = useState(false);

  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Id del mensaje cuya respuesta se cortó por el límite de tiempo del servidor
  // (finish_reason "length") — habilita el botón "Continuar".
  const [truncatedId, setTruncatedId] = useState<string | null>(null);
  // Estado de la conversación abierta: "loading" mientras llegan sus mensajes.
  const [threadStatus, setThreadStatus] = useState<"idle" | "loading" | "error">("idle");
  const [openingTitle, setOpeningTitle] = useState("");
  const openRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const autoSentRef = useRef(false);
  const lastPromptRef = useRef("");
  // Documentos adjuntos (contratos, informes…): el texto vive solo en memoria, por mensaje; en el
  // historial guardado queda únicamente el nombre y el tamaño (ver doc-context.ts).
  const docsByMsg = useRef(new Map<string, DocPayload[]>());
  const { docs: pendingDocs, ready: readyDocs, busy: docsBusy, addFiles, remove: removeDoc, clear: clearDocs, restore: restoreDocs } = useDocAttachments();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!userId) return;
    void migrateLegacyLocalStorage(userId).then(() => {
      void loadConversations(userId).then((c) => { setConversations(c); setConversationsLoading(false); });
      void loadMemory(userId).then(setMemory);
    });
  }, [userId]);

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
    if (!canAccessModel(tier, getModel(model).minTier)) setModel(A.defaultModel);
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
    void saveConversation(userId, { id, title: first.slice(0, 60), updatedAt: Date.now(), messages: msgs })
      .then(() => loadConversations(userId))
      .then(setConversations);
  }, [userId]);

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

  // Anclar es optimista: la lista se reordena al instante y, si el servidor no pudo
  // guardarlo, vuelve a su sitio con un aviso (en vez de quedar mintiendo).
  const togglePin = (c: ConversationSummary) => {
    const next = !c.pinned;
    setConversations((prev) => prev.map((x) => (x.id === c.id ? { ...x, pinned: next } : x)));
    void setConversationPinned(userId, c.id, next).then((ok) => {
      if (ok) return;
      setConversations((prev) => prev.map((x) => (x.id === c.id ? { ...x, pinned: !next } : x)));
      toast.error(next ? "No se pudo anclar la conversación." : "No se pudo desanclar la conversación.");
    });
  };

  const sendPrompt = useCallback(async (prompt: string, opts?: { continueFrom?: string }) => {
    const isContinue = !!opts?.continueFrom;
    const attached = isContinue ? [] : readyDocs;
    const text = prompt.trim() || (attached.length ? DEFAULT_DOC_PROMPT : "");
    // Nunca escribir sobre una conversación cuyos mensajes aún no llegaron: al
    // guardar se sube el hilo COMPLETO desde el estado local, así que hacerlo con
    // el hilo a medias borraría lo anterior.
    if (!text || generating || threadStatus !== "idle" || (!isContinue && docsBusy)) return;
    const pendingSnapshot = pendingDocs;

    // "Continuar": retoma un mensaje cortado por el límite de tiempo. No agrega
    // burbuja de usuario ni mensaje nuevo — el texto nuevo se pega al final del
    // mensaje cortado (joinContinuation), así un proyecto de varios archivos
    // sigue siendo UNA tarjeta con vista previa.
    const continued = opts?.continueFrom ? messages.find((m) => m.id === opts.continueFrom && m.role === "model") : undefined;
    const prefix = continued?.text ?? "";

    let history: StoredMsg[];
    let modelMsgId: string;
    if (continued) {
      history = messages;
      modelMsgId = continued.id;
    } else {
      lastPromptRef.current = text;
      const userMsg: StoredMsg = { id: crypto.randomUUID(), role: "user", text };
      if (attached.length) {
        userMsg.attachments = attached.map((d) => ({ name: d.name, chars: d.doc!.chars, pages: d.doc!.pages, truncated: d.doc!.truncated }));
        docsByMsg.current.set(userMsg.id, attached.map((d) => ({ name: d.name, text: d.doc!.text, truncated: d.doc!.truncated })));
        clearDocs();
      }
      history = [...messages, userMsg];
      modelMsgId = crypto.randomUUID();
      setMessages([...history, { id: modelMsgId, role: "model", text: "" }]);
      setInput("");
    }
    setGenerating(true);
    setError(null);
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
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "include",
        signal: abortRef.current.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          systemPrompt: buildSystemPrompt(memory) + (hasDocuments(history.slice(-20)) ? `\n\n${DOC_ANALYSIS_PROMPT}` : ""),
          messages: [
            ...buildApiMessages(history.slice(-20), docsByMsg.current),
            ...(continued ? [{ role: "user", content: text }] : []),
          ],
          temperature: 0.7,
        }),
      });

      if (!res.ok || res.headers.get("content-type")?.includes("application/json")) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Error ${res.status}`);
      }

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
            const choice = JSON.parse(payload).choices?.[0];
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
        setMessages(messages);
        setError(e instanceof Error ? e.message : "Error al generar la respuesta.");
        restoreInput();
        setGenerating(false);
        abortRef.current = null;
        return;
      }
    }

    const { visible, memories, images } = parseBasaltReply(acc);
    if (!visible && !images.length) {
      setMessages(messages);
      setError("El modelo no devolvió texto. Prueba a reformular la pregunta.");
      restoreInput();
      setGenerating(false);
      abortRef.current = null;
      return;
    }

    const finalText = joinContinuation(prefix, visible);
    let final: StoredMsg[] = continued
      ? history.map((m) => (m.id === modelMsgId ? { ...m, text: finalText, images: images.length ? [...(m.images ?? []), ...images] : m.images } : m))
      : [...history, { id: modelMsgId, role: "model", text: finalText, images: images.length ? images : undefined }];
    setMessages(final);
    if (cutOff) setTruncatedId(modelMsgId);

    if (memories.length && userId) {
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
  }, [generating, messages, model, memory, userId, convId, stickToBottom, generateImages, persist, setParams, readyDocs, docsBusy, pendingDocs, clearDocs, restoreDocs, threadStatus]);

  // /a/basalt?q=... (desde /chat o el dashboard) envía el primer mensaje solo.
  useEffect(() => {
    const q = params.get("q");
    if (!q || autoSentRef.current || authLoading || !userId) return;
    autoSentRef.current = true;
    setParams({}, { replace: true });
    void sendPrompt(q);
  }, [params, authLoading, userId, sendPrompt, setParams]);

  const newChat = () => {
    abortRef.current?.abort();
    openRef.current = "";
    setConvId(crypto.randomUUID());
    setMessages([]);
    setThreadStatus("idle");
    setError(null);
    setTruncatedId(null);
    setSidebarOpen(false);
    docsByMsg.current.clear();
    clearDocs();
  };

  // Abrir una conversación trae sus mensajes (la lista ya no los descarga). Si ya se
  // abrió antes están en memoria y el cambio es instantáneo; si no, se pinta un
  // esqueleto —nunca la pantalla de bienvenida, que daría un parpadeo feísimo— y
  // openRef descarta la respuesta si para entonces ya se abrió otra.
  const openConversation = (c: ConversationSummary) => {
    abortRef.current?.abort();
    setConvId(c.id);
    setError(null);
    setTruncatedId(null);
    setSidebarOpen(false);
    openRef.current = c.id;

    const cached = getCachedMessages(userId, c.id);
    if (cached) {
      setMessages(cached);
      setThreadStatus("idle");
      requestAnimationFrame(stickToBottom);
      return;
    }
    setMessages([]);
    setOpeningTitle(c.title);
    setThreadStatus("loading");
    void loadConversationMessages(userId, c.id).then((messages) => {
      if (openRef.current !== c.id) return;
      if (!messages) { setThreadStatus("error"); return; }
      setMessages(messages);
      setThreadStatus("idle");
      requestAnimationFrame(stickToBottom);
    });
  };

  const removeConversation = (id: string) => {
    void deleteConversation(userId, id)
      .then(() => loadConversations(userId))
      .then(setConversations);
    if (id === convId) newChat();
  };

  const removeMemory = (fact: string) => {
    const next = memory.filter((m) => m !== fact);
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

  const errorBanner = error && (
    <div className="asst-err" role="alert">
      <span>⚠️ {error}</span>
      <button onClick={() => void sendPrompt(lastPromptRef.current)}>Reintentar</button>
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
        autoOpenGuide={autoGuide}
        beforeExperts={
          <>
            <button className="asst-side-link" onClick={() => setShowMemory((v) => !v)}>
              <Brain className="w-4 h-4" /> Memoria ({memory.length})
            </button>

            {showMemory && (
              <div style={{ padding: "4px 8px 8px", fontSize: 12, color: "var(--asst-txt-2)" }}>
                {memory.length === 0 ? (
                  <p style={{ padding: "4px 6px" }}>Aún no recuerdo nada. Cuéntame de ti o de tu empresa.</p>
                ) : memory.map((m) => (
                  <div key={m} style={{ display: "flex", gap: 6, alignItems: "flex-start", padding: "4px 6px" }}>
                    <span style={{ flex: 1 }}>{m}</span>
                    <button onClick={() => removeMemory(m)} aria-label="Olvidar" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--asst-txt-3)" }}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        }
        extraNav={
          <ConversationList
            conversations={conversations}
            loading={conversationsLoading}
            activeId={convId}
            onOpen={openConversation}
            onDelete={removeConversation}
            onTogglePin={togglePin}
            onPrefetch={(id) => prefetchConversation(userId, id)}
          />
        }
      />

      <main
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
          <button className="asst-icon-btn asst-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú" style={{ display: sidebarOpen ? "none" : undefined }}>
            <Menu className="w-4 h-4" />
          </button>
          <div className="asst-brand-name">Basalt</div>
          {/* Un solo selector para texto/código y motor de imagen (Basalt decide solo cuándo
              generar una imagen — etiqueta <imagen>, ver SYSTEM_PROMPT —; el motor elegido
              es CON QUÉ lo hace). Reemplaza a dos <select> nativos de 11px sin candado de plan. */}
          <ModelPicker model={model} imageModel={imageModel} tier={tier} onModel={setModel} onImageModel={setImageModel} />
        </header>

        <div className="asst-scroller" ref={scrollerRef}>
          {threadStatus !== "idle" ? (
            <div className="asst-thread">
              {/* El título de la conversación ES el principio del primer mensaje del
                  usuario, así que el esqueleto no inventa nada. Va en el render y
                  nunca dentro de `messages`: así no hay forma de persistirlo. */}
              <div className="asst-msg user"><div className="asst-bubble">{openingTitle}</div></div>
              {threadStatus === "loading" ? (
                <div className="asst-msg model">
                  <div className="asst-avatar"><Bot className="w-3.5 h-3.5 text-white" aria-hidden /></div>
                  <div className="asst-body"><div className="asst-shimmer" role="status" aria-label="Abriendo la conversación"><i /><i /><i /></div></div>
                </div>
              ) : (
                <div className="asst-err" role="alert">
                  <span>⚠️ No se pudo abrir esta conversación.</span>
                  <button onClick={() => openConversation({ id: convId, title: openingTitle, updatedAt: Date.now() })}>Reintentar</button>
                </div>
              )}
            </div>
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
                    <div className="asst-bubble">
                      {m.attachments?.length ? <SentDocChips docs={m.attachments} /> : null}
                      {m.text}
                    </div>
                  ) : (
                    <>
                      <div className="asst-avatar"><Bot className="w-3.5 h-3.5 text-white" /></div>
                      <div className="asst-body">
                        {m.text ? (
                          <div className="asst-md" dangerouslySetInnerHTML={{ __html: mdToHtml(m.text) }} />
                        ) : generating && i === messages.length - 1 ? (
                          <div className="asst-shimmer"><i /><i /><i /></div>
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
          <PendingDocChips docs={pendingDocs} onRemove={removeDoc} />
          <input
            ref={fileInputRef}
            type="file"
            accept={DOC_ACCEPT}
            multiple
            hidden
            aria-label="Adjuntar documentos"
            onChange={(e) => { if (e.target.files?.length) void addFiles(e.target.files); e.target.value = ""; }}
          />
          <div className="asst-pill">
            <button
              type="button"
              className="asst-attach"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Adjuntar un documento (PDF, Word o texto)"
              title="Adjuntar un documento (PDF, Word o texto) para analizarlo"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <textarea
              rows={1}
              value={input}
              placeholder={pendingDocs.length ? "Pregunta sobre el documento, o envía para un análisis completo…" : "Pregúntale a Basalt…"}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 170) + "px";
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
    </div>
  );
}
