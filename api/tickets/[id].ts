// Cambiar el estado de un ticket — solo admin (ver api/tickets.ts).
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { requireAdmin } from "../_lib/require-admin.js";

const STATUS_VALUES = ["abierto", "en_progreso", "resuelto"] as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const db = getDb();
  const id = req.query.id as string;

  if (req.method === "PATCH") {
    const body = (req.body ?? {}) as { status?: string };
    if (!body.status || !STATUS_VALUES.includes(body.status as typeof STATUS_VALUES[number])) {
      res.status(400).json({ ok: false, code: "BAD_REQUEST", error: `Estado inválido. Usa uno de: ${STATUS_VALUES.join(", ")}.` });
      return;
    }
    const [updated] = await db.update(schema.ticket)
      .set({ status: body.status as typeof STATUS_VALUES[number], updatedAt: new Date() })
      .where(eq(schema.ticket.id, id))
      .returning();
    if (!updated) return void res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Ticket no encontrado." });
    res.status(200).json({ ok: true, ticket: updated });
    return;
  }

  res.setHeader("Allow", "PATCH");
  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido." });
}
