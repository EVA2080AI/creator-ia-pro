// Tareas — reemplaza `supabase.from("tasks")`. GET/POST aquí; PATCH/DELETE
// por id en /api/tasks/[id]. Acciones en lote (mover varias, limpiar
// completadas) van por POST con `action`.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq, inArray, asc } from "drizzle-orm";
import { getDb, schema } from "../db/index.js";
import { requireUser } from "./_lib/require-user.js";
import { computeCompletedAt } from "./_lib/tasks.js";

const MAX_TITLE = 200;
const MAX_DESC = 4000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const db = getDb();

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
    if (!body.title?.trim()) {
      res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "Falta el título." });
      return;
    }
    const [created] = await db
      .insert(schema.task)
      .values({
        id: crypto.randomUUID(),
        userId: user.userId,
        title: body.title.trim().slice(0, MAX_TITLE),
        description: body.description?.trim().slice(0, MAX_DESC) || null,
        status: (body.status as "todo" | "in_progress" | "done") ?? "todo",
        priority: (body.priority as "low" | "medium" | "high") ?? "medium",
        dueDate: body.dueDate || null,
        position: body.position ?? 0,
        notifyEmail: !!body.notifyEmail,
        completedAt: body.status === "done" ? new Date() : null,
      })
      .returning();
    res.status(200).json({ ok: true, task: created });
    return;
  }

  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
}
