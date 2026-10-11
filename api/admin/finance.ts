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
import { and, eq, gte, lte, ne, isNotNull, asc, desc, inArray, like } from "drizzle-orm";
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
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Traigo las compras aprobadas de los ÚLTIMOS 60 días en una sola query:
  // las de 0-30 pintan el "mes actual" (todo lo que ya hace el endpoint); las
  // de 30-60 van al "mes anterior" solo para la comparación MoM.
  // Paralelamente traigo los eventos `subscription_change` de downgrade de los
  // últimos 60 días — el cron `subscription-renewals` los inserta con
  // description "Plan {tier} vencido — bajado a Free (sin renovar)". El mismo
  // tipo también lo usa el webhook de Bold para activaciones ("Plan activado:
  // {tier} (Bold)"), por eso filtro por `description like 'Plan%vencido%'` —
  // sin eso el churn sumaría también a quienes se dieron de alta.
  const [approvedAll, renewalsRows, churnRows] = await Promise.all([
    db
      .select()
      .from(schema.transaction)
      .where(and(eq(schema.transaction.type, "bold_approved"), gte(schema.transaction.createdAt, sixtyDaysAgo)))
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
    db
      .select({ userId: schema.transaction.userId, description: schema.transaction.description, createdAt: schema.transaction.createdAt })
      .from(schema.transaction)
      .where(and(
        eq(schema.transaction.type, "subscription_change"),
        gte(schema.transaction.createdAt, sixtyDaysAgo),
        like(schema.transaction.description, "Plan %vencido%"),
      ))
      .orderBy(desc(schema.transaction.createdAt)),
  ]);

  // Separo mes actual (0-30d) vs mes anterior (30-60d) para el MoM.
  const approved = approvedAll.filter((tx) => tx.createdAt >= thirtyDaysAgo);
  const approvedPrev = approvedAll.filter((tx) => tx.createdAt < thirtyDaysAgo);
  const revenueCopPrev30d = approvedPrev.reduce(
    (a, tx) => a + priceOf((tx.description?.split("|")[0] ?? "").trim()),
    0,
  );
  const salesCountPrev30d = approvedPrev.length;

  let revenueCop = 0;
  const byItem = new Map<string, { items: number; revenueCop: number; creditsGranted: number }>();
  // 30 slots, uno por día, siempre completos aunque no haya ventas (si no, un día sin
  // compras desaparece del eje X y el gráfico pintaría un hueco silencioso).
  const dayMap = new Map<string, { revenueCop: number; salesCount: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dayMap.set(d.toISOString().slice(0, 10), { revenueCop: 0, salesCount: 0 });
  }
  // Agregado por cliente — para el "top 5 clientes del mes": quién movió más caja
  // en los últimos 30 días. Se agrega en el mismo paso para no recorrer dos veces.
  const byClient = new Map<string, { revenueCop: number; purchases: number; lastPurchaseAt: Date }>();

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
    const cur = byClient.get(tx.userId) ?? { revenueCop: 0, purchases: 0, lastPurchaseAt: tx.createdAt };
    cur.revenueCop += price;
    cur.purchases++;
    if (tx.createdAt > cur.lastPurchaseAt) cur.lastPurchaseAt = tx.createdAt;
    byClient.set(tx.userId, cur);
  }

  const dailyRevenue = [...dayMap.entries()].map(([date, v]) => ({ date, ...v }));

  // Top 5 clientes por ingreso real del mes. Una sola query extra con `inArray` sobre
  // los userIds del top (ya ordenados) para traer nombres y correos — no se recorren
  // todos los clientes para esto.
  const topIds = [...byClient.entries()]
    .sort((a, b) => b[1].revenueCop - a[1].revenueCop)
    .slice(0, 5)
    .map(([userId]) => userId);
  const topRows = topIds.length
    ? await db
        .select({ id: schema.user.id, name: schema.user.name, email: schema.user.email })
        .from(schema.user)
        .where(inArray(schema.user.id, topIds))
    : [];
  const topClients = topIds.map((userId) => {
    const row = topRows.find((r) => r.id === userId);
    const stats = byClient.get(userId)!;
    return {
      userId,
      name: row?.name ?? "Cliente",
      email: row?.email ?? "",
      revenueCop: stats.revenueCop,
      purchases: stats.purchases,
      lastPurchaseAt: stats.lastPurchaseAt.toISOString(),
    };
  });

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

  // Crecimiento MoM: % de cambio del mes actual contra el anterior. Si el mes
  // anterior fue 0, devuelvo null (no es cero, es "no comparable"); el cliente
  // lo distingue para no pintar "+∞%" o cosas raras.
  const momGrowthPct = revenueCopPrev30d > 0
    ? ((revenueCop - revenueCopPrev30d) / revenueCopPrev30d) * 100
    : null;

  // Churn: cuántos usuarios cayeron a Free este mes vs el anterior. Fuente
  // exacta — cada evento `subscription_change` con "vencido" lo inserta el
  // cron al bajar a alguien que no renovó dentro del período de gracia.
  const churnThisMonth = churnRows.filter((r) => r.createdAt >= thirtyDaysAgo);
  const churnCount = churnThisMonth.length;
  const churnCountPrev30d = churnRows.length - churnCount;

  // Lista accionable: QUIÉNES churnearon este mes. Un solo `inArray` para
  // traer nombres+correos sólo de los IDs del mes (no todos). Parseo el tier
  // de la description "Plan {tier} vencido — bajado a Free (sin renovar)".
  const churnIds = [...new Set(churnThisMonth.map((r) => r.userId))];
  const churnUserRows = churnIds.length
    ? await db
        .select({ id: schema.user.id, name: schema.user.name, email: schema.user.email })
        .from(schema.user)
        .where(inArray(schema.user.id, churnIds))
    : [];
  const churnedUsers = churnThisMonth.map((r) => {
    const row = churnUserRows.find((u) => u.id === r.userId);
    const match = r.description?.match(/^Plan (\w+) vencido/);
    const tier = match?.[1] ?? "";
    return {
      userId: r.userId,
      name: row?.name ?? "Cliente",
      email: row?.email ?? "",
      tier,
      tierLabel: PACK_LABEL[tier] ?? tier,
      churnedAt: r.createdAt.toISOString(),
    };
  });

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
    topClients,
    revenueCopPrev30d,
    salesCountPrev30d,
    momGrowthPct,
    churnCount,
    churnCountPrev30d,
    churnedUsers,
  });
}
