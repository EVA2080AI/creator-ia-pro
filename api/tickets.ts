// Tickets de soporte (reportar error o mejora). GET/POST aquí; PATCH de
// estado (solo admin) en /api/tickets/[id]. Ver db/schema/tickets.ts y
// src/components/tickets/ReportButton.tsx.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../db/index.js";
import { requireUser } from "./_lib/require-user.js";
import { getProfile } from "./_lib/session.js";

const MAX_TITLE = 200;
const MAX_DESC = 4000;
const TYPE_VALUES = ["bug", "mejora"] as const;

const CREATE_SCHEMA = z.object({
  type: z.enum(TYPE_VALUES, { errorMap: () => ({ message: `Tipo inválido. Usa uno de: ${TYPE_VALUES.join(", ")}.` }) }),
  title: z.string().trim().min(1, "Falta el título.").max(MAX_TITLE),
  description: z.string().trim().max(MAX_DESC).nullish(),
  pageUrl: z.string().trim().max(500).nullish(),
});

function validationError(res: VercelResponse, error: z.ZodError): void {
  const issue = error.issues[0];
  res.status(400).json({ ok: false, code: "BAD_REQUEST", error: issue?.message ?? "Datos inválidos." });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const db = getDb();

  if (req.method === "GET") {
    const profile = await getProfile(user.userId);
    const rows = profile?.isAdmin
      ? await db.select().from(schema.ticket).orderBy(desc(schema.ticket.createdAt))
      : await db.select().from(schema.ticket).where(eq(schema.ticket.userId, user.userId)).orderBy(desc(schema.ticket.createdAt));
    res.status(200).json({ ok: true, tickets: rows });
    return;
  }

  if (req.method === "POST") {
    const parsed = CREATE_SCHEMA.safeParse(req.body ?? {});
    if (!parsed.success) return validationError(res, parsed.error);
    const { type, title, description, pageUrl } = parsed.data;

    const [created] = await db.insert(schema.ticket).values({
      id: crypto.randomUUID(),
      userId: user.userId,
      type,
      title,
      description: description || null,
      pageUrl: pageUrl || null,
    }).returning();

    res.status(201).json({ ok: true, ticket: created });
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido." });
}
