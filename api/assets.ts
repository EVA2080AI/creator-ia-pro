// Biblioteca de assets guardados — reemplaza `supabase.from("saved_assets")`.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq, isNull, desc, count } from "drizzle-orm";
import { getDb, schema } from "../db/index.js";
import { requireUser } from "./_lib/require-user.js";

const PAGE_SIZE_MAX = 100;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const db = getDb();

  if (req.method === "GET") {
    const { spaceId, favoriteOnly, limit, offset } = req.query as Record<string, string | undefined>;
    const take = Math.min(parseInt(limit || "24", 10) || 24, PAGE_SIZE_MAX);
    const skip = Math.max(parseInt(offset || "0", 10) || 0, 0);

    const conditions = [eq(schema.savedAsset.userId, user.userId)];
    if (spaceId === "none") conditions.push(isNull(schema.savedAsset.spaceId));
    else if (spaceId && spaceId !== "all") conditions.push(eq(schema.savedAsset.spaceId, spaceId));
    if (favoriteOnly === "true") conditions.push(eq(schema.savedAsset.isFavorite, true));
    const where = and(...conditions);

    const [rows, [{ total }]] = await Promise.all([
      db.select().from(schema.savedAsset).where(where).orderBy(desc(schema.savedAsset.createdAt)).limit(take).offset(skip),
      db.select({ total: count() }).from(schema.savedAsset).where(where),
    ]);

    res.status(200).json({ ok: true, assets: rows, total });
    return;
  }

  if (req.method === "POST") {
    const body = (req.body ?? {}) as {
      assetUrl?: string; prompt?: string; type?: string; spaceId?: string | null;
      tags?: string[]; content?: string;
    };
    // assetUrl puede venir vacío para assets tipo "document" (su contenido vive en `content`).
    if (body.assetUrl === undefined) {
      res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "Falta assetUrl." });
      return;
    }
    const [created] = await db
      .insert(schema.savedAsset)
      .values({
        id: crypto.randomUUID(),
        userId: user.userId,
        spaceId: body.spaceId || null,
        assetUrl: body.assetUrl,
        prompt: body.prompt ?? null,
        type: body.type || "image",
        tags: Array.isArray(body.tags) ? body.tags.slice(0, 20) : [],
        content: body.content ?? null,
      })
      .returning();
    res.status(200).json({ ok: true, asset: created });
    return;
  }

  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
}
