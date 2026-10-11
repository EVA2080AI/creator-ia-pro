// Panel financiero del admin — MRR estimado + ingresos REALES de 30d.
//
// MRR = sum(usuarios[plan] × precio[plan]). Los `tiers` vienen del mismo
// `/api/admin/stats` (agrupado por `profile.subscription_tier`); los precios de
// `src/lib/limits.ts` (fuente de verdad compartida con /pricing).
//
// Ingresos reales = sum(transactions type='bold_approved' últimos 30d, con el
// monto en COP leído de CREDIT_PACK_PRICES_COP / PLAN_PRICES_COP según el
// packId de la description). Viene de `/api/admin/finance` (ver api/admin/finance.ts).
import { Loader2, DollarSign, Users, Info, Receipt, Clock, CalendarClock, Activity } from "lucide-react";
import { PLAN_PRICES_COP, PLAN_MONTHLY_CREDITS } from "@/lib/limits";
import { normalizeTier } from "@/lib/ai/models";
import type { TierRow } from "../components/OpenRouterProjection";
import type { FinanceData } from "../hooks/useAdminData";

const TIER_LABEL: Record<string, string> = {
  free: "Free",
  creador: "Creador",
  pro: "Pro",
  agencia: "Agencia",
  pyme: "Pyme",
};

const cop = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export function FinanceTab({
  tiers,
  loading,
  finance,
  financeLoading,
  financeError,
}: {
  tiers: TierRow[] | undefined;
  loading: boolean;
  finance: FinanceData | null;
  financeLoading: boolean;
  financeError: string | null;
}) {
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

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-muted border border-border flex items-center justify-center">
            <Receipt className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Ingresos reales 30d</h3>
            <p className="text-[11px] text-muted-foreground font-medium">Compras aprobadas por Bold en los últimos 30 días</p>
          </div>
        </div>

        {financeLoading && (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Cargando movimientos</p>
          </div>
        )}

        {!financeLoading && financeError && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-[13px] text-foreground">
            No se pudieron cargar los ingresos: <span className="text-muted-foreground">{financeError}</span>
          </div>
        )}

        {!financeLoading && !financeError && finance && (
          <>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-1">Ingresos 30d</p>
                <p className="text-2xl font-black font-mono text-foreground">{cop(finance.revenueCop)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{finance.salesCount.toLocaleString()} compra{finance.salesCount === 1 ? "" : "s"} aprobada{finance.salesCount === 1 ? "" : "s"}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Ticket promedio</p>
                <p className="text-2xl font-black font-mono text-foreground">{finance.salesCount > 0 ? cop(Math.round(finance.revenueCop / finance.salesCount)) : cop(0)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">COP por compra</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/40 p-4 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1.5"><Clock className="h-3 w-3" /> Última compra</p>
                  {finance.lastPurchase ? (
                    <>
                      <p className="text-lg font-black font-mono text-foreground">{cop(finance.lastPurchase.amountCop)}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{finance.lastPurchase.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(finance.lastPurchase.createdAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">Sin compras aún</p>
                  )}
                </div>
              </div>
            </div>

            {finance.breakdown.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border">
                      <th className="py-2 pr-4">Item</th>
                      <th className="py-2 pr-4">Tipo</th>
                      <th className="py-2 pr-4">Vendidos</th>
                      <th className="py-2 pr-4">Créditos otorgados</th>
                      <th className="py-2">Ingreso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finance.breakdown.map((row) => (
                      <tr key={row.packId} className="border-b border-border/50 text-[13px] text-foreground">
                        <td className="py-2 pr-4 font-bold">{row.label}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{row.kind === "recarga" ? "Recarga" : "Suscripción"}</td>
                        <td className="py-2 pr-4 font-mono">{row.items}</td>
                        <td className="py-2 pr-4 font-mono text-muted-foreground">{row.creditsGranted.toLocaleString()}</td>
                        <td className="py-2 font-mono">{cop(row.revenueCop)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {!financeLoading && !financeError && finance && finance.dailyRevenue.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-muted border border-border flex items-center justify-center">
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Ingresos diarios 30d</h3>
              <p className="text-[11px] text-muted-foreground font-medium">Compras aprobadas por día — hover para ver el total</p>
            </div>
          </div>

          {(() => {
            const max = Math.max(1, ...finance.dailyRevenue.map((d) => d.revenueCop));
            const totalDays = finance.dailyRevenue.length;
            const avg = Math.round(finance.revenueCop / totalDays);
            const topDay = finance.dailyRevenue.reduce((best, d) => d.revenueCop > best.revenueCop ? d : best, finance.dailyRevenue[0]);
            const fmtDay = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" });
            return (
              <>
                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  <div className="rounded-2xl border border-border bg-muted/40 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Promedio diario</p>
                    <p className="text-xl font-black font-mono text-foreground">{cop(avg)}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">COP / día (ventana 30d)</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/40 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Mejor día</p>
                    <p className="text-xl font-black font-mono text-foreground">{cop(topDay.revenueCop)}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{fmtDay(topDay.date)} · {topDay.salesCount.toLocaleString()} compra{topDay.salesCount === 1 ? "" : "s"}</p>
                  </div>
                </div>

                <div className="h-32 flex items-end gap-[2px]" role="img" aria-label={`Ingresos diarios de los últimos ${totalDays} días`}>
                  {finance.dailyRevenue.map((d) => {
                    const height = max > 0 ? (d.revenueCop / max) * 100 : 0;
                    const label = `${fmtDay(d.date)}: ${cop(d.revenueCop)} (${d.salesCount} compra${d.salesCount === 1 ? "" : "s"})`;
                    return (
                      <div key={d.date} className="flex-1 relative group h-full flex items-end">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-zinc-900 text-white text-[9px] font-bold px-2 py-1 rounded-md whitespace-nowrap z-10">
                          {label}
                        </div>
                        <div
                          className="w-full bg-muted group-hover:bg-primary/40 rounded-sm transition-all duration-500"
                          style={{ height: `${Math.max(height, d.revenueCop > 0 ? 4 : 1)}%` }}
                          title={label}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <span>{fmtDay(finance.dailyRevenue[0].date)}</span>
                  <span>{fmtDay(finance.dailyRevenue[totalDays - 1].date)}</span>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {!financeLoading && !financeError && finance && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-muted border border-border flex items-center justify-center">
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Próximas renovaciones</h3>
              <p className="text-[11px] text-muted-foreground font-medium">Planes pagados que vencen en los próximos 30 días</p>
            </div>
          </div>

          {finance.upcomingRenewals.length === 0 ? (
            <div className="rounded-2xl border border-border bg-muted/40 p-6 text-center">
              <p className="text-sm text-muted-foreground">Nadie vence en los próximos 30 días.</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-1">Vencen esta semana</p>
                  <p className="text-2xl font-black font-mono text-foreground">{finance.renewalsNext7Count}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">de {finance.upcomingRenewals.length} que vencen en los próximos 30 días</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/40 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Pipeline 30d (si todos renuevan)</p>
                  <p className="text-2xl font-black font-mono text-foreground">{cop(finance.renewalsPipeline30dCop)}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Techo si cada uno paga su mismo plan</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border">
                      <th className="py-2 pr-4">Usuario</th>
                      <th className="py-2 pr-4">Plan</th>
                      <th className="py-2 pr-4">Vence</th>
                      <th className="py-2 pr-4">En</th>
                      <th className="py-2">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finance.upcomingRenewals.map((r) => {
                      const chipClass = r.daysLeft <= 3
                        ? "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                        : r.daysLeft <= 7
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          : "bg-muted text-muted-foreground";
                      return (
                        <tr key={r.userId} className="border-b border-border/50 text-[13px] text-foreground">
                          <td className="py-2 pr-4">
                            <div className="font-bold">{r.name}</div>
                            <div className="text-[11px] text-muted-foreground">{r.email}</div>
                          </td>
                          <td className="py-2 pr-4 font-mono">{TIER_LABEL[r.tier] ?? r.tier}</td>
                          <td className="py-2 pr-4 font-mono text-muted-foreground">{new Date(r.expiresAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}</td>
                          <td className="py-2 pr-4">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${chipClass}`}>
                              {r.daysLeft === 0 ? "hoy" : r.daysLeft === 1 ? "1 día" : `${r.daysLeft} días`}
                            </span>
                          </td>
                          <td className="py-2 font-mono">{r.priceCop ? cop(r.priceCop) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                El cron <code className="font-mono">subscription-renewals</code> manda un recordatorio automático 3 días antes de cada vencimiento y baja a Free a quien no pague tras 3 días de gracia.
              </p>
            </>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-muted/30 p-4 flex gap-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Cómo se calcula</p>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            El MRR es una ESTIMACIÓN proyectiva (usuarios × precio de su plan actual). Los planes duran 30 días y <strong className="text-foreground">no se renuevan automáticamente</strong> (ver <code className="font-mono text-xs">/pricing</code> FAQ), así que es un techo si todos renuevan a tiempo. Los <strong className="text-foreground">ingresos reales</strong> salen de las compras aprobadas por Bold (transacciones <code className="font-mono text-xs">bold_approved</code> de los últimos 30 días) y son hechos consumados. Las <strong className="text-foreground">próximas renovaciones</strong> son los perfiles cuyo <code className="font-mono text-xs">subscription_expires_at</code> cae en los próximos 30 días.
          </p>
          <div className="flex gap-3 mt-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">Fuentes: <code className="font-mono">/api/admin/stats</code> (usuarios por plan) + <code className="font-mono">/api/admin/finance</code> (compras + renovaciones) + <code className="font-mono">src/lib/limits.ts</code> (precios).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
