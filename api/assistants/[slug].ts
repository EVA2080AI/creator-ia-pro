import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, or, and } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { requireUser } from "../_lib/require-user.js";
import { getProfile } from "../_lib/session.js";

const MAX_NAME = 60;
const MAX_TAGLINE = 140;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const db = getDb();
  const slug = req.query.slug as string;

  const [row] = await db
    .select()
    .from(schema.assistant)
    .where(
      and(
        eq(schema.assistant.slug, slug),
        or(eq(schema.assistant.visibility, "system"), eq(schema.assistant.ownerId, user.userId))
      )
    )
    .limit(1);

  if (!row) {
    res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Asistente no encontrado." });
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({ ok: true, assistant: row });
    return;
  }

  if (req.method === "PATCH") {
    const isOwner = row.ownerId === user.userId;
    const profile = isOwner ? null : await getProfile(user.userId);
    const canEditSystem = row.visibility === "system" && profile?.isAdmin;
    if (!isOwner && !canEditSystem) {
      res.status(403).json({ ok: false, code: "FORBIDDEN", error: "No puedes editar este asistente." });
      return;
    }

    const body = (req.body ?? {}) as {
      name?: string;
      tagline?: string;
      brand?: Record<string, unknown>;
      welcome?: Record<string, unknown>;
      persona?: Record<string, unknown>;
      capabilities?: Record<string, unknown>;
      defaultModel?: string;
      isActive?: boolean;
    };
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) patch.name = body.name.trim().slice(0, MAX_NAME);
    if (body.tagline !== undefined) patch.tagline = body.tagline?.trim().slice(0, MAX_TAGLINE) || null;
    if (body.brand !== undefined) patch.brand = body.brand;
    if (body.welcome !== undefined) patch.welcome = body.welcome;
    if (body.persona !== undefined) patch.persona = body.persona;
    if (body.capabilities !== undefined) patch.capabilities = body.capabilities;
    if (body.defaultModel !== undefined) patch.defaultModel = body.defaultModel;
    if (body.isActive !== undefined && isOwner) patch.isActive = body.isActive;

    const [updated] = await db.update(schema.assistant).set(patch).where(eq(schema.assistant.id, row.id)).returning();
    res.status(200).json({ ok: true, assistant: updated });
    return;
  }

  if (req.method === "DELETE") {
    if (row.visibility === "system" || row.ownerId !== user.userId) {
      res.status(403).json({ ok: false, code: "FORBIDDEN", error: "No puedes borrar este asistente." });
      return;
    }
    await db.delete(schema.assistant).where(eq(schema.assistant.id, row.id));
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
}
