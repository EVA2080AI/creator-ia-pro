// Historial de conversaciones de Basalt — antes vivía solo en localStorage
// (ver db/schema/basalt.ts). GET lista las últimas 50 del usuario; POST hace
// upsert de una conversación completa, mismo shape que StoredConversation
// en src/lib/basalt.ts. DELETE de una sola conversación vive en [id].ts.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../../db/index.js";
import { requireUser } from "../_lib/require-user.js";

const MAX_CONVERSATIONS = 50;
const MAX_TITLE = 200;

const IMAGE_SCHEMA = z.object({
  prompt: z.string(),
  format: z.string(),
  url: z.string().optional(),
  error: z.string().optional(),
});

const MSG_SCHEMA = z.object({
  id: z.string(),
  role: z.enum(["user", "model"]),
  text: z.string(),
  images: z.array(IMAGE_SCHEMA).optional(),
});

const UPSERT_SCHEMA = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(MAX_TITLE),
  messages: z.array(MSG_SCHEMA),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const db = getDb();

  if (req.method === "GET") {
    const rows = await db.select().from(schema.basaltConversation)
      .where(eq(schema.basaltConversation.userId, user.userId))
      .orderBy(desc(schema.basaltConversation.updatedAt))
      .limit(MAX_CONVERSATIONS);
    res.status(200).json({
      ok: true,
      conversations: rows.map((r) => ({
        id: r.id,
        title: r.title,
        updatedAt: r.updatedAt.getTime(),
        messages: r.messages,
      })),
    });
    return;
  }

  if (req.method === "POST") {
    const parsed = UPSERT_SCHEMA.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ ok: false, code: "BAD_REQUEST", error: parsed.error.issues[0]?.message ?? "Datos inválidos." });
      return;
    }
    const { id, title, messages } = parsed.data;

    await db.insert(schema.basaltConversation)
      .values({ id, userId: user.userId, title, messages, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: schema.basaltConversation.id,
        set: { title, messages, updatedAt: new Date() },
      });

    // Tope de 50 conversaciones por usuario — igual al límite que ya
    // aplicaba el localStorage (Array.slice(0, 50) en src/lib/basalt.ts).
    const all = await db.select({ id: schema.basaltConversation.id })
      .from(schema.basaltConversation)
      .where(eq(schema.basaltConversation.userId, user.userId))
      .orderBy(desc(schema.basaltConversation.updatedAt));
    if (all.length > MAX_CONVERSATIONS) {
      const toDelete = all.slice(MAX_CONVERSATIONS).map((r) => r.id);
      await db.delete(schema.basaltConversation).where(inArray(schema.basaltConversation.id, toDelete));
    }

    res.status(200).json({ ok: true });
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido." });
}
