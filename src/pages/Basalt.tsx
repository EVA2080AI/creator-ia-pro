import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Menu, Send, Square, Loader2, Trash2, Brain, Scale,
  LayoutTemplate, Image as ImageIcon, PenLine, BarChart3, Dice5, Sparkles, Bot, MessageSquare, X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useCopyCodeButtons } from "@/hooks/useCopyCodeButtons";
import { useProjectCards } from "@/hooks/useProjectCards";
import { useProfile } from "@/hooks/useProfile";
import { ModelPicker } from "@/components/basalt/ModelPicker";
import { BasaltShellSidebar } from "@/components/layout/BasaltShellSidebar";
import { hasSeenBasaltGuide } from "@/lib/basalt-guide";
import { brandCssVars } from "@/lib/assistants";
import { mdToHtml } from "@/lib/markdown";
import { CHAT_MODELS, IMAGE_MODELS, DEFAULT_IMAGE_MODEL_ID } from "@/lib/ai/models";
import {
  BASALT_ASSISTANT as A, buildSystemPrompt, parseBasaltReply,
  loadConversations, saveConversation, deleteConversation, loadMemory, saveMemory,
  migrateLegacyLocalStorage, CONTINUE_PROMPT, joinContinuation, type StoredConversation, type StoredMsg,
} from "@/lib/basalt";
import { createAsset, getAssetsByIds } from "@/lib/assets";
import "./Assistant.css";

const ICONS: Record<string, typeof LayoutTemplate> = {
  layout: LayoutTemplate, image: ImageIcon, pen: PenLine, chart: BarChart3, compare: Scale, dice: Dice5,
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
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
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
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const autoSentRef = useRef(false);
  const lastPromptRef = useRef("");

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

  // Al reabrir una conversación, las imágenes que sobrevivieron solo traen
  // assetId (su url pesada se sacó del historial al guardar — ver
  // saveConversation). Se resuelven en un solo pedido por lote y se
  // mezclan por m.id, así que si el usuario ya cambió de conversación para
  // cuando esto resuelve, el merge simplemente no encuentra nada que tocar.
  const rehydrateImages = useCallback(async (msgs: StoredMsg[]) => {
    const ids = Array.from(new Set(
      msgs.flatMap((m) => m.images ?? [])
        .filter((img) => !img.url && !img.error && img.assetId)
        .map((img) => img.assetId!)
    ));
    if (!ids.length) return;
    const assets = await getAssetsByIds(ids);
    const byId = new Map(assets.map((a) => [a.id, a.asset_url]));
    setMessages((prev) => prev.map((m) => (
      !m.images?.some((img) => img.assetId && !img.url && !img.error)
        ? m
        : {
            ...m,
            images: m.images!.map((img) => {
              if (img.url || img.error || !img.assetId) return img;
              const url = byId.get(img.assetId);
              return url
                ? { ...img, url }
                : { ...img, error: "Esta imagen no quedó guardada en el historial. Pídesela de nuevo si la necesitas." };
            }),
          }
    )));
  }, []);

  const sendPrompt = useCallback(async (prompt: string, opts?: { continueFrom?: string }) => {
    const text = prompt.trim();
    if (!text || generating) return;

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
    const restoreInput = () => { if (!continued) setInput((cur) => cur || text); };

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
          systemPrompt: buildSystemPrompt(memory),
          messages: [
            ...history.slice(-20).map((m) => ({ role: m.role === "model" ? "assistant" : "user", content: m.text })),
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
  }, [generating, messages, model, memory, userId, convId, stickToBottom, generateImages, persist, setParams]);

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
    void rehydrateImages(c.messages);
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
          <>
            <div className="asst-switcher-label">Conversaciones</div>
            {/* Antes tenía flex:1 — .asst-side-bottom (más abajo) usa
                margin-top:auto en el mismo flex column, y le ganaba todo el
                espacio a este contenedor dejándolo en 0px de alto (nunca se
                notó porque esta cuenta no tenía conversaciones guardadas
                hasta la migración a base de datos, 2026-09-29). El nav ya
                scrollea completo (overflow-y:auto), como la lista de
                Expertos — no hace falta un scroll anidado acá. */}
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
          <div className="asst-brand-name">Basalt</div>
          {/* Un solo selector para texto/código y motor de imagen (Basalt decide solo cuándo
              generar una imagen — etiqueta <imagen>, ver SYSTEM_PROMPT —; el motor elegido
              es CON QUÉ lo hace). Reemplaza a dos <select> nativos de 11px sin candado de plan. */}
          <ModelPicker model={model} imageModel={imageModel} tier={profile?.subscription_tier} onModel={setModel} onImageModel={setImageModel} />
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
              {errorBanner}
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
