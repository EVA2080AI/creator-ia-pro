import { useEffect, useMemo, useState } from "react";
import { Bug, Sparkles, Loader2, Inbox, ShieldCheck, ClipboardCopy } from "lucide-react";
import { toast } from "sonner";
import { formatTicketsForClaude } from "@/lib/ticket-format";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  userId: string;
  type: "bug" | "mejora";
  title: string;
  description: string | null;
  pageUrl: string | null;
  status: "abierto" | "en_progreso" | "resuelto";
  createdAt: string;
  authorName?: string | null;
  authorEmail?: string | null;
  authorIsAdmin?: boolean | null;
}

const STATUS_LABEL: Record<Ticket["status"], string> = {
  abierto: "Abierto",
  en_progreso: "En progreso",
  resuelto: "Resuelto",
};

const STATUS_STYLE: Record<Ticket["status"], string> = {
  abierto: "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30",
  en_progreso: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
  resuelto: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
};

type StatusFilter = "todos" | Ticket["status"];
type TypeFilter = "todos" | Ticket["type"];

const STATUS_ORDER: Record<Ticket["status"], number> = { abierto: 0, en_progreso: 1, resuelto: 2 };

export function TicketsTab() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("todos");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets", { credentials: "include" });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.ok) setTickets(body.tickets);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const setStatus = async (id: string, status: Ticket["status"]) => {
    setUpdating(id);
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } finally {
      setUpdating(null);
    }
  };

  // Texto listo para pegarle a Claude en el chat: los pendientes, con quién los escribió y si es admin.
  const copyPending = async () => {
    try {
      await navigator.clipboard.writeText(formatTicketsForClaude(tickets));
      toast.success("Pendientes copiados: pégalos en el chat con Claude.");
    } catch {
      toast.error("No se pudo copiar. Revisa los permisos del portapapeles.");
    }
  };

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { todos: tickets.length, abierto: 0, en_progreso: 0, resuelto: 0 };
    for (const t of tickets) c[t.status]++;
    return c;
  }, [tickets]);

  // Lo pendiente primero (abierto → en progreso → resuelto), y dentro de cada estado lo más nuevo arriba.
  const visible = useMemo(
    () =>
      tickets
        .filter((t) => (statusFilter === "todos" || t.status === statusFilter) && (typeFilter === "todos" || t.type === typeFilter))
        .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || +new Date(b.createdAt) - +new Date(a.createdAt)),
    [tickets, statusFilter, typeFilter],
  );

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!tickets.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card py-20 text-center">
        <Inbox className="h-8 w-8 text-muted-foreground" />
        <p className="text-[13px] font-bold text-muted-foreground">Sin tickets todavía.</p>
      </div>
    );
  }

  const chip = (active: boolean) =>
    cn("rounded-full border px-3 py-1 text-[12px] font-bold", active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar tickets">
        {(["todos", "abierto", "en_progreso", "resuelto"] as StatusFilter[]).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={chip(statusFilter === s)} aria-pressed={statusFilter === s}>
            {s === "todos" ? "Todos" : STATUS_LABEL[s]} · {counts[s]}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-border" aria-hidden />
        {(["todos", "mejora", "bug"] as TypeFilter[]).map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)} className={chip(typeFilter === t)} aria-pressed={typeFilter === t}>
            {t === "todos" ? "Todo tipo" : t === "mejora" ? "Mejoras" : "Errores"}
          </button>
        ))}
        <button onClick={() => void copyPending()} className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[12px] font-bold text-primary-foreground">
          <ClipboardCopy className="h-3.5 w-3.5" aria-hidden /> Copiar pendientes para Claude
        </button>
      </div>

      {!visible.length && <p className="py-10 text-center text-[13px] font-bold text-muted-foreground">Ningún ticket con ese filtro.</p>}

      {visible.map((t) => (
        <div key={t.id} className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                t.type === "bug" ? "bg-red-50 text-red-500 dark:bg-red-500/10" : "bg-primary/10 text-primary")}>
                {t.type === "bug" ? <Bug className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              </div>
              <div>
                <p className="text-[13px] font-bold text-foreground">{t.title}</p>
                {t.description && <p className="mt-0.5 whitespace-pre-wrap text-[12px] text-muted-foreground">{t.description}</p>}
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {t.authorName && <span>{t.authorName}</span>}
                  {t.authorIsAdmin && (
                    <span className="inline-flex items-center gap-0.5 text-primary"><ShieldCheck className="h-3 w-3" aria-hidden /> admin</span>
                  )}
                  <span>· {t.pageUrl || "—"} · {new Date(t.createdAt).toLocaleString("es-CO")}</span>
                </p>
              </div>
            </div>
            <select
              value={t.status}
              disabled={updating === t.id}
              onChange={(e) => void setStatus(t.id, e.target.value as Ticket["status"])}
              aria-label={`Estado de "${t.title}"`}
              className={cn("shrink-0 rounded-lg border px-2 py-1 text-[11px] font-bold outline-none", STATUS_STYLE[t.status])}
            >
              {(Object.keys(STATUS_LABEL) as Ticket["status"][]).map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
