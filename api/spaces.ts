// Espacios (flujos de Canvas IA) — reemplaza `supabase.from("spaces")`.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, desc } from "drizzle-orm";
import { getDb, schema } from "../db/index.js";
import { requireUser } from "./_lib/require-user.js";

const MAX_NAME = 200;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const db = getDb();

  try {
    if (req.method === "GET") {
      const rows = await db
        .select()
        .from(schema.space)
        .where(eq(schema.space.userId, user.userId))
        .orderBy(desc(schema.space.updatedAt));
      res.status(200).json({ ok: true, spaces: rows });
      return;
    }

    if (req.method === "POST") {
      const body = (req.body ?? {}) as { name?: string; description?: string; settings?: Record<string, unknown> };
      const [created] = await db
        .insert(schema.space)
        .values({
          id: crypto.randomUUID(),
          userId: user.userId,
          name: (body.name || "Untitled Space").slice(0, MAX_NAME),
          description: body.description ?? null,
          settings: body.settings ?? {},
        })
        .returning();
      res.status(200).json({ ok: true, space: created });
      return;
    }

    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
  } catch (err) {
    console.error("[api/spaces]", err);
    res.status(500).json({ ok: false, code: "INTERNAL_ERROR", error: "Error al procesar la solicitud. Intenta de nuevo." });
  }
}
