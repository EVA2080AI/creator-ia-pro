import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Menu, Send, Square, Loader2, Trash2, Brain, Scale,
  LayoutTemplate, Image as ImageIcon, PenLine, BarChart3, Dice5, Sparkles, Bot, MessageSquare, X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BasaltShellSidebar } from "@/components/layout/BasaltShellSidebar";
import { brandCssVars } from "@/lib/assistants";
import { mdToHtml } from "@/lib/markdown";
import { CHAT_MODELS } from "@/lib/ai/models";
import {
  BASALT_ASSISTANT as A, buildSystemPrompt, parseBasaltReply, isAppBuildRequest,
  loadConversations, saveConversation, deleteConversation, loadMemory, saveMemory,
  type StoredConversation, type StoredMsg,
} from "@/lib/basalt";
import "./Assistant.css";

const ICONS: Record<string, typeof LayoutTemplate> = {
  layout: LayoutTemplate, image: ImageIcon, pen: PenLine, chart: BarChart3, compare: Scale, dice: Dice5,
};

const MODEL_KEY = "basalt:model";

function readModel() {
  try {
    const m = localStorage.getItem(MODEL_KEY);
    if (m && CHAT_MODELS.some((x) => x.id === m)) return m;
  } catch { /* sin storage */ }
  return A.defaultModel;
}

export default function BasaltPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth("/auth");
  const userId = user?.id ?? "";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [model, setModel] = useState(readModel);

  const [convId, setConvId] = useState<string>(() => crypto.randomUUID());
  const [messages, setMessages] = useState<StoredMsg[]>([]);
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [memory, setMemory] = useState<string[]>([]);
  const [showMemory, setShowMemory] = useState(false);

  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const autoSentRef = useRef(false);
  const lastPromptRef = useRef("");

  useEffect(() => {
    if (!userId) return;
    setConversations(loadConversations(userId));
    setMemory(loadMemory(userId));
  }, [userId]);

  useEffect(() => {
    try { localStorage.setItem(MODEL_KEY, model); } catch { /* sin storage */ }
  }, [model]);

  const stickToBottom = useCallback(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const persist = useCallback((id: string, msgs: StoredMsg[]) => {
    if (!userId || !msgs.length) return;
    const first = msgs.find((m) => m.role === "user")?.text ?? "Nueva conversación";
    saveConversation(userId, { id, title: first.slice(0, 60), updatedAt: Date.now(), messages: msgs });
    setConversations(loadConversations(userId));
  }, [userId]);

  const generateImages = useCallback(async (base: StoredMsg[], msgId: string, imgs: { prompt: string; format: string }[]) => {
    const results = await Promise.all(imgs.map(async (img) => {
      try {
        const res = await fetch("/api/ai/image", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: img.prompt, aspectRatio: img.format }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.ok) return { ...img, error: body?.error || `Error ${res.status}` };
        return { ...img, url: body.imageUrl as string };
      } catch (e) {
        return { ...img, error: e instanceof Error ? e.message : "No se pudo generar la imagen." };
      }
    }));
    const final = base.map((m) => (m.id === msgId ? { ...m, images: results } : m));
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, images: results } : m)));
    return final;
  }, []);

  const sendPrompt = useCallback(async (prompt: string) => {
    const text = prompt.trim();
    if (!text || generating) return;

    // El creador de apps vive dentro de Basalt: si el pedido es claramente
    // construir una app/web, se manda al motor de construcción (StudioChat)
    // en vez de responder por texto.
    if (isAppBuildRequest(text)) {
      navigate(`/chat?prompt=${encodeURIComponent(text)}`);
      return;
    }

    lastPromptRef.current = text;
    const userMsg: StoredMsg = { id: crypto.randomUUID(), role: "user", text };
    const history = [...messages, userMsg];
    const modelMsgId = crypto.randomUUID();
    setMessages([...history, { id: modelMsgId, role: "model", text: "" }]);
    setInput("");
    setGenerating(true);
    setError(null);
    requestAnimationFrame(stickToBottom);

    abortRef.current = new AbortController();
    let acc = "";
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "include",
        signal: abortRef.current.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          systemPrompt: buildSystemPrompt(memory),
          messages: history.slice(-20).map((m) => ({ role: m.role === "model" ? "assistant" : "user", content: m.text })),
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
            const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length) {
              acc += delta;
              const now = Date.now();
              if (now - lastPaint > 40) {
                const { visible } = parseBasaltReply(acc);
                setMessages((prev) => prev.map((m) => (m.id === modelMsgId ? { ...m, text: visible } : m)));
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
        setGenerating(false);
        abortRef.current = null;
        return;
      }
    }

    const { visible, memories, images } = parseBasaltReply(acc);
    if (!visible && !images.length) {
      setMessages(messages);
      setError("El modelo no devolvió texto. Prueba a reformular la pregunta.");
      setGenerating(false);
      abortRef.current = null;
      return;
    }

    let final: StoredMsg[] = [
      ...history,
      { id: modelMsgId, role: "model", text: visible, images: images.length ? images : undefined },
    ];
    setMessages(final);

    if (memories.length && userId) {
      const next = [...memory, ...memories.filter((f) => !memory.includes(f))];
      setMemory(next);
      saveMemory(userId, next);
    }

    setGenerating(false);
    abortRef.current = null;
    stickToBottom();

    if (images.length) {
      final = await generateImages(final, modelMsgId, images);
      stickToBottom();
    }
    persist(convId, final);
  }, [generating, messages, model, memory, userId, convId, stickToBottom, generateImages, persist, navigate]);

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
    deleteConversation(userId, id);
    setConversations(loadConversations(userId));
    if (id === convId) newChat();
  };

  const removeMemory = (fact: string) => {
    const next = memory.filter((m) => m !== fact);
    setMemory(next);
    saveMemory(userId, next);
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-7 w-7 animate-spin text-zinc-300" />
      </div>
    );
  }

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
          <>
            <div className="asst-switcher-label">Conversaciones</div>
            <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
              {conversations.map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center" }}>
                  <button className={`asst-switch-item ${c.id === convId ? "active" : ""}`} onClick={() => openConversation(c)} style={{ flex: 1, minWidth: 0 }}>
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                  </button>
                  <button className="asst-icon-btn" onClick={() => removeConversation(c.id)} aria-label="Borrar conversación">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </>
        }
      />

      <main className="asst-main">
        <header className="asst-topbar">
          <button className="asst-icon-btn asst-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú" style={{ display: sidebarOpen ? "none" : undefined }}>
            <Menu className="w-4 h-4" />
          </button>
          <div className="asst-brand-name">Basalt</div>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            aria-label="Modelo"
            className="asst-model-select"
          >
            {CHAT_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} {m.free ? "· gratis" : `· ${m.credits} cr`}
              </option>
            ))}
          </select>
        </header>

        <div className="asst-scroller" ref={scrollerRef}>
          {messages.length === 0 ? (
            <section className="asst-welcome">
              <h1 className="asst-hello">{A.welcome.title}</h1>
              <p className="asst-hello-sub">{A.welcome.subtitle}</p>
              <div className="asst-cards">
                {(A.welcome.cards || []).map((c) => {
                  const Icon = (c.icon && ICONS[c.icon]) || Sparkles;
                  return (
                    <button key={c.label} className="asst-card" onClick={() => void sendPrompt(c.prompt)}>
                      <span>{c.label}</span>
                      <span className="asst-card-ic"><Icon className="w-4 h-4" /></span>
                    </button>
                  );
                })}
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
              {error && (
                <div className="asst-err">
                  <span>⚠️ {error}</span>
                  <button onClick={() => void sendPrompt(lastPromptRef.current)}>Reintentar</button>
                </div>
              )}
            </div>
          )}
        </div>

        <form className="asst-composer" onSubmit={(e) => { e.preventDefault(); void sendPrompt(input); }}>
          <div className="asst-pill">
            <textarea
              rows={1}
              value={input}
              placeholder="Pregúntale a Basalt…"
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
              className={`asst-send ${generating ? "stop" : input.trim() ? "ready" : ""}`}
              aria-label={generating ? "Detener" : "Enviar"}
            >
              {generating ? <Square className="w-3.5 h-3.5" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="asst-disclaimer">Basalt puede cometer errores. Verifica la información importante.</p>
        </form>
      </main>
    </div>
  );
}
