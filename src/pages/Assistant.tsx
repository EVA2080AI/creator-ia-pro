import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Menu, Plus, Send, Square, Sun, Moon, ArrowLeft, Loader2,
  LayoutTemplate, Image as ImageIcon, PenLine, BarChart3, Scale, Dice5, Wallet, Sparkles, Bot,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listAssistants, getAssistant, brandCssVars,
  type Assistant, type AssistantWelcomeCard,
} from "@/lib/assistants";
import { mdToHtml } from "@/lib/markdown";
import "./Assistant.css";

interface ChatMsg {
  id: string;
  role: "user" | "model";
  text: string;
}

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

  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [loadingAssistant, setLoadingAssistant] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listAssistants().then(setAssistants);
  }, []);

  useEffect(() => {
    setLoadingAssistant(true);
    setMessages([]);
    setError(null);
    getAssistant(slug).then((a) => {
      setAssistant(a);
      setLoadingAssistant(false);
      if (a?.brand.theme === "dark") setTheme("dark");
    });
  }, [slug]);

  const stickToBottom = useCallback(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const handleSwitchAssistant = (target: Assistant) => {
    setSidebarOpen(false);
    if (target.capabilities.code) {
      navigate("/chat");
    } else {
      navigate(`/a/${target.slug}`);
    }
  };

  const sendPrompt = useCallback(async (prompt: string) => {
    const text = prompt.trim();
    if (!text || generating || !assistant) return;

    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", text };
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
          messages: history.map((m) => ({ role: m.role === "model" ? "assistant" : "user", content: m.text })),
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
  }, [assistant, generating, messages, stickToBottom]);

  const handleStop = () => abortRef.current?.abort();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendPrompt(input);
  };

  const cssVars = useMemo(() => (assistant ? brandCssVars(assistant.brand) : {}), [assistant]);

  if (authLoading || loadingAssistant) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-7 w-7 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (!assistant) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-white text-center px-6">
        <p className="text-sm text-zinc-500">No encontramos este asistente.</p>
        <button onClick={() => navigate("/dashboard")} className="text-sm font-bold text-primary underline">Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="asst-app" data-asst-theme={theme} style={cssVars as React.CSSProperties}>
      <Helmet><title>{assistant.name} | Creator IA Pro</title></Helmet>

      <nav className={`asst-sidebar ${sidebarOpen ? "open" : ""}`} aria-label="Asistentes">
        <div className="asst-side-top">
          <button className="asst-icon-btn" onClick={() => navigate("/dashboard")} aria-label="Volver al inicio">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
        <button className="asst-new-chat" onClick={() => { setMessages([]); setSidebarOpen(false); }}>
          <Plus className="w-4 h-4" /> Nuevo chat
        </button>

        <div className="asst-switcher-label">Asistentes</div>
        {assistants.map((a) => (
          <button
            key={a.slug}
            className={`asst-switch-item ${a.slug === slug ? "active" : ""}`}
            onClick={() => handleSwitchAssistant(a)}
          >
            <span className="asst-switch-dot" style={a.slug === slug ? undefined : { background: "var(--asst-txt-3)" }} />
            {a.name}
          </button>
        ))}

        <div className="asst-side-bottom">
          <button className="asst-side-link" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === "dark" ? "Tema claro" : "Tema oscuro"}
          </button>
        </div>
      </nav>
      <div className={`asst-backdrop ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />

      <main className="asst-main">
        <header className="asst-topbar">
          <button className="asst-icon-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú" style={{ display: sidebarOpen ? "none" : undefined }}>
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
