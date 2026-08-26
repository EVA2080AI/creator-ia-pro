// send — Correo transaccional con Resend (plan gratuito).
// Portado de supabase/functions/send-email — mismas plantillas y límites,
// ahora sobre better-auth + Neon en vez de Supabase Auth + Postgres.
//
// Plantillas: task_created · task_completed · task_reminder · task_share · custom
// Secretos: RESEND_API_KEY (obligatorio), RESEND_FROM (opcional).
// Límite: 30 correos/usuario/día y 90/día global (plan gratuito de Resend: 100/día, 3000/mes).
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, count, eq, gte } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { requireUser } from "../_lib/require-user.js";

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "Creator IA Pro <onboarding@resend.dev>";
const APP_URL = "https://creator-ia.com";

const PER_USER_DAILY_LIMIT = 30;
const GLOBAL_DAILY_LIMIT = 90;

type Template = "task_created" | "task_completed" | "task_share" | "task_reminder" | "custom";
const TEMPLATES: Template[] = ["task_created", "task_completed", "task_share", "task_reminder", "custom"];

interface TaskPayload {
  id?: string;
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  due_date?: string | null;
}

interface SendEmailRequest {
  template: Template;
  to?: string;
  subject?: string;
  message?: string;
  task?: TaskPayload;
  tasks?: TaskPayload[];
}

interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const escapeHtml = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    (({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }) as Record<string, string>)[c]
  );

const nl2br = (value: string) => escapeHtml(value).replace(/\r?\n/g, "<br>");

const isValidEmail = (value: unknown): value is string =>
  typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

const STATUS_LABEL: Record<string, string> = { todo: "Por hacer", in_progress: "En progreso", done: "Hecha" };
const PRIORITY_LABEL: Record<string, string> = { low: "Baja", medium: "Media", high: "Alta" };
const PRIORITY_STYLE: Record<string, { bg: string; fg: string }> = {
  low: { bg: "#ecfdf5", fg: "#059669" },
  medium: { bg: "#fffbeb", fg: "#d97706" },
  high: { bg: "#fff1f2", fg: "#e11d48" },
};

function formatDate(value?: string | null): string {
  if (!value) return "Sin fecha";
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-CO", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}

function sanitizeTask(input: unknown): TaskPayload | null {
  if (!input || typeof input !== "object") return null;
  const t = input as Record<string, unknown>;
  const title = typeof t.title === "string" ? t.title.trim().slice(0, 200) : "";
  if (!title) return null;
  return {
    id: typeof t.id === "string" ? t.id : undefined,
    title,
    description: typeof t.description === "string" ? t.description.trim().slice(0, 2000) : null,
    status: typeof t.status === "string" && t.status in STATUS_LABEL ? t.status : "todo",
    priority: typeof t.priority === "string" && t.priority in PRIORITY_LABEL ? t.priority : "medium",
    due_date: typeof t.due_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.due_date) ? t.due_date : null,
  };
}

// ── Plantillas HTML ─────────────────────────────────────────────────────────
function layout(title: string, content: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;border:1px solid #e4e4e7;overflow:hidden;">
<tr><td style="background:#a855f7;background-image:linear-gradient(135deg,#a855f7,#6366f1);padding:22px 28px;">
  <div style="font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:rgba(255,255,255,.85);font-weight:700;">Creator IA Pro</div>
  <div style="font-size:20px;font-weight:800;color:#ffffff;margin-top:6px;">${escapeHtml(title)}</div>
</td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.6;">${content}</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #f4f4f5;font-size:12px;color:#71717a;">
  Enviado desde <a href="${APP_URL}/tareas" style="color:#a855f7;text-decoration:none;font-weight:600;">Creator IA Pro · Tareas</a>.
  Puedes desactivar el aviso por correo en cada tarea.
</td></tr>
</table></td></tr></table></body></html>`;
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:8px;padding:12px 22px;background:#18181b;color:#ffffff;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">${escapeHtml(label)}</a>`;
}

function taskCardHtml(t: TaskPayload): string {
  const pr = PRIORITY_STYLE[t.priority ?? "medium"] ?? PRIORITY_STYLE.medium;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e4e4e7;border-radius:14px;margin:14px 0;">
<tr><td style="padding:16px 18px;">
  <div style="font-size:16px;font-weight:700;color:#18181b;">${escapeHtml(t.title)}</div>
  ${t.description ? `<div style="margin-top:6px;color:#52525b;font-size:14px;">${nl2br(t.description)}</div>` : ""}
  <div style="margin-top:12px;font-size:12px;color:#71717a;line-height:2;">
    <span style="display:inline-block;padding:2px 10px;border-radius:999px;background:${pr.bg};color:${pr.fg};font-weight:700;">Prioridad ${escapeHtml(PRIORITY_LABEL[t.priority ?? "medium"])}</span>
    &nbsp;&nbsp;📅 ${escapeHtml(formatDate(t.due_date))}
    &nbsp;&nbsp;• ${escapeHtml(STATUS_LABEL[t.status ?? "todo"] ?? t.status)}
  </div>
</td></tr></table>`;
}

function taskText(t: TaskPayload): string {
  const lines = [
    `• ${t.title}`,
    t.description ? `  ${t.description.replace(/\r?\n/g, "\n  ")}` : "",
    `  Prioridad: ${PRIORITY_LABEL[t.priority ?? "medium"]} · Fecha: ${formatDate(t.due_date)} · Estado: ${STATUS_LABEL[t.status ?? "todo"]}`,
  ];
  return lines.filter(Boolean).join("\n");
}

function buildEmail(
  req: SendEmailRequest,
  ctx: { senderName: string; senderEmail: string; task: TaskPayload | null; tasks: TaskPayload[] },
): BuiltEmail {
  const tasksUrl = `${APP_URL}/tareas`;
  const footerText = `\n\nAbre tus tareas: ${tasksUrl}`;

  switch (req.template) {
    case "task_created": {
      const t = ctx.task!;
      const subject = `✅ Nueva tarea: ${t.title}`;
      const html = layout(
        "Nueva tarea creada",
        `<p style="margin:0 0 6px;">Hola, acabas de crear una tarea en tu tablero.</p>${taskCardHtml(t)}${button("Abrir mis tareas", tasksUrl)}`,
        t.title,
      );
      return { subject, html, text: `Nueva tarea creada:\n\n${taskText(t)}${footerText}` };
    }
    case "task_completed": {
      const t = ctx.task!;
      const subject = `🎉 Tarea completada: ${t.title}`;
      const html = layout(
        "¡Tarea completada!",
        `<p style="margin:0 0 6px;">Marcaste esta tarea como hecha. ¡Buen trabajo!</p>${taskCardHtml({ ...t, status: "done" })}${button("Ver tablero", tasksUrl)}`,
        t.title,
      );
      return { subject, html, text: `Tarea completada:\n\n${taskText({ ...t, status: "done" })}${footerText}` };
    }
    case "task_share": {
      const t = ctx.task!;
      const subject = `${ctx.senderName} te compartió una tarea: ${t.title}`;
      const note = req.message?.trim()
        ? `<blockquote style="margin:14px 0;padding:12px 16px;border-left:3px solid #a855f7;background:#faf5ff;border-radius:0 12px 12px 0;color:#3f3f46;">${nl2br(req.message.trim().slice(0, 2000))}</blockquote>`
        : "";
      const html = layout(
        "Te compartieron una tarea",
        `<p style="margin:0;"><strong>${escapeHtml(ctx.senderName)}</strong> (${escapeHtml(ctx.senderEmail)}) te compartió esta tarea desde Creator IA Pro.</p>${note}${taskCardHtml(t)}<p style="margin:14px 0 0;font-size:13px;color:#71717a;">Responde a este correo para contactar directamente a ${escapeHtml(ctx.senderName)}.</p>`,
        t.title,
      );
      const text = `${ctx.senderName} (${ctx.senderEmail}) te compartió una tarea:\n\n${req.message?.trim() ? `"${req.message.trim()}"\n\n` : ""}${taskText(t)}\n\nResponde a este correo para contactar a ${ctx.senderName}.`;
      return { subject, html, text };
    }
    case "task_reminder": {
      const n = ctx.tasks.length;
      const subject = n === 1
        ? `⏰ Recordatorio: "${ctx.tasks[0].title}" vence hoy o está atrasada`
        : `⏰ Tienes ${n} tareas que vencen hoy o están atrasadas`;
      const html = layout(
        "Recordatorio de tareas",
        `<p style="margin:0 0 6px;">Estas tareas vencen hoy o ya están atrasadas:</p>${ctx.tasks.map(taskCardHtml).join("")}${button("Ponerme al día", tasksUrl)}`,
        subject,
      );
      return { subject, html, text: `Recordatorio de tareas:\n\n${ctx.tasks.map(taskText).join("\n\n")}${footerText}` };
    }
    case "custom": {
      const subject = (req.subject ?? "").trim().slice(0, 200);
      const message = (req.message ?? "").trim().slice(0, 5000);
      const html = layout(
        subject,
        `<p style="margin:0;white-space:normal;">${nl2br(message)}</p><p style="margin:16px 0 0;font-size:13px;color:#71717a;">Enviado por ${escapeHtml(ctx.senderName)} (${escapeHtml(ctx.senderEmail)}).</p>`,
        message.slice(0, 120),
      );
      return { subject, html, text: `${message}\n\n— ${ctx.senderName} (${ctx.senderEmail})` };
    }
  }
}

// ── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
    return;
  }

  const authUser = await requireUser(req, res);
  if (!authUser) return;

  const body = req.body as SendEmailRequest;
  if (!body || !TEMPLATES.includes(body.template)) {
    res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "Plantilla de correo desconocida." });
    return;
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error("[email/send] RESEND_API_KEY no está configurada");
    res.status(200).json({
      ok: false,
      code: "NOT_CONFIGURED",
      error: "El envío de correos no está configurado. Agrega RESEND_API_KEY en Vercel → Settings → Environment Variables.",
    });
    return;
  }
  const from = process.env.RESEND_FROM?.trim() || DEFAULT_FROM;

  const external = body.template === "task_share" || body.template === "custom";
  const to = external ? String(body.to ?? "").trim().toLowerCase() : authUser.email;
  if (!isValidEmail(to)) {
    res.status(400).json({
      ok: false, code: "BAD_REQUEST",
      error: external ? "El correo del destinatario no es válido." : "Tu cuenta no tiene un correo válido.",
    });
    return;
  }

  const task = sanitizeTask(body.task);
  const tasks = Array.isArray(body.tasks) ? body.tasks.map(sanitizeTask).filter((t): t is TaskPayload => !!t).slice(0, 20) : [];
  if (["task_created", "task_completed", "task_share"].includes(body.template) && !task) {
    res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "Falta la tarea a enviar." });
    return;
  }
  if (body.template === "task_reminder" && tasks.length === 0) {
    res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "No hay tareas para recordar." });
    return;
  }
  if (body.template === "custom" && (!body.subject?.trim() || !body.message?.trim())) {
    res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "El asunto y el mensaje son obligatorios." });
    return;
  }

  const db = getDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [[userCountRow], [globalCountRow]] = await Promise.all([
    db.select({ n: count() }).from(schema.emailLog)
      .where(and(eq(schema.emailLog.userId, authUser.userId), eq(schema.emailLog.status, "sent"), gte(schema.emailLog.createdAt, since))),
    db.select({ n: count() }).from(schema.emailLog)
      .where(and(eq(schema.emailLog.status, "sent"), gte(schema.emailLog.createdAt, since))),
  ]);
  if ((userCountRow?.n ?? 0) >= PER_USER_DAILY_LIMIT) {
    res.status(429).json({ ok: false, code: "RATE_LIMITED", error: `Alcanzaste el límite de ${PER_USER_DAILY_LIMIT} correos por día.` });
    return;
  }
  if ((globalCountRow?.n ?? 0) >= GLOBAL_DAILY_LIMIT) {
    res.status(429).json({ ok: false, code: "RATE_LIMITED", error: "La plataforma alcanzó su límite diario de correos. Intenta mañana." });
    return;
  }

  const senderEmail = authUser.email;
  const senderName = authUser.name || senderEmail.split("@")[0] || "Un usuario de Creator IA Pro";
  const email = buildEmail(body, { senderName, senderEmail, task, tasks });

  const payload: Record<string, unknown> = {
    from, to: [to], subject: email.subject, html: email.html, text: email.text,
    tags: [{ name: "template", value: body.template }],
  };
  if (external && senderEmail) payload.reply_to = senderEmail;

  const resendRes = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const raw = await resendRes.text();
  let data: { id?: string; message?: string } = {};
  try { data = JSON.parse(raw); } catch { /* respuesta no JSON */ }

  const logBase = {
    userId: authUser.userId,
    toEmail: to,
    subject: email.subject,
    template: body.template,
    metadata: { task_id: task?.id ?? null, task_count: tasks.length || (task ? 1 : 0), from },
  };

  if (!resendRes.ok) {
    const providerMsg = data?.message || raw.slice(0, 300) || `HTTP ${resendRes.status}`;
    let friendly = `No se pudo enviar el correo: ${providerMsg}`;
    if (/verify a domain|testing emails|your own email|domain is not verified/i.test(providerMsg)) {
      friendly = "Resend (plan gratuito) solo permite enviar a tu propio correo hasta que verifiques un dominio. Verifica creator-ia.com en resend.com/domains y configura RESEND_FROM.";
    } else if (resendRes.status === 401 || resendRes.status === 403) {
      friendly = "La clave RESEND_API_KEY no es válida o no tiene permiso de envío.";
    } else if (resendRes.status === 429) {
      friendly = "Resend rechazó el envío por límite de velocidad. Intenta en unos segundos.";
    }
    console.error(`[email/send] Resend ${resendRes.status}: ${providerMsg}`);
    await db.insert(schema.emailLog).values({ id: crypto.randomUUID(), ...logBase, status: "failed", error: providerMsg.slice(0, 500) });
    res.status(502).json({ ok: false, code: "PROVIDER_ERROR", error: friendly });
    return;
  }

  await db.insert(schema.emailLog).values({ id: crypto.randomUUID(), ...logBase, status: "sent", providerId: data?.id ?? null });
  res.status(200).json({ ok: true, id: data?.id ?? null, to });
}
