import { useEffect, useState } from "react";
import { Wallet, Info } from "lucide-react";
import { PLAN_MONTHLY_CREDITS } from "@/lib/limits";
import { normalizeTier } from "@/lib/ai/models";

// ¿Cuánta plata hay que tener cargada en OpenRouter? (pedido 2026-10-05).
//
// Tres números, del más operativo al más defensivo:
//   1. RECOMENDADO: el consumo real de los últimos 30 días × un margen de seguridad.
//      Es el que manda para recargar.
//   2. TECHO POR PLANES: si cada usuario consumiera TODO lo que su plan le da al mes.
//   3. SALDO VIVO: los créditos ya emitidos (balance de todos) — el pasivo si todos
//      los gastaran hoy.
//
// La tasa USD/crédito es una ESTIMACIÓN editable: nuestro crédito es tarifa plana por
// mensaje y el costo real de OpenRouter depende de tokens y modelo. Se guarda en este
// navegador (localStorage) — es una perilla del admin, no configuración del sistema.

const TASA_KEY = "admin:usd_por_credito";
const MARGEN_KEY = "admin:margen_recarga";
const TASA_DEFECTO = 0.006; // mezcla conservadora: flash ≈$0.003/msj (1 cr), haiku ≈$0.007 (2 cr), imagen ≈$0.03 (3-5 cr)
const MARGEN_DEFECTO = 1.5;

const TIER_LABEL: Record<string, string> = { free: "Free", creador: "Creador", pro: "Pro", agencia: "Agencia", pyme: "Pyme" };

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n >= 100 ? 0 : 2 });

function leer(key: string, defecto: number): number {
  try {
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) && v > 0 ? v : defecto;
  } catch {
    return defecto;
  }
}

export interface TierRow {
  tier: string;
  users: number;
  creditsBalance: number;
}

export function OpenRouterProjection({ tiers, totalSpend30d }: { tiers: TierRow[]; totalSpend30d: number }) {
  const [tasa, setTasa] = useState(() => leer(TASA_KEY, TASA_DEFECTO));
  const [margen, setMargen] = useState(() => leer(MARGEN_KEY, MARGEN_DEFECTO));

  useEffect(() => { try { localStorage.setItem(TASA_KEY, String(tasa)); } catch { /* sin storage */ } }, [tasa]);
  useEffect(() => { try { localStorage.setItem(MARGEN_KEY, String(margen)); } catch { /* sin storage */ } }, [margen]);

  // Agrupa alias de planes (pymes→pyme, starter→creador…) para que la tabla no
  // muestre dos filas del mismo plan.
  const porPlan = new Map<string, { users: number; saldo: number }>();
  for (const t of tiers) {
    const plan = normalizeTier(t.tier);
    const acc = porPlan.get(plan) ?? { users: 0, saldo: 0 };
    acc.users += t.users;
    acc.saldo += t.creditsBalance;
    porPlan.set(plan, acc);
  }

  const filas = [...porPlan.entries()].map(([plan, { users, saldo }]) => ({
    plan,
    users,
    saldo,
    creditosMes: (PLAN_MONTHLY_CREDITS[plan] ?? 0) * users,
  })).sort((a, b) => b.creditosMes - a.creditosMes);

  const techoCreditos = filas.reduce((acc, f) => acc + f.creditosMes, 0);
  const saldoVivo = filas.reduce((acc, f) => acc + f.saldo, 0);

  const consumoUSD = totalSpend30d * tasa;
  const recomendadoUSD = consumoUSD * margen;
  const techoUSD = techoCreditos * tasa;
  const pasivoUSD = saldoVivo * tasa;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-muted border border-border flex items-center justify-center">
          <Wallet className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Proyección OpenRouter</h3>
          <p className="text-[11px] text-muted-foreground font-medium">Cuánto conviene tener cargado en USD</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-1">Recomendado</p>
          <p className="text-2xl font-black font-mono text-foreground">{usd(recomendadoUSD)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">consumo real 30d ({totalSpend30d.toLocaleString()} cr) × {margen}</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Techo por planes</p>
          <p className="text-2xl font-black font-mono text-foreground">{usd(techoUSD)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">si todos consumieran su plan entero ({techoCreditos.toLocaleString()} cr/mes)</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Saldo vivo</p>
          <p className="text-2xl font-black font-mono text-foreground">{usd(pasivoUSD)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">créditos ya emitidos ({saldoVivo.toLocaleString()} cr)</p>
        </div>
      </div>

      <div className="overflow-x-auto mb-5">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border">
              <th className="py-2 pr-4">Plan</th>
              <th className="py-2 pr-4">Usuarios</th>
              <th className="py-2 pr-4">Créditos/mes</th>
              <th className="py-2 pr-4">USD/mes</th>
              <th className="py-2">Saldo vivo</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.plan} className="border-b border-border/50 text-[13px] text-foreground">
                <td className="py-2 pr-4 font-bold">{TIER_LABEL[f.plan] ?? f.plan}</td>
                <td className="py-2 pr-4 font-mono">{f.users}</td>
                <td className="py-2 pr-4 font-mono">{f.creditosMes.toLocaleString()}</td>
                <td className="py-2 pr-4 font-mono">{usd(f.creditosMes * tasa)}</td>
                <td className="py-2 font-mono">{f.saldo.toLocaleString()} cr</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          USD por crédito
          <input
            type="number" step="0.001" min="0.001" value={tasa}
            onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v) && v > 0) setTasa(v); }}
            className="mt-1 block w-28 rounded-xl border border-border bg-muted/50 px-3 py-2 font-mono text-sm text-foreground"
          />
        </label>
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          Margen de seguridad
          <input
            type="number" step="0.1" min="1" value={margen}
            onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v) && v >= 1) setMargen(v); }}
            className="mt-1 block w-24 rounded-xl border border-border bg-muted/50 px-3 py-2 font-mono text-sm text-foreground"
          />
        </label>
        <p className="flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed max-w-md">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
          La tasa es una estimación (el crédito es tarifa plana; OpenRouter cobra por tokens y modelo).
          Ajústala comparando el gasto real del panel de OpenRouter contra los créditos de un mismo mes.
        </p>
      </div>
    </div>
  );
}
