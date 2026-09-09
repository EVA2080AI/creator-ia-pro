// Nodos del lienzo de Canvas IA — reemplaza supabase.from("canvas_nodes").
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../db/index.js";
import { requireUser } from "./_lib/require-user.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const db = getDb();

  try {
  if (req.method === "GET") {
    const spaceId = req.query.spaceId as string | undefined;
    if (!spaceId) {
      res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "Falta spaceId." });
      return;
    }
    const rows = await db
      .select()
      .from(schema.canvasNode)
      .where(and(eq(schema.canvasNode.spaceId, spaceId), eq(schema.canvasNode.userId, user.userId)));
    res.status(200).json({ ok: true, nodes: rows });
    return;
  }

  if (req.method === "POST") {
    const body = (req.body ?? {}) as {
      id?: string; spaceId?: string; type?: string; name?: string; prompt?: string;
      assetUrl?: string; posX?: number; posY?: number; width?: number; height?: number;
      status?: string; dataPayload?: unknown;
    };
    if (!body.type) {
      res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "Falta type." });
      return;
    }
    const id = body.id || crypto.randomUUID();
    // onConflictDoNothing por id — permite un patrón "asegurar que existe" idempotente
    // (ver useCanvasExecution.ts ensureNodePersisted) sin una lectura previa.
    const [created] = await db
      .insert(schema.canvasNode)
      .values({
        id,
        userId: user.userId,
        spaceId: body.spaceId || null,
        type: body.type,
        name: body.name ?? null,
        prompt: body.prompt ?? "",
        assetUrl: body.assetUrl ?? null,
        posX: body.posX ?? 0,
        posY: body.posY ?? 0,
        width: body.width ?? 300,
        height: body.height ?? 300,
        status: body.status ?? "loading",
        dataPayload: body.dataPayload ?? {},
      })
      .onConflictDoNothing({ target: schema.canvasNode.id })
      .returning();

    if (created) {
      res.status(200).json({ ok: true, node: created, created: true });
      return;
    }
    const [existing] = await db.select().from(schema.canvasNode)
      .where(and(eq(schema.canvasNode.id, id), eq(schema.canvasNode.userId, user.userId))).limit(1);
    if (!existing) return void res.status(409).json({ ok: false, code: "CONFLICT", error: "El nodo ya existe con otro dueño." });
    res.status(200).json({ ok: true, node: existing, created: false });
    return;
  }

  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
  } catch (err) {
    console.error("[api/canvas-nodes]", err);
    res.status(500).json({ ok: false, code: "INTERNAL_ERROR", error: "Error al procesar la solicitud. Intenta de nuevo." });
  }
}
