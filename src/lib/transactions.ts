// Cliente de /api/billing/transactions — usado por el Dashboard para mostrar
// actividad real de la cuenta (antes: datos de ejemplo hardcodeados).
export interface Transaction {
  id: string;
  userId: string;
  type: "purchase" | "spend" | "admin_grant" | "admin_deduct" | "refund" | "bold_pending" | "bold_approved" | "subscription_change";
  amount: number;
  description: string | null;
  createdAt: string;
}

async function api<T>(path: string): Promise<{ ok: boolean; error?: string; data?: T }> {
  try {
    const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" } });
    const json = await res.json();
    if (!res.ok || !json.ok) return { ok: false, error: json.error || `Error ${res.status}` };
    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de red" };
  }
}

export async function listTransactions(): Promise<Transaction[]> {
  const res = await api<{ transactions: Transaction[] }>("/api/billing/transactions");
  return res.ok ? res.data!.transactions : [];
}

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

/** Créditos gastados por día en los últimos 7 días, para el gráfico de actividad del Dashboard. */
export function weeklySpend(transactions: Transaction[]): { name: string; credits: number }[] {
  const days: { name: string; credits: number; dateKey: string }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ name: DAY_LABELS[d.getDay()], credits: 0, dateKey: d.toDateString() });
  }
  for (const t of transactions) {
    if (t.type !== "spend") continue;
    const dateKey = new Date(t.createdAt).toDateString();
    const day = days.find((d) => d.dateKey === dateKey);
    if (day) day.credits += Math.abs(t.amount);
  }
  return days.map(({ name, credits }) => ({ name, credits }));
}

const TOOL_LABELS: Record<string, string> = {
  chat: "Chat",
  image: "Imagen",
  sharescreen: "Videollamada",
};

/** Créditos gastados por tipo de herramienta, derivado de la descripción real de cada transacción
 * ("chat: <modelo>", "image: <modelo>", "sharescreen|p2p" — ver api/_lib/credits.ts logSpend). */
export function toolBreakdown(transactions: Transaction[]): { name: string; value: number; color: string }[] {
  const colors = ["bg-primary", "bg-emerald-400", "bg-blue-400", "bg-amber-400"];
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "spend") continue;
    const key = (t.description || "").split(/[:|]/)[0].trim().toLowerCase();
    const label = TOOL_LABELS[key] || (key ? key[0].toUpperCase() + key.slice(1) : "Otro");
    totals.set(label, (totals.get(label) || 0) + Math.abs(t.amount));
  }
  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
}
