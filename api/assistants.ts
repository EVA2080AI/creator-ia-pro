// Catálogo de asistentes visibles para el usuario: las plantillas del sistema
// (Genesis, Mentor IA…) + los propios (personalización por cliente/usuario).
// Ver db/schema/assistants.ts y docs/PLAN_REFACTOR_GENESIS.md.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, or, and } from "drizzle-orm";
import { getDb, schema } from "../db/index.js";
import { requireUser } from "./_lib/require-user.js";

const MAX_NAME = 60;
const MAX_TAGLINE = 140;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const db = getDb();

  if (req.method === "GET") {
    const rows = await db
      .select()
      .from(schema.assistant)
      .where(
        and(
          eq(schema.assistant.isActive, true),
          or(eq(schema.assistant.visibility, "system"), eq(schema.assistant.ownerId, user.userId))
        )
      );
    res.status(200).json({ ok: true, assistants: rows });
    return;
  }

  if (req.method === "POST") {
    const body = (req.body ?? {}) as {
      name?: string;
      tagline?: string;
      slug?: string;
      brand?: Record<string, unknown>;
      welcome?: Record<string, unknown>;
      persona?: Record<string, unknown>;
      capabilities?: Record<string, unknown>;
      defaultModel?: string;
    };
    if (!body.name?.trim()) {
      res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "Falta el nombre del asistente." });
      return;
    }
    const slug = (body.slug || body.name)
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || `asistente-${Date.now()}`;

    const [existing] = await db.select({ id: schema.assistant.id }).from(schema.assistant).where(eq(schema.assistant.slug, slug)).limit(1);
    const finalSlug = existing ? `${slug}-${Math.random().toString(36).slice(2, 6)}` : slug;

    const [created] = await db
      .insert(schema.assistant)
      .values({
        id: crypto.randomUUID(),
        slug: finalSlug,
        ownerId: user.userId,
        visibility: "private",
        name: body.name.trim().slice(0, MAX_NAME),
        tagline: body.tagline?.trim().slice(0, MAX_TAGLINE) || null,
        brand: body.brand ?? {},
        welcome: body.welcome ?? {},
        persona: body.persona ?? {},
        capabilities: body.capabilities ?? { code: false, image: false, text: true, charts: false, vision: false },
        defaultModel: body.defaultModel || "google/gemini-2.5-flash-lite",
      })
      .returning();
    res.status(200).json({ ok: true, assistant: created });
    return;
  }

  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
}
