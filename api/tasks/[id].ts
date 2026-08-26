import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { requireUser } from "../_lib/require-user.js";
import { computeCompletedAt } from "../_lib/tasks.js";

const MAX_TITLE = 200;
const MAX_DESC = 4000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const db = getDb();
  const id = req.query.id as string;
  const owned = and(eq(schema.task.id, id), eq(schema.task.userId, user.userId));

  if (req.method === "PATCH") {
    const body = (req.body ?? {}) as {
      title?: string; description?: string | null; status?: string; priority?: string;
      dueDate?: string | null; position?: number; notifyEmail?: boolean;
    };
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (body.title !== undefined) patch.title = body.title.trim().slice(0, MAX_TITLE);
    if (body.description !== undefined) patch.description = body.description?.trim().slice(0, MAX_DESC) || null;
    if (body.priority !== undefined) patch.priority = body.priority;
    if (body.dueDate !== undefined) patch.dueDate = body.dueDate || null;
    if (body.position !== undefined) patch.position = body.position;
    if (body.notifyEmail !== undefined) patch.notifyEmail = body.notifyEmail;

    if (body.status !== undefined) {
      const [existing] = await db.select({ status: schema.task.status, completedAt: schema.task.completedAt })
        .from(schema.task).where(owned).limit(1);
      const newStatus = body.status as "todo" | "in_progress" | "done";
      patch.status = newStatus;
      patch.completedAt = computeCompletedAt(existing?.status ?? null, newStatus, existing?.completedAt ?? null);
    }

    const [updated] = await db.update(schema.task).set(patch).where(owned).returning();
    if (!updated) return void res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Tarea no encontrada." });
    res.status(200).json({ ok: true, task: updated });
    return;
  }

  if (req.method === "DELETE") {
    const [deleted] = await db.delete(schema.task).where(owned).returning();
    if (!deleted) return void res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Tarea no encontrada." });
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
}
