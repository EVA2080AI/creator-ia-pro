import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Menu, Plus, Send, Square, Sun, Moon, ArrowLeft, Loader2, Trash2, MessageSquare,
  LayoutTemplate, Image as ImageIcon, PenLine, BarChart3, Scale, Dice5, Wallet, Sparkles, Bot,
  ListTodo, FolderOpen, User, LogOut, ShieldCheck, Bug,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useTheme } from "@/hooks/useTheme";
import { Logo } from "@/components/Logo";
import { ReportModal } from "@/components/tickets/ReportModal";
import { ExpertsAccordion } from "@/components/layout/ExpertsAccordion";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  listAssistants, getAssistant, brandCssVars,
  type Assistant, type AssistantWelcomeCard,
} from "@/lib/assistants";
import {
  loadConversations, saveConversation, deleteConversation, migrateLegacyLocalStorage,
  type StoredConversation, type StoredMsg,
} from "@/lib/basalt";
import { mdToHtml } from "@/lib/markdown";
import "./Assistant.css";

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
  const { user, loading: authLoading, signOut } = useAuth("/auth");
  const { isAdmin } = useAdmin(user?.id);

  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [loadingAssistant, setLoadingAssistant] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  // Mismo tema global que el resto de la app — antes cada Experto tenía su
  // propio estado de tema local, y hasta forzaba oscuro según brand.theme,
  // peleando con la preferencia del usuario (auditoría UX 2026-09-29).
  const { resolvedTheme: theme, setTheme } = useTheme();

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
    // "genesis" era Basalt-como-constructor — redundante ahora que Basalt lo
    // absorbió; mismo filtro que BasaltShellSidebar (homologado 2026-09-29).
    listAssistants().then((all) => setAssistants(all.filter((a) => a.slug !== "genesis")));
  }, []);

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
  // 2026-09-29: "los expertos... deben tener también persistir sus chat"),
  // separado por assistantSlug en la misma tabla.
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

  const handleSwitchAssistant = (target: Assistant) => {
    setSidebarOpen(false);
    if (target.capabilities.code) {
      navigate("/a/basalt");
    } else {
      navigate(`/a/${target.slug}`);
    }
  };

  // Cierra el drawer móvil al navegar — varios botones del sidebar llamaban
  // a navigate() directo y dejaban el drawer abierto tapando la pantalla
  // tras el salto (auditoría UX 2026-09-29).
  const go = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

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

      <nav className={`asst-sidebar ${sidebarOpen ? "open" : ""}`} aria-label="Expertos">
        <div className="asst-side-top">
          <Logo size="sm" showText onClick={() => go("/a/basalt")} />
          <button className="asst-icon-btn" onClick={() => go("/a/basalt")} aria-label="Volver a Basalt" title="Volver a Basalt" style={{ display: "flex", alignItems: "center", width: "auto", gap: 6, padding: "0 10px" }}>
            <ArrowLeft className="w-4 h-4" />
            <span style={{ fontSize: 12, fontWeight: 700 }}>Basalt</span>
          </button>
        </div>
        <button className="asst-new-chat" onClick={newChat}>
          <Plus className="w-4 h-4" /> Nuevo chat
        </button>

        <ExpertsAccordion experts={assistants} activeSlug={slug} onSelect={handleSwitchAssistant} />

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

        <div className="asst-switcher-label">Plataforma</div>
        <button className="asst-side-link" onClick={() => go("/tasks")}>
          <ListTodo className="w-4 h-4" /> Tareas
        </button>
        <button className="asst-side-link" onClick={() => go("/spaces")}>
          <FolderOpen className="w-4 h-4" /> Proyectos
        </button>
        <button className="asst-side-link" onClick={() => go("/profile")}>
          <User className="w-4 h-4" /> Perfil
        </button>
        {isAdmin && (
          <button className="asst-side-link" onClick={() => go("/admin")}>
            <ShieldCheck className="w-4 h-4" /> Panel Admin
          </button>
        )}

        <div className="asst-side-bottom">
          <button className="asst-side-link" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === "dark" ? "Tema claro" : "Tema oscuro"}
          </button>
          {/* "Reportar" era un botón flotante suelto encima de todo — ahora
              es una opción que se despliega desde la cuenta (auditoría UX,
              mismo patrón que el menú de cuenta de Claude). */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="asst-side-link">
                <User className="w-4 h-4" /> Cuenta
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56 p-1.5 rounded-2xl shadow-2xl">
              <DropdownMenuItem className="rounded-xl gap-2.5 py-2.5 cursor-pointer" onClick={() => setShowReport(true)}>
                <Bug className="w-4 h-4" /> Reportar un error o mejora
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1.5" />
              <DropdownMenuItem className="rounded-xl gap-2.5 py-2.5 cursor-pointer text-rose-500 focus:text-rose-500" onClick={() => signOut()}>
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ReportModal open={showReport} onClose={() => setShowReport(false)} />
        </div>
      </nav>
      <div className={`asst-backdrop ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />

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
