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
  loadConversations, saveConversation, deleteConversation, migrateLegacyLocalStorage, CONTINUE_PROMPT, joinContinuation,
  type StoredConversation, type StoredMsg,
} from "@/lib/basalt";
import { mdToHtml } from "@/lib/markdown";
import { useDocAttachments } from "@/hooks/useDocAttachments";
import { PendingDocChips, SentDocChips } from "@/components/basalt/DocChips";
import { ConversationList } from "@/components/basalt/ConversationList";
import { DOC_ACCEPT } from "@/lib/doc-extract";
import { ATTACH_CARD_PROMPT, DEFAULT_DOC_PROMPT, DOC_ANALYSIS_PROMPT, buildApiMessages, hasDocuments, type DocPayload } from "@/lib/doc-context";
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
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messages, setMessages] = useState<StoredMsg[]>([]);
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Mensaje cuya respuesta se cortó por el límite de tiempo del servidor
  // (finish_reason "length") — habilita "Continuar" (igual que en Basalt.tsx).
  const [truncatedId, setTruncatedId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const userId = user?.id ?? "";
  // Documentos adjuntos: el texto vive solo en memoria (por mensaje) y viaja en el campo `documents`
  // de la petición, que el servidor usa para responder pero NO archiva (ver api/ai/chat.ts). En el
  // historial queda únicamente el nombre y el tamaño.
  const docsByMsg = useRef(new Map<string, DocPayload[]>());
  const { docs: pendingDocs, ready: readyDocs, busy: docsBusy, addFiles, remove: removeDoc, clear: clearDocs } = useDocAttachments();
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

  // Historial propio por Experto — mismo mecanismo que Basalt (homologado
  // 2026-09-29), separado por assistantSlug en la misma tabla.
  useEffect(() => {
    if (!userId) return;
    setConversationsLoading(true);
    void migrateLegacyLocalStorage(userId).then(() => {
      void loadConversations(userId, slug).then((c) => { setConversations(c); setConversationsLoading(false); });
    });
  }, [userId, slug]);

  const stickToBottom = useCallback(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useCopyCodeButtons(scrollerRef);
  useProjectCards(scrollerRef);

  const newChat = () => {
    abortRef.current?.abort();
    setConvId(crypto.randomUUID());
    setMessages([]);
    setError(null);
    clearDocs();
    setSidebarOpen(false);
  };

  const openConversation = (c: StoredConversation) => {
    abortRef.current?.abort();
    setConvId(c.id);
    setMessages(c.messages);
    setError(null);
    clearDocs();
    setSidebarOpen(false);
    requestAnimationFrame(stickToBottom);
  };

  const removeConversation = (id: string) => {
    void deleteConversation(userId, id)
      .then(() => loadConversations(userId, slug))
      .then(setConversations);
    if (id === convId) newChat();
  };

  const sendPrompt = useCallback(async (prompt: string, opts?: { continueFrom?: string; retry?: boolean }) => {
    // Adjuntar sin escribir nada = pedir el análisis completo (igual que en Basalt).
    const attached = opts?.continueFrom || opts?.retry ? [] : readyDocs;
    const text = prompt.trim() || (attached.length ? DEFAULT_DOC_PROMPT : "");
    if (!text || generating || !assistant || (!opts?.continueFrom && docsBusy)) return;

    // "Continuar": retoma un mensaje cortado, pegando el texto nuevo al final
    // del mismo mensaje (joinContinuation) en vez de abrir uno nuevo.
    const continued = opts?.continueFrom ? messages.find((m) => m.id === opts.continueFrom && m.role === "model") : undefined;
    const prefix = continued?.text ?? "";

    // "Reintentar" tras un error: la pregunta del usuario ya está en el hilo (solo se quitó la
    // respuesta vacía), así que se reenvía tal cual en vez de agregarla por segunda vez.
    const retrying = !continued && !!opts?.retry && messages[messages.length - 1]?.role === "user";
    const userMsg: StoredMsg = { id: crypto.randomUUID(), role: "user", text };
    if (attached.length) {
      userMsg.attachments = attached.map((d) => ({ name: d.name, chars: d.doc!.chars, pages: d.doc!.pages, truncated: d.doc!.truncated }));
      docsByMsg.current.set(userMsg.id, attached.map((d) => ({ name: d.name, text: d.doc!.text, truncated: d.doc!.truncated })));
      clearDocs();
    }
    const history = continued || retrying ? messages : [...messages, userMsg];
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
          assistantId: assistant.id,
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
      setMessages((prev) => prev.map((m) => (m.id === modelMsgId ? { ...m, text: finalText } : m)));
      if (!acc.trim()) {
        if (!continued) setMessages((prev) => prev.filter((m) => m.id !== modelMsgId));
        setError("El modelo no devolvió texto. Prueba a reformular la pregunta.");
      } else {
        if (cutOff) setTruncatedId(modelMsgId);
        if (userId) {
          const final: StoredMsg[] = continued
            ? history.map((m) => (m.id === modelMsgId ? { ...m, text: finalText } : m))
            : [...history, { id: modelMsgId, role: "model", text: finalText }];
          const title = (history.find((m) => m.role === "user")?.text ?? text).slice(0, 60);
          void saveConversation(userId, { id: convId, title, updatedAt: Date.now(), messages: final }, slug)
            .then(() => loadConversations(userId, slug))
            .then(setConversations);
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
      abortRef.current = null;
      stickToBottom();
    }
  }, [assistant, generating, messages, stickToBottom, userId, convId, slug, readyDocs, docsBusy, clearDocs]);

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
            conversations={conversations}
            loading={conversationsLoading}
            activeId={convId}
            onOpen={openConversation}
            onDelete={removeConversation}
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
          <div className="asst-brand-name">{assistant.name}</div>
        </header>

        <div className="asst-scroller" ref={scrollerRef}>
          {messages.length === 0 ? (
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
              placeholder={pendingDocs.length ? "Pregunta sobre el documento, o envía para un análisis completo…" : `Pregúntale a ${assistant.name}…`}
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
              onClick={generating ? handleStop : undefined}
              className={`asst-send ${generating ? "stop" : (input.trim() || readyDocs.length) && !docsBusy ? "ready" : ""}`}
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
