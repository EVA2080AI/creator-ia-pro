// Historial de chat de un proyecto de Genesis: última conversación + mensajes.
// Reemplaza la lectura de studio_messages de Supabase (pausado e irrecuperable).
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb, schema } from "../../../db/index.js";
import { requireUser } from "../../_lib/require-user.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
    return;
  }
  const user = await requireUser(req, res);
  if (!user) return;

  const projectId = req.query.id as string;
  const db = getDb();

  // Doble propiedad: el proyecto debe ser del usuario Y la conversación también.
  const [owned] = await db
    .select({ id: schema.project.id })
    .from(schema.project)
    .where(and(eq(schema.project.id, projectId), eq(schema.project.userId, user.userId)))
    .limit(1);
  if (!owned) {
    res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Proyecto no encontrado." });
    return;
  }

  const [conv] = await db
    .select({ id: schema.conversation.id })
    .from(schema.conversation)
    .where(and(eq(schema.conversation.projectId, projectId), eq(schema.conversation.userId, user.userId)))
    .orderBy(desc(schema.conversation.updatedAt))
    .limit(1);

  if (!conv) {
    // Sin historial — el cliente genera el conversationId del primer mensaje.
    res.status(200).json({ ok: true, conversationId: null, messages: [] });
    return;
  }

  const rows = await db
    .select({
      id: schema.message.id,
      role: schema.message.role,
      content: schema.message.content,
      createdAt: schema.message.createdAt,
    })
    .from(schema.message)
    .where(eq(schema.message.conversationId, conv.id))
    .orderBy(asc(schema.message.createdAt));

  res.status(200).json({ ok: true, conversationId: conv.id, messages: rows });
}