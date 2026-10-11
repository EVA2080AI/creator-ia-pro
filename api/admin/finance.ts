// Panel financiero del admin — ingresos REALES de los últimos 30 días.
//
// Fuente: `transaction` type = 'bold_approved' (que es como el webhook de Bold
// marca una compra confirmada — ver api/billing/webhook.ts). La `description`
// tiene el formato `<packId>|<linkId>` donde packId es "pack_200|pack_1000|
// pack_2000" para recargas o "creador|pro|agencia|pyme" para suscripciones.
// Mapear packId → precio COP (CREDIT_PACK_PRICES_COP / PLAN_PRICES_COP) da el
// monto cobrado. `amount` sigue en créditos otorgados, no en pesos.
//
// Lo que NO se calcula desde aquí: MRR estimado (ya se calcula en el cliente
// desde los `tiers` que /api/admin/stats devuelve). Este endpoint es solo
// ingresos reales + última compra + desglose por item vendido.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq, gte, lte, ne, isNotNull, asc, desc } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { requireAdmin } from "../_lib/require-admin.js";
import { CREDIT_PACK_PRICES_COP, PLAN_PRICES_COP } from "../../src/lib/limits.js";

const PACK_LABEL: Record<string, string> = {
  pack_200: "Pack 200 créditos",
  pack_1000: "Pack 1.000 créditos",
  pack_2000: "Pack 2.000 créditos",
  creador: "Plan Creador",
  pro: "Plan Pro",
  agencia: "Plan Agencia",
  pyme: "Plan Pyme",
};

function priceOf(packId: string): number {
  return CREDIT_PACK_PRICES_COP[packId] ?? PLAN_PRICES_COP[packId] ?? 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
    return;
  }
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const db = getDb();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [approved, renewalsRows] = await Promise.all([
    db
      .select()
      .from(schema.transaction)
      .where(and(eq(schema.transaction.type, "bold_approved"), gte(schema.transaction.createdAt, thirtyDaysAgo)))
      .orderBy(desc(schema.transaction.createdAt)),
    // Planes pagados que vencen en los próximos 30 días — mismo criterio que el cron
    // de recordatorios (api/cron/subscription-renewals.ts) pero con la ventana ampliada
    // para que el admin vea de un vistazo quién está por renovar, no solo los de 3 días.
    db
      .select({
        userId: schema.profile.userId,
        name: schema.user.name,
        email: schema.user.email,
        tier: schema.profile.subscriptionTier,
        expiresAt: schema.profile.subscriptionExpiresAt,
      })
      .from(schema.profile)
      .innerJoin(schema.user, eq(schema.user.id, schema.profile.userId))
      .where(and(
        ne(schema.profile.subscriptionTier, "free"),
        isNotNull(schema.profile.subscriptionExpiresAt),
        gte(schema.profile.subscriptionExpiresAt, now),
        lte(schema.profile.subscriptionExpiresAt, thirtyDaysAhead),
      ))
      .orderBy(asc(schema.profile.subscriptionExpiresAt))
      .limit(20),
  ]);

  let revenueCop = 0;
  const byItem = new Map<string, { items: number; revenueCop: number; creditsGranted: number }>();
  // 30 slots, uno por día, siempre completos aunque no haya ventas (si no, un día sin
  // compras desaparece del eje X y el gráfico pintaría un hueco silencioso).
  const dayMap = new Map<string, { revenueCop: number; salesCount: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dayMap.set(d.toISOString().slice(0, 10), { revenueCop: 0, salesCount: 0 });
  }

  for (const tx of approved) {
    const packId = (tx.description?.split("|")[0] ?? "").trim();
    const price = priceOf(packId);
    revenueCop += price;
    const acc = byItem.get(packId) ?? { items: 0, revenueCop: 0, creditsGranted: 0 };
    acc.items++;
    acc.revenueCop += price;
    acc.creditsGranted += tx.amount;
    byItem.set(packId, acc);
    const key = new Date(tx.createdAt).toISOString().slice(0, 10);
    const d = dayMap.get(key);
    if (d) { d.revenueCop += price; d.salesCount++; }
  }

  const dailyRevenue = [...dayMap.entries()].map(([date, v]) => ({ date, ...v }));

  const breakdown = [...byItem.entries()]
    .map(([packId, v]) => ({
      packId,
      label: PACK_LABEL[packId] ?? packId,
      kind: packId.startsWith("pack_") ? ("recarga" as const) : ("suscripcion" as const),
      ...v,
    }))
    .sort((a, b) => b.revenueCop - a.revenueCop);

  const last = approved[0];
  const lastPurchase = last
    ? {
        packId: (last.description?.split("|")[0] ?? "").trim(),
        label: PACK_LABEL[(last.description?.split("|")[0] ?? "").trim()] ?? "Compra",
        amountCop: priceOf((last.description?.split("|")[0] ?? "").trim()),
        creditsGranted: last.amount,
        createdAt: last.createdAt,
      }
    : null;

  // Expectedia estimada por renovar: si TODOS los que vencen en 30d renuevan en su mismo plan,
  // suma los precios. Es un techo (el cron real baja a Free a quien no paga), ver el aviso en el UI.
  const upcomingRenewals = renewalsRows.map((r) => {
    const expiresAt = r.expiresAt as Date;
    const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
    const tier = r.tier ?? "free";
    return {
      userId: r.userId,
      name: r.name,
      email: r.email,
      tier,
      tierLabel: PACK_LABEL[tier] ?? tier,
      expiresAt: expiresAt.toISOString(),
      daysLeft,
      priceCop: PLAN_PRICES_COP[tier] ?? 0,
    };
  });
  const renewalsExpected7d = upcomingRenewals.filter((r) => r.daysLeft <= 7);
  const renewalsPipeline30dCop = upcomingRenewals.reduce((a, r) => a + r.priceCop, 0);

  res.status(200).json({
    ok: true,
    revenueCop,
    salesCount: approved.length,
    breakdown,
    lastPurchase,
    upcomingRenewals,
    renewalsNext7Count: renewalsExpected7d.length,
    renewalsPipeline30dCop,
    dailyRevenue,
  });
}
