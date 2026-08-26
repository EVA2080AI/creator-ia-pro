import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { requireUser } from "../_lib/require-user.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const db = getDb();
  const id = req.query.id as string;
  const owned = and(eq(schema.canvasNode.id, id), eq(schema.canvasNode.userId, user.userId));

  if (req.method === "PATCH") {
    const body = (req.body ?? {}) as {
      name?: string; prompt?: string; assetUrl?: string | null;
      posX?: number; posY?: number; width?: number; height?: number;
      status?: string; errorMessage?: string | null; dataPayload?: unknown;
    };
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) patch.name = body.name;
    if (body.prompt !== undefined) patch.prompt = body.prompt;
    if (body.assetUrl !== undefined) patch.assetUrl = body.assetUrl;
    if (body.posX !== undefined) patch.posX = body.posX;
    if (body.posY !== undefined) patch.posY = body.posY;
    if (body.width !== undefined) patch.width = body.width;
    if (body.height !== undefined) patch.height = body.height;
    if (body.status !== undefined) patch.status = body.status;
    if (body.errorMessage !== undefined) patch.errorMessage = body.errorMessage;
    if (body.dataPayload !== undefined) patch.dataPayload = body.dataPayload;

    const [updated] = await db.update(schema.canvasNode).set(patch).where(owned).returning();
    if (!updated) return void res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Nodo no encontrado." });
    res.status(200).json({ ok: true, node: updated });
    return;
  }

  if (req.method === "DELETE") {
    const [deleted] = await db.delete(schema.canvasNode).where(owned).returning();
    if (!deleted) return void res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Nodo no encontrado." });
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
}
