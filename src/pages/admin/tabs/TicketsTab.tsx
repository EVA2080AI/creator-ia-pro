import { useEffect, useState } from "react";
import { Bug, Sparkles, Loader2, Inbox } from "lucide-react";
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
}

const STATUS_LABEL: Record<Ticket["status"], string> = {
  abierto: "Abierto",
  en_progreso: "En progreso",
  resuelto: "Resuelto",
};

const STATUS_STYLE: Record<Ticket["status"], string> = {
  abierto: "bg-red-50 text-red-600 border-red-100",
  en_progreso: "bg-amber-50 text-amber-600 border-amber-100",
  resuelto: "bg-emerald-50 text-emerald-600 border-emerald-100",
};

export function TicketsTab() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

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

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-zinc-300" /></div>;
  }

  if (!tickets.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-zinc-200 bg-white py-20 text-center">
        <Inbox className="h-8 w-8 text-zinc-300" />
        <p className="text-[13px] font-bold text-zinc-400">Sin tickets todavía.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((t) => (
        <div key={t.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                t.type === "bug" ? "bg-red-50 text-red-500" : "bg-primary/10 text-primary")}>
                {t.type === "bug" ? <Bug className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              </div>
              <div>
                <p className="text-[13px] font-bold text-zinc-900">{t.title}</p>
                {t.description && <p className="mt-0.5 text-[12px] text-zinc-500">{t.description}</p>}
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                  {t.pageUrl || "—"} · {new Date(t.createdAt).toLocaleString("es-CO")}
                </p>
              </div>
            </div>
            <select
              value={t.status}
              disabled={updating === t.id}
              onChange={(e) => void setStatus(t.id, e.target.value as Ticket["status"])}
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
