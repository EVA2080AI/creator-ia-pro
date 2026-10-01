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

  // Los mensajes de una conversación. La lista (api/basalt/conversations.ts) ya no
  // los trae: se piden acá al abrirla.
  if (req.method === "GET") {
    const [row] = await db
      .select({
        id: schema.basaltConversation.id,
        title: schema.basaltConversation.title,
        updatedAt: schema.basaltConversation.updatedAt,
        messages: schema.basaltConversation.messages,
      })
      .from(schema.basaltConversation)
      .where(and(eq(schema.basaltConversation.id, id), eq(schema.basaltConversation.userId, user.userId)))
      .limit(1);
    if (!row) {
      res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Esa conversación no existe." });
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      ok: true,
      conversation: { id: row.id, title: row.title, updatedAt: row.updatedAt.getTime(), messages: row.messages },
    });
    return;
  }

  if (req.method === "DELETE") {
    await db.delete(schema.basaltConversation)
      .where(and(eq(schema.basaltConversation.id, id), eq(schema.basaltConversation.userId, user.userId)));
    res.status(200).json({ ok: true });
    return;
  }

  res.setHeader("Allow", "GET, DELETE");
  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido." });
}
