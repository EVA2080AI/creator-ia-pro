import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, desc, eq, gt, ne, or } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { getSessionUser } from "../_lib/session.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
    return;
  }

  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ ok: false, code: "UNAUTHORIZED", error: "Debes iniciar sesión." });
    return;
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.transaction)
      // Cada clic en "comprar" deja una fila pendiente. Si el pago no se hizo, al día
      // siguiente deja de mostrarse: no es un movimiento, es un intento.
      .where(and(
        eq(schema.transaction.userId, user.userId),
        or(ne(schema.transaction.type, "bold_pending"), gt(schema.transaction.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))),
      ))
      .orderBy(desc(schema.transaction.createdAt))
      .limit(50);

    res.status(200).json({ ok: true, transactions: rows });
  } catch (err) {
    console.error("[api/billing/transactions]", err);
    res.status(500).json({ ok: false, code: "INTERNAL_ERROR", error: "Error al procesar la solicitud. Intenta de nuevo." });
  }
}
