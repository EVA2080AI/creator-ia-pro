import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Bug, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

// Botón flotante para reportar un error o pedir una mejora desde cualquier
// pantalla de la app — montado una sola vez a nivel global (src/App.tsx), no
// solo dentro de AppLayout, porque Basalt/Arena/Chat tienen shell propio.
// Ver api/tickets.ts y la pestaña "Tickets" en /admin.
export function ReportButton() {
  const { user } = useAuth(); // sin redirectTo: no fuerza login, solo oculta el botón si no hay sesión
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"bug" | "mejora">("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);

  const reset = () => {
    setTitle("");
    setDescription("");
    setType("bug");
  };

  const submit = async () => {
    if (!title.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title: title.trim(), description: description.trim() || undefined, pageUrl: location.pathname }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) throw new Error(body?.error || `Error ${res.status}`);
      toast.success(type === "bug" ? "¡Gracias! Ya reportamos el error." : "¡Gracias! Ya anotamos tu idea.");
      reset();
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar el reporte.");
    } finally {
      setSending(false);
    }
  };

  // Sin sesión no hay a quién asociar el ticket — se oculta en vez de forzar login.
  if (!user) return null;
  // No estorba dentro del builder de apps (preview a pantalla completa).
  if (location.pathname.startsWith("/chat")) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Reportar un error o mejora"
        title="Reportar un error o mejora"
        // bottom-left, no bottom-right: ahí es donde ya viven el botón de
        // enviar del chat (Basalt/Experts) y el FAB "+ Nueva tarea" (Tareas).
        className="fixed bottom-5 left-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 transition-transform hover:scale-105 active:scale-95"
      >
        <Bug className="h-4.5 w-4.5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center" onClick={() => !sending && setOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-[15px] font-black text-zinc-900">Reportar</h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100" aria-label="Cerrar">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 flex gap-2">
              <button
                onClick={() => setType("bug")}
                className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-bold", type === "bug" ? "border-red-200 bg-red-50 text-red-600" : "border-zinc-200 text-zinc-500")}
              >
                <Bug className="h-3.5 w-3.5" /> Error
              </button>
              <button
                onClick={() => setType("mejora")}
                className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-bold", type === "mejora" ? "border-primary/30 bg-primary/5 text-primary" : "border-zinc-200 text-zinc-500")}
              >
                <Sparkles className="h-3.5 w-3.5" /> Mejora
              </button>
            </div>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "bug" ? "¿Qué salió mal?" : "¿Qué te gustaría que tuviera?"}
              className="mb-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-[13px] outline-none focus:border-primary"
              autoFocus
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cuéntanos más (opcional)"
              rows={3}
              className="mb-4 w-full resize-none rounded-xl border border-zinc-200 px-3 py-2 text-[13px] outline-none focus:border-primary"
            />

            <button
              onClick={submit}
              disabled={!title.trim() || sending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
