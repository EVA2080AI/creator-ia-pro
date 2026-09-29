import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Scale, Send, Square, Trophy, Loader2, Plus, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { mdToHtml } from "@/lib/markdown";
import { CHAT_MODELS, getModel } from "@/lib/ai/models";
import "./Assistant.css";

// Arena IA: el mismo prompt a varios modelos en paralelo para comparar
// respuestas lado a lado y votar la mejor. Usa /api/ai/chat (cada columna
// cobra lo que cobre su modelo).

interface Lane {
  model: string;
  text: string;
  status: "idle" | "streaming" | "done" | "error";
  error?: string;
  ms?: number;
}

const DEFAULT_LANES = ["google/gemini-2.5-flash-lite", "deepseek/deepseek-chat-v3.1", "meta-llama/llama-3.3-70b-instruct"]
  .filter((id) => CHAT_MODELS.some((m) => m.id === id));

const SYSTEM = "Responde en español de forma clara y útil. Usa markdown cuando ayude.";

export default function ArenaPage() {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth("/auth");
  const [lanes, setLanes] = useState<Lane[]>(DEFAULT_LANES.map((model) => ({ model, text: "", status: "idle" })));
  const [prompt, setPrompt] = useState("");
  const [askedPrompt, setAskedPrompt] = useState("");
  const [winner, setWinner] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const running = lanes.some((l) => l.status === "streaming");

  const patch = (i: number, p: Partial<Lane>) => setLanes((prev) => prev.map((l, k) => (k === i ? { ...l, ...p } : l)));

  const runLane = async (i: number, model: string, text: string, signal: AbortSignal) => {
    const t0 = performance.now();
    patch(i, { text: "", status: "streaming", error: undefined, ms: undefined });
    let acc = "";
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "include",
        signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, systemPrompt: SYSTEM, messages: [{ role: "user", content: text }], temperature: 0.7 }),
      });
      if (!res.ok || res.headers.get("content-type")?.includes("application/json")) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Error ${res.status}`);
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
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
            if (typeof delta === "string" && delta) {
              acc += delta;
              patch(i, { text: acc });
            }
          } catch { /* fragmento no-JSON */ }
        }
      }
      patch(i, { text: acc, status: "done", ms: Math.round(performance.now() - t0) });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        patch(i, { status: "done", ms: Math.round(performance.now() - t0) });
      } else {
        patch(i, { status: "error", error: e instanceof Error ? e.message : "Error" });
      }
    }
  };

  const run = () => {
    const text = prompt.trim();
    if (!text || running) return;
    setAskedPrompt(text);
    setWinner(null);
    abortRef.current = new AbortController();
    lanes.forEach((l, i) => void runLane(i, l.model, text, abortRef.current!.signal));
  };

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="h-7 w-7 animate-spin text-zinc-300" /></div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Helmet><title>Arena IA | Creator IA Pro</title></Helmet>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate("/a/basalt")} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100" aria-label="Volver a Basalt">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Scale className="h-5 w-5 text-primary" />
        <h1 className="font-display text-lg font-black text-zinc-900">Arena IA</h1>
        <span className="hidden text-[12px] text-zinc-500 sm:inline">Compara modelos con el mismo prompt y vota el mejor</span>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <form
          onSubmit={(e) => { e.preventDefault(); run(); }}
          className="mb-6 flex items-end gap-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm"
        >
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); run(); } }}
            placeholder="Escribe un prompt para comparar, ej: Escribe 3 copys para lanzar un curso de IA para pymes"
            className="flex-1 resize-none bg-transparent px-2 py-1 text-[14px] outline-none"
          />
          {running ? (
            <button type="button" onClick={() => abortRef.current?.abort()} className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-[13px] font-bold text-white">
              <Square className="h-3.5 w-3.5" /> Detener
            </button>
          ) : (
            <button type="submit" disabled={!prompt.trim()} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground disabled:opacity-40">
              <Send className="h-4 w-4" /> Comparar
            </button>
          )}
        </form>

        {askedPrompt && <p className="mb-3 text-[13px] text-zinc-500">Prompt: <span className="font-semibold text-zinc-800">{askedPrompt}</span></p>}

        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))` }}>
          {lanes.map((lane, i) => {
            const m = getModel(lane.model);
            const isWinner = winner === lane.model;
            return (
              <section key={i} className={`flex flex-col rounded-2xl border bg-white ${isWinner ? "border-amber-400 ring-2 ring-amber-200" : "border-zinc-200"}`}>
                <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
                  <select
                    value={lane.model}
                    disabled={running}
                    onChange={(e) => patch(i, { model: e.target.value, text: "", status: "idle" })}
                    className="min-w-0 flex-1 rounded-lg bg-zinc-50 px-2 py-1.5 text-[12px] font-bold text-zinc-700 outline-none"
                  >
                    {CHAT_MODELS.map((cm) => (
                      <option key={cm.id} value={cm.id}>{cm.label} {cm.free ? "· gratis" : `· ${cm.credits} cr`}</option>
                    ))}
                  </select>
                  {lanes.length > 2 && !running && (
                    <button onClick={() => setLanes((prev) => prev.filter((_, k) => k !== i))} className="rounded p-1 text-zinc-400 hover:text-zinc-700" aria-label="Quitar modelo">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="asst-md min-h-[220px] flex-1 overflow-auto px-4 py-3 text-[14px]" style={{ maxHeight: "60vh" }}>
                  {lane.status === "error" ? (
                    <p className="text-[13px] text-red-600">{lane.error}</p>
                  ) : lane.text ? (
                    <div dangerouslySetInnerHTML={{ __html: mdToHtml(lane.text) }} />
                  ) : lane.status === "streaming" ? (
                    <div className="flex items-center gap-2 text-[12px] text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" /> Pensando…</div>
                  ) : (
                    <p className="text-[12px] text-zinc-400">{m.provider} · {m.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-zinc-100 px-3 py-2 text-[11px] text-zinc-400">
                  <span>{lane.ms ? `${(lane.ms / 1000).toFixed(1)} s` : ""}</span>
                  <button
                    disabled={lane.status !== "done" || running}
                    onClick={() => setWinner(lane.model)}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold disabled:opacity-30 ${isWinner ? "bg-amber-100 text-amber-700" : "text-zinc-600 hover:bg-zinc-100"}`}
                  >
                    <Trophy className="h-3.5 w-3.5" /> {isWinner ? "Ganador" : "Votar"}
                  </button>
                </div>
              </section>
            );
          })}
          {lanes.length < 4 && !running && (
            <button
              onClick={() => setLanes((prev) => [...prev, { model: CHAT_MODELS.find((m) => !prev.some((l) => l.model === m.id))?.id ?? CHAT_MODELS[0].id, text: "", status: "idle" }])}
              className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-200 text-[13px] font-bold text-zinc-400 hover:border-primary hover:text-primary"
            >
              <Plus className="h-5 w-5" /> Agregar modelo
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
