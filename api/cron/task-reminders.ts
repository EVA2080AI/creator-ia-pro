// Cron diario — manda por correo las tareas que vencen hoy o están atrasadas.
//
// Antes el recordatorio solo salía cuando el usuario abría /tareas
// (src/pages/Tasks.tsx): quien no entraba ese día nunca lo recibía. Este cron
// hace el envío en el servidor, sin sesión, y marca `reminder_sent_at` para no
// repetirlo. El envío desde la página sigue vivo como respaldo para tareas que
// vencen después de que corra el cron; ambos caminos comparten plantilla y
// consultan la misma marca.
//
// Programado en vercel.json (`crons`). Vercel firma la llamada con
// `Authorization: Bearer $CRON_SECRET` si esa variable está configurada — si
// no lo está, se procesa igual (mismo criterio que subscription-renewals).
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, asc, count, eq, gte, inArray, isNotNull, isNull, lte, ne } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { sendSystemEmail } from "../_lib/send-system-email.js";
import { buildTaskReminderEmail } from "../_lib/task-reminder-email.js";

const PER_USER_DAILY_LIMIT = 30;
const GLOBAL_DAILY_LIMIT = 90;
const MAX_TASKS_PER_EMAIL = 20;

/** Fecha de hoy en Colombia (America/Bogota) como YYYY-MM-DD. */
function todayInBogota(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    if (req.headers.authorization !== `Bearer ${cronSecret}`) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }
  } else {
    console.warn("[cron/task-reminders] CRON_SECRET no configurado — verificación omitida.");
  }

  const db = getDb();
  const now = new Date();
  const today = todayInBogota(now);

  // Tareas vencidas (hoy o antes) con aviso activo y sin recordatorio previo.
  const rows = await db
    .select({
      id: schema.task.id,
      userId: schema.task.userId,
      title: schema.task.title,
      description: schema.task.description,
      status: schema.task.status,
      priority: schema.task.priority,
      dueDate: schema.task.dueDate,
      email: schema.user.email,
      name: schema.user.name,
    })
    .from(schema.task)
    .innerJoin(schema.user, eq(schema.user.id, schema.task.userId))
    .where(and(
      eq(schema.task.notifyEmail, true),
      ne(schema.task.status, "done"),
      isNotNull(schema.task.dueDate),
      lte(schema.task.dueDate, today),
      isNull(schema.task.reminderSentAt),
    ))
    .orderBy(asc(schema.task.userId), asc(schema.task.createdAt));

  if (rows.length === 0) {
    res.status(200).json({ ok: true, sent: 0, users: 0, checked: 0 });
    return;
  }

  const byUser = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byUser.get(row.userId);
    if (list) list.push(row);
    else byUser.set(row.userId, [row]);
  }

  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [globalCountRow] = await db
    .select({ n: count() })
    .from(schema.emailLog)
    .where(and(eq(schema.emailLog.status, "sent"), gte(schema.emailLog.createdAt, since)));
  let globalSent = globalCountRow?.n ?? 0;

  let sent = 0;
  let users = 0;
  let skipped = 0;
  let stoppedForLimit = false;

  for (const [userId, userTasks] of byUser) {
    if (globalSent >= GLOBAL_DAILY_LIMIT) {
      stoppedForLimit = true;
      break;
    }

    const first = userTasks[0];
    const [userCountRow] = await db
      .select({ n: count() })
      .from(schema.emailLog)
      .where(and(
        eq(schema.emailLog.userId, userId),
        eq(schema.emailLog.status, "sent"),
        gte(schema.emailLog.createdAt, since),
      ));
    if ((userCountRow?.n ?? 0) >= PER_USER_DAILY_LIMIT) {
      skipped++;
      continue;
    }

    const tasks = userTasks.slice(0, MAX_TASKS_PER_EMAIL);
    const email = buildTaskReminderEmail(tasks.map((t) => ({
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      due_date: t.dueDate,
    })));

    const ok = await sendSystemEmail({
      to: first.email,
      userId,
      subject: email.subject,
      html: email.html,
      text: email.text,
      template: "task_reminder",
      metadata: {
        task_count: tasks.length,
        task_ids: tasks.map((t) => t.id),
        from_cron: true,
      },
    });

    if (!ok) {
      skipped++;
      continue;
    }

    await db
      .update(schema.task)
      .set({ reminderSentAt: now })
      .where(and(
        eq(schema.task.userId, userId),
        inArray(schema.task.id, tasks.map((t) => t.id)),
        isNull(schema.task.reminderSentAt),
      ));

    sent++;
    users++;
    globalSent++;
  }

  res.status(200).json({
    ok: true,
    sent,
    users,
    skipped,
    checked: rows.length,
    stoppedForLimit,
  });
}
