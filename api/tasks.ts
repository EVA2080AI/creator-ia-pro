// Tareas — reemplaza `supabase.from("tasks")`. GET/POST aquí; PATCH/DELETE
// por id en /api/tasks/[id]. Acciones en lote (mover varias, limpiar
// completadas) van por POST con `action`.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq, inArray, asc } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../db/index.js";
import { requireUser } from "./_lib/require-user.js";
import { computeCompletedAt } from "./_lib/tasks.js";

const MAX_TITLE = 200;
const MAX_DESC = 4000;

const STATUS_VALUES = ["todo", "in_progress", "done"] as const;
const PRIORITY_VALUES = ["low", "medium", "high"] as const;

const MOVE_SCHEMA = z.object({
  action: z.literal("move"),
  updates: z.array(z.object({
    id: z.string().min(1),
    status: z.enum(STATUS_VALUES, { errorMap: () => ({ message: `Estado inválido. Usa uno de: ${STATUS_VALUES.join(", ")}.` }) }),
    position: z.number(),
  })).min(1, "Falta la lista de tareas a mover."),
});

const CREATE_SCHEMA = z.object({
  title: z.string().trim().min(1, "Falta el título.").max(MAX_TITLE),
  description: z.string().trim().max(MAX_DESC).nullish(),
  status: z.enum(STATUS_VALUES, { errorMap: () => ({ message: `Estado inválido. Usa uno de: ${STATUS_VALUES.join(", ")}.` }) }).optional(),
  priority: z.enum(PRIORITY_VALUES, { errorMap: () => ({ message: `Prioridad inválida. Usa una de: ${PRIORITY_VALUES.join(", ")}.` }) }).optional(),
  dueDate: z.string().nullish(),
  position: z.number().optional(),
  notifyEmail: z.boolean().optional(),
});

function validationError(res: VercelResponse, error: z.ZodError): void {
  const issue = error.issues[0];
  res.status(400).json({ ok: false, code: "BAD_REQUEST", error: issue?.message ?? "Datos inválidos." });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const db = getDb();

  try {

  if (req.method === "GET") {
    const rows = await db
      .select()
      .from(schema.task)
      .where(eq(schema.task.userId, user.userId))
      .orderBy(asc(schema.task.position), asc(schema.task.createdAt));
    res.status(200).json({ ok: true, tasks: rows });
    return;
  }

  if (req.method === "POST") {
    const body = (req.body ?? {}) as {
      action?: "move" | "clear-done" | "mark-reminded";
      updates?: { id: string; status: string; position: number }[];
      ids?: string[];
      title?: string;
      description?: string | null;
      status?: string;
      priority?: string;
      dueDate?: string | null;
      position?: number;
      notifyEmail?: boolean;
    };

    if (body.action === "move" && body.updates) {
      const parsedMove = MOVE_SCHEMA.safeParse(body);
      if (!parsedMove.success) return validationError(res, parsedMove.error);
      const ids = body.updates.map((u) => u.id);
      const current = await db.select({ id: schema.task.id, status: schema.task.status, completedAt: schema.task.completedAt })
        .from(schema.task)
        .where(and(eq(schema.task.userId, user.userId), inArray(schema.task.id, ids)));
      const byId = new Map(current.map((t) => [t.id, t]));

      const results = await Promise.all(
        body.updates.map((u) => {
          const existing = byId.get(u.id);
          const newStatus = u.status as "todo" | "in_progress" | "done";
          const completedAt = computeCompletedAt(existing?.status ?? null, newStatus, existing?.completedAt ?? null);
          return db.update(schema.task)
            .set({ status: newStatus, position: u.position, completedAt, updatedAt: new Date() })
            .where(and(eq(schema.task.id, u.id), eq(schema.task.userId, user.userId)));
        })
      );
      res.status(200).json({ ok: true, moved: results.length });
      return;
    }

    if (body.action === "clear-done") {
      const deleted = await db
        .delete(schema.task)
        .where(and(eq(schema.task.userId, user.userId), eq(schema.task.status, "done")))
        .returning({ id: schema.task.id });
      res.status(200).json({ ok: true, deleted: deleted.length });
      return;
    }

    if (body.action === "mark-reminded" && body.ids?.length) {
      await db
        .update(schema.task)
        .set({ reminderSentAt: new Date() })
        .where(and(eq(schema.task.userId, user.userId), inArray(schema.task.id, body.ids)));
      res.status(200).json({ ok: true });
      return;
    }

    // Crear tarea
    const parsedCreate = CREATE_SCHEMA.safeParse(body);
    if (!parsedCreate.success) return validationError(res, parsedCreate.error);
    const data = parsedCreate.data;
    const [created] = await db
      .insert(schema.task)
      .values({
        id: crypto.randomUUID(),
        userId: user.userId,
        title: data.title,
        description: data.description?.trim() || null,
        status: data.status ?? "todo",
        priority: data.priority ?? "medium",
        dueDate: data.dueDate || null,
        position: data.position ?? 0,
        notifyEmail: !!data.notifyEmail,
        completedAt: data.status === "done" ? new Date() : null,
      })
      .returning();
    res.status(200).json({ ok: true, task: created });
    return;
  }

  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
  } catch (err) {
    console.error("[api/tasks]", err);
    res.status(500).json({ ok: false, code: "INTERNAL_ERROR", error: "Error al procesar la solicitud. Intenta de nuevo." });
  }
}
