import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { requireUser } from "../_lib/require-user.js";

const MAX_NAME = 200;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const db = getDb();
  const id = req.query.id as string;
  const owned = and(eq(schema.space.id, id), eq(schema.space.userId, user.userId));

  if (req.method === "PATCH") {
    const body = (req.body ?? {}) as { name?: string; description?: string | null; settings?: Record<string, unknown> };
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.name === "string") patch.name = body.name.slice(0, MAX_NAME);
    if (body.description !== undefined) patch.description = body.description;
    if (body.settings !== undefined) patch.settings = body.settings;

    const [updated] = await db.update(schema.space).set(patch).where(owned).returning();
    if (!updated) return void res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Espacio no encontrado." });
    res.status(200).json({ ok: true, space: updated });
    return;
  }

  if (req.method === "DELETE") {
    const [deleted] = await db.delete(schema.space).where(owned).returning();
    if (!deleted) return void res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Espacio no encontrado." });
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
}
