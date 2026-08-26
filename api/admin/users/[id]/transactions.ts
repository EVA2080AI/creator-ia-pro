// Historial de transacciones de un usuario — reemplaza la RPC admin_get_transactions.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, desc } from "drizzle-orm";
import { getDb, schema } from "../../../../db/index.js";
import { requireAdmin } from "../../../_lib/require-admin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
    return;
  }
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const targetUserId = req.query.id as string;
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.transaction)
    .where(eq(schema.transaction.userId, targetUserId))
    .orderBy(desc(schema.transaction.createdAt))
    .limit(30);

  res.status(200).json({ ok: true, transactions: rows });
}
