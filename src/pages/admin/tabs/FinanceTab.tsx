// Panel financiero del admin — MRR estimado y suscripciones por plan.
//
// MRR = sum(usuarios[plan] × precio[plan]). Los `tiers` vienen del mismo
// `/api/admin/stats` (agrupado por `profile.subscription_tier`); los precios de
// `src/lib/limits.ts` (fuente de verdad compartida con /pricing).
//
// Qué NO entra todavía (siguiente ciclo, requiere endpoint): ingresos REALES
// desde `transaction` (type IN ('purchase', 'bold_approved')) con el monto en
// COP, última recarga, suscripciones próximas a vencer. Hoy la tabla
// `transaction` guarda el amount en CRÉDITOS, no en COP, así que para montos
// en pesos hay que mapear amount→pack vía CREDIT_PACKS o plan→PLAN_PRICES_COP
// y eso lo resuelve el endpoint que viene después.
import { Loader2, DollarSign, Users, TrendingUp, Info } from "lucide-react";
import { PLAN_PRICES_COP, PLAN_MONTHLY_CREDITS } from "@/lib/limits";
import { normalizeTier } from "@/lib/ai/models";
import type { TierRow } from "../components/OpenRouterProjection";

const TIER_LABEL: Record<string, string> = {
  free: "Free",
  creador: "Creador",
  pro: "Pro",
  agencia: "Agencia",
  pyme: "Pyme",
};

const cop = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export function FinanceTab({ tiers, loading }: { tiers: TierRow[] | undefined; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Calculando finanzas</p>
      </div>
    );
  }

  if (!tiers || tiers.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">Sin datos de suscripciones todavía.</p>
      </div>
    );
  }

  const porPlan = new Map<string, { users: number; saldo: number }>();
  for (const t of tiers) {
    const plan = normalizeTier(t.tier);
    const acc = porPlan.get(plan) ?? { users: 0, saldo: 0 };
    acc.users += t.users;
    acc.saldo += t.creditsBalance;
    porPlan.set(plan, acc);
  }

  const filas = [...porPlan.entries()]
    .map(([plan, { users, saldo }]) => ({
      plan,
      users,
      saldo,
      precio: PLAN_PRICES_COP[plan] ?? 0,
      creditosMes: (PLAN_MONTHLY_CREDITS[plan] ?? 0) * users,
      ingresoMes: (PLAN_PRICES_COP[plan] ?? 0) * users,
    }))
    .sort((a, b) => b.ingresoMes - a.ingresoMes);

  const mrr = filas.reduce((a, f) => a + f.ingresoMes, 0);
  const arr = mrr * 12;
  const payingUsers = filas.filter((f) => f.plan !== "free").reduce((a, f) => a + f.users, 0);
  const totalUsers = filas.reduce((a, f) => a + f.users, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-muted border border-border flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Ingresos estimados</h3>
            <p className="text-[11px] text-muted-foreground font-medium">MRR = usuarios activos × precio de su plan</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-1">MRR</p>
            <p className="text-2xl font-black font-mono text-foreground">{cop(mrr)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Monthly recurring revenue estimado</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">ARR</p>
            <p className="text-2xl font-black font-mono text-foreground">{cop(arr)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">MRR × 12 si todos renuevan</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Pagantes</p>
            <p className="text-2xl font-black font-mono text-foreground">{payingUsers.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground mt-1">de {totalUsers.toLocaleString()} usuarios totales</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border">
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Usuarios</th>
                <th className="py-2 pr-4">Precio/mes</th>
                <th className="py-2 pr-4">Ingreso/mes</th>
                <th className="py-2">% del MRR</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.plan} className="border-b border-border/50 text-[13px] text-foreground">
                  <td className="py-2 pr-4 font-bold">{TIER_LABEL[f.plan] ?? f.plan}</td>
                  <td className="py-2 pr-4 font-mono">{f.users}</td>
                  <td className="py-2 pr-4 font-mono text-muted-foreground">{f.precio ? cop(f.precio) : "—"}</td>
                  <td className="py-2 pr-4 font-mono">{f.ingresoMes ? cop(f.ingresoMes) : "—"}</td>
                  <td className="py-2 font-mono text-muted-foreground">{mrr > 0 && f.ingresoMes > 0 ? `${Math.round((f.ingresoMes / mrr) * 100)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="text-[13px] text-foreground font-black">
                <td className="pt-3 pr-4">Total</td>
                <td className="pt-3 pr-4 font-mono">{totalUsers}</td>
                <td className="pt-3"></td>
                <td className="pt-3 pr-4 font-mono">{cop(mrr)}</td>
                <td className="pt-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex gap-3">
        <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Siguiente ciclo</p>
          <p className="text-[13px] text-foreground leading-relaxed">
            Ingresos REALES (sumando transacciones Bold aprobadas en los últimos 30 días), última recarga, suscripciones próximas a vencer y recargas puntuales por pack. Requiere un endpoint nuevo <code className="font-mono text-xs text-muted-foreground">/api/admin/finance</code> que lea <code className="font-mono text-xs text-muted-foreground">transaction</code> y mapee monto en créditos → COP.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-4 flex gap-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Cómo se calcula</p>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            El MRR es una ESTIMACIÓN: cuenta a cada usuario como si estuviera pagando el precio de su plan actual este mes. Los planes duran 30 días desde la compra y <strong className="text-foreground">no se renuevan automáticamente</strong> (ver <code className="font-mono text-xs">/pricing</code> FAQ), así que la cifra real depende de cuántos renuevan — y eso solo lo sabe el endpoint financiero que viene después.
          </p>
          <div className="flex gap-3 mt-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">Fuente de usuarios: <code className="font-mono">/api/admin/stats</code> (agrupado por plan). Fuente de precios: <code className="font-mono">src/lib/limits.ts</code> (PLAN_PRICES_COP).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
