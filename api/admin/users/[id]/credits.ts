// Agregar/deducir/reembolsar créditos a un usuario — reemplaza las RPCs
// admin_add_credits / admin_deduct_credits / admin_refund_credits de Supabase.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "drizzle-orm";
import { getDb, schema } from "../../../../db/index.js";
import { requireAdmin } from "../../../_lib/require-admin.js";

const OP_TYPE: Record<string, string> = { add: "admin_grant", deduct: "admin_deduct", refund: "refund" };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
    return;
  }
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const targetUserId = req.query.id as string;
  const body = (req.body ?? {}) as { op?: "add" | "deduct" | "refund"; amount?: number; reason?: string };
  const op = body.op;
  const amount = Number(body.amount);

  if (!op || !OP_TYPE[op] || !Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "Operación o monto inválido." });
    return;
  }

  const db = getDb();
  const delta = op === "deduct" ? -amount : amount;
  const rows = await db.execute<{ credits_balance: number }>(sql`
    UPDATE profile
    SET credits_balance = GREATEST(0, credits_balance + ${delta}), updated_at = now()
    WHERE user_id = ${targetUserId}
    RETURNING credits_balance
  `);
  const newBalance = rows.rows[0]?.credits_balance;
  if (newBalance === undefined) {
    res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Usuario no encontrado." });
    return;
  }

  await db.insert(schema.transaction).values({
    id: crypto.randomUUID(),
    userId: targetUserId,
    type: OP_TYPE[op] as typeof schema.transactionType.enumValues[number],
    amount: delta,
    description: body.reason || `${op} por admin (${admin.userId})`,
  });

  res.status(200).json({ ok: true, creditsBalance: newBalance });
}
