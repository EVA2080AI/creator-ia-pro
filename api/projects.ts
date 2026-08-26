// Proyectos de Genesis — reemplaza `supabase.from("studio_projects")`.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, desc } from "drizzle-orm";
import { getDb, schema } from "../db/index.js";
import { requireUser } from "./_lib/require-user.js";

const MAX_NAME = 200;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const db = getDb();

  if (req.method === "GET") {
    const rows = await db
      .select()
      .from(schema.project)
      .where(eq(schema.project.userId, user.userId))
      .orderBy(desc(schema.project.updatedAt));
    res.status(200).json({ ok: true, projects: rows });
    return;
  }

  if (req.method === "POST") {
    const body = (req.body ?? {}) as { name?: string };
    const name = (body.name || "Nuevo Proyecto").slice(0, MAX_NAME);
    const [created] = await db
      .insert(schema.project)
      .values({ id: crypto.randomUUID(), userId: user.userId, name, files: {} })
      .returning();
    res.status(200).json({ ok: true, project: created });
    return;
  }

  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
}
