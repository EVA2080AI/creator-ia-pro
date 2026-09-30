import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Menu, Send, Square, Loader2, Trash2, MessageSquare,
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
  loadConversations, saveConversation, deleteConversation, migrateLegacyLocalStorage,
  type StoredConversation, type StoredMsg,
} from "@/lib/basalt";
import { mdToHtml } from "@/lib/markdown";
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
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const userId = user?.id ?? "";

  useEffect(() => {
    setLoadingAssistant(true);
    setMessages([]);
    setConvId(crypto.randomUUID());
    setError(null);
    getAssistant(slug).then((a) => {
      setAssistant(a);
      setLoadingAssistant(false);
    });
  }, [slug]);

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
    setSidebarOpen(false);
  };

  const openConversation = (c: StoredConversation) => {
    abortRef.current?.abort();
    setConvId(c.id);
    setMessages(c.messages);
    setError(null);
    setSidebarOpen(false);
    requestAnimationFrame(stickToBottom);
  };

  const removeConversation = (id: string) => {
    void deleteConversation(userId, id)
      .then(() => loadConversations(userId, slug))
      .then(setConversations);
    if (id === convId) newChat();
  };

  const sendPrompt = useCallback(async (prompt: string) => {
    const text = prompt.trim();
    if (!text || generating || !assistant) return;

    const userMsg: StoredMsg = { id: crypto.randomUUID(), role: "user", text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setGenerating(true);
    setError(null);
    requestAnimationFrame(stickToBottom);

    const modelMsgId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: modelMsgId, role: "model", text: "" }]);

    abortRef.current = new AbortController();
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "include",
        signal: abortRef.current.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: assistant.defaultModel,
          systemPrompt: assistant.persona.systemPrompt || undefined,
          // Mismo tope que Basalt.tsx — sin esto, una conversación larga con
          // un Experto arriesga pegar contra el límite de contexto del
          // modelo (auditoría UX 2026-09-29).
          messages: history.slice(-20).map((m) => ({ role: m.role === "model" ? "assistant" : "user", content: m.text })),
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
            const delta = json.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length) {
              acc += delta;
              const now = Date.now();
              if (now - lastPaint > 40) {
                setMessages((prev) => prev.map((m) => (m.id === modelMsgId ? { ...m, text: acc } : m)));
                lastPaint = now;
                stickToBottom();
              }
            }
          } catch {
            /* fragmento no-JSON */
          }
        }
      }
      setMessages((prev) => prev.map((m) => (m.id === modelMsgId ? { ...m, text: acc } : m)));
      if (!acc.trim()) {
        setMessages((prev) => prev.filter((m) => m.id !== modelMsgId));
        setError("El modelo no devolvió texto. Prueba a reformular la pregunta.");
      } else if (userId) {
        const final: StoredMsg[] = [...history, { id: modelMsgId, role: "model", text: acc }];
        void saveConversation(userId, { id: convId, title: text.slice(0, 60), updatedAt: Date.now(), messages: final }, slug)
          .then(() => loadConversations(userId, slug))
          .then(setConversations);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        // detenido a propósito — conserva lo que se alcanzó a generar
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== modelMsgId));
        setError(e instanceof Error ? e.message : "Error al generar la respuesta.");
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
      stickToBottom();
    }
  }, [assistant, generating, messages, stickToBottom, userId, convId, slug]);

  const handleStop = () => abortRef.current?.abort();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendPrompt(input);
  };

  const cssVars = useMemo(() => (assistant ? brandCssVars(assistant.brand) : {}), [assistant]);

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
          <>
            <div className="asst-switcher-label">Conversaciones</div>
            <div>
              {conversationsLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 12px", fontSize: 12, color: "var(--asst-txt-3)" }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando…
                </div>
              ) : conversations.length === 0 ? (
                <p style={{ padding: "4px 12px", fontSize: 12, color: "var(--asst-txt-3)" }}>Todavía no hay conversaciones guardadas.</p>
              ) : (
                conversations.map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center" }}>
                    <button className={`asst-switch-item ${c.id === convId ? "active" : ""}`} onClick={() => openConversation(c)} style={{ flex: 1, minWidth: 0 }}>
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                    </button>
                    <button className="asst-icon-btn" onClick={() => removeConversation(c.id)} aria-label="Borrar conversación">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        }
      />

      <main className="asst-main">
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
                {(assistant.welcome.cards || []).map((c: AssistantWelcomeCard) => (
                  <button key={c.label} className="asst-card" onClick={() => void sendPrompt(c.prompt)}>
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
                    <div className="asst-bubble">{m.text}</div>
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
              {error && (
                <div className="asst-err">
                  <span>⚠️ {error}</span>
                  <button onClick={() => void sendPrompt(messages[messages.length - 1]?.text || "")}>Reintentar</button>
                </div>
              )}
            </div>
          )}
        </div>

        <form className="asst-composer" onSubmit={handleSubmit}>
          <div className="asst-pill">
            <textarea
              rows={1}
              value={input}
              placeholder={`Pregúntale a ${assistant.name}…`}
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
              className={`asst-send ${generating ? "stop" : input.trim() ? "ready" : ""}`}
              aria-label={generating ? "Detener" : "Enviar"}
            >
              {generating ? <Square className="w-3.5 h-3.5" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="asst-disclaimer">{assistant.name} puede cometer errores. Verifica la información importante.</p>
        </form>
      </main>
    </div>
  );
}
