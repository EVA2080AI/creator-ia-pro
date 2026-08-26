import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { requireUser } from "../_lib/require-user.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const db = getDb();
  const id = req.query.id as string;
  const owned = and(eq(schema.savedAsset.id, id), eq(schema.savedAsset.userId, user.userId));

  if (req.method === "PATCH") {
    const body = (req.body ?? {}) as { isFavorite?: boolean; content?: string; tags?: string[]; spaceId?: string | null };
    const patch: Record<string, unknown> = {};
    if (typeof body.isFavorite === "boolean") patch.isFavorite = body.isFavorite;
    if (body.content !== undefined) patch.content = body.content;
    if (Array.isArray(body.tags)) patch.tags = body.tags.slice(0, 20);
    if (body.spaceId !== undefined) patch.spaceId = body.spaceId;

    const [updated] = await db.update(schema.savedAsset).set(patch).where(owned).returning();
    if (!updated) return void res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Activo no encontrado." });
    res.status(200).json({ ok: true, asset: updated });
    return;
  }

  if (req.method === "DELETE") {
    const [deleted] = await db.delete(schema.savedAsset).where(owned).returning();
    if (!deleted) return void res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Activo no encontrado." });
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
}
