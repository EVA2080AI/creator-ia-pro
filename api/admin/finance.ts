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
import { and, eq, gte, desc } from "drizzle-orm";
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
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const approved = await db
    .select()
    .from(schema.transaction)
    .where(and(eq(schema.transaction.type, "bold_approved"), gte(schema.transaction.createdAt, thirtyDaysAgo)))
    .orderBy(desc(schema.transaction.createdAt));

  let revenueCop = 0;
  const byItem = new Map<string, { items: number; revenueCop: number; creditsGranted: number }>();

  for (const tx of approved) {
    const packId = (tx.description?.split("|")[0] ?? "").trim();
    const price = priceOf(packId);
    revenueCop += price;
    const acc = byItem.get(packId) ?? { items: 0, revenueCop: 0, creditsGranted: 0 };
    acc.items++;
    acc.revenueCop += price;
    acc.creditsGranted += tx.amount;
    byItem.set(packId, acc);
  }

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

  res.status(200).json({
    ok: true,
    revenueCop,
    salesCount: approved.length,
    breakdown,
    lastPurchase,
  });
}
