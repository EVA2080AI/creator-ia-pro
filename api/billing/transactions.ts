import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, desc } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { getSessionUser } from "../_lib/session.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Método no permitido" });
    return;
  }

  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ ok: false, error: "Debes iniciar sesión." });
    return;
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.transaction)
    .where(eq(schema.transaction.userId, user.userId))
    .orderBy(desc(schema.transaction.createdAt))
    .limit(50);

  res.status(200).json({ ok: true, transactions: rows });
}
