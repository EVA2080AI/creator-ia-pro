// Plantilla del recordatorio de tareas — compartida por los dos caminos que
// la envían: la sesión del usuario (api/email/send.ts) y el cron diario
// (api/cron/task-reminders.ts). Si se toca el diseño, cambia en ambos.

const APP_URL = "https://creator-ia.com";
const TASKS_URL = `${APP_URL}/tareas`;

export interface ReminderTask {
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  due_date?: string | null;
}

export interface BuiltReminderEmail {
  subject: string;
  html: string;
  text: string;
}

const escapeHtml = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    (({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }) as Record<string, string>)[c]
  );

const nl2br = (value: string) => escapeHtml(value).replace(/\r?\n/g, "<br>");

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
  Enviado desde <a href="${TASKS_URL}" style="color:#a855f7;text-decoration:none;font-weight:600;">Creator IA Pro · Tareas</a>.
  Puedes desactivar el aviso por correo en cada tarea.
</td></tr>
</table></td></tr></table></body></html>`;
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:8px;padding:12px 22px;background:#18181b;color:#ffffff;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">${escapeHtml(label)}</a>`;
}

function taskCardHtml(t: ReminderTask): string {
  const pr = PRIORITY_STYLE[t.priority ?? "medium"] ?? PRIORITY_STYLE.medium;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e4e4e7;border-radius:14px;margin:14px 0;">
<tr><td style="padding:16px 18px;">
  <div style="font-size:16px;font-weight:700;color:#18181b;">${escapeHtml(t.title)}</div>
  ${t.description ? `<div style="margin-top:6px;color:#52525b;font-size:14px;">${nl2br(t.description)}</div>` : ""}
  <div style="margin-top:12px;font-size:12px;color:#71717a;line-height:2;">
    <span style="display:inline-block;padding:2px 10px;border-radius:999px;background:${pr.bg};color:${pr.fg};font-weight:700;">Prioridad ${escapeHtml(PRIORITY_LABEL[t.priority ?? "medium"])}</span>
    &nbsp;&nbsp;📅 ${escapeHtml(formatDate(t.due_date))}
    &nbsp;&nbsp;• ${escapeHtml(STATUS_LABEL[t.status ?? "todo"] ?? t.status ?? "Por hacer")}
  </div>
</td></tr></table>`;
}

function taskText(t: ReminderTask): string {
  const lines = [
    `• ${t.title}`,
    t.description ? `  ${t.description.replace(/\r?\n/g, "\n  ")}` : "",
    `  Prioridad: ${PRIORITY_LABEL[t.priority ?? "medium"]} · Fecha: ${formatDate(t.due_date)} · Estado: ${STATUS_LABEL[t.status ?? "todo"] ?? t.status}`,
  ];
  return lines.filter(Boolean).join("\n");
}

/** Correo con las tareas que vencen hoy o están atrasadas. */
export function buildTaskReminderEmail(tasks: ReminderTask[]): BuiltReminderEmail {
  const n = tasks.length;
  const subject = n === 1
    ? `⏰ Recordatorio: "${tasks[0].title}" vence hoy o está atrasada`
    : `⏰ Tienes ${n} tareas que vencen hoy o están atrasadas`;
  const html = layout(
    "Recordatorio de tareas",
    `<p style="margin:0 0 6px;">Estas tareas vencen hoy o ya están atrasadas:</p>${tasks.map(taskCardHtml).join("")}${button("Ponerme al día", TASKS_URL)}`,
    subject,
  );
  return {
    subject,
    html,
    text: `Recordatorio de tareas:\n\n${tasks.map(taskText).join("\n\n")}\n\nAbre tus tareas: ${TASKS_URL}`,
  };
}
