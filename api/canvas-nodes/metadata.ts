// Guarda los edges del grafo — una fila especial por espacio (type='flow_metadata',
// dataPayload={edges}), upsert por el índice único parcial (space_id, type).
// Reemplaza supabase.from("canvas_nodes").upsert(..., { onConflict: 'space_id,type' }).
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { requireUser } from "../_lib/require-user.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
    return;
  }
  const user = await requireUser(req, res);
  if (!user) return;

  const body = (req.body ?? {}) as { spaceId?: string; edges?: unknown };
  if (!body.spaceId || !Array.isArray(body.edges)) {
    res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "Falta spaceId o edges." });
    return;
  }

  const db = getDb();
  // Confirma que el espacio es del usuario antes de escribir el metadata.
  const [ownsSpace] = await db.select({ id: schema.space.id }).from(schema.space)
    .where(and(eq(schema.space.id, body.spaceId), eq(schema.space.userId, user.userId))).limit(1);
  if (!ownsSpace) {
    res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Espacio no encontrado." });
    return;
  }

  const [row] = await db
    .insert(schema.canvasNode)
    .values({
      id: crypto.randomUUID(),
      userId: user.userId,
      spaceId: body.spaceId,
      type: "flow_metadata",
      name: "__flow_metadata__",
      prompt: "metadata",
      status: "idle",
      dataPayload: { edges: body.edges },
    })
    .onConflictDoUpdate({
      target: [schema.canvasNode.spaceId, schema.canvasNode.type],
      targetWhere: sql`${schema.canvasNode.type} = 'flow_metadata'`,
      set: { dataPayload: { edges: body.edges }, updatedAt: new Date() },
    })
    .returning();

  res.status(200).json({ ok: true, node: row });
}
