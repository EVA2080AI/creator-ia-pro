// Borra una conversación puntual de Basalt (ver api/basalt/conversations.ts).
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../../../db/index.js";
import { requireUser } from "../../_lib/require-user.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const db = getDb();
  const id = req.query.id as string;

  if (req.method === "DELETE") {
    await db.delete(schema.basaltConversation)
      .where(and(eq(schema.basaltConversation.id, id), eq(schema.basaltConversation.userId, user.userId)));
    res.status(200).json({ ok: true });
    return;
  }

  res.setHeader("Allow", "DELETE");
  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido." });
}
