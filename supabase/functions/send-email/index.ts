// send-email — Correo transaccional con Resend (plan gratuito)
// ---------------------------------------------------------------------------
// Plantillas soportadas:
//   task_created    → confirmación al dueño cuando crea una tarea con aviso
//   task_completed  → aviso al dueño cuando completa una tarea con aviso
//   task_reminder   → resumen de tareas vencidas / que vencen hoy (al dueño)
//   task_share      → comparte una tarea con cualquier correo externo
//   custom          → mensaje libre en texto plano a cualquier correo
//
// Secretos requeridos (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY  (obligatorio)  → https://resend.com/api-keys
//   RESEND_FROM     (opcional)     → "Creator IA Pro <tareas@creator-ia.com>"
//                                    Sin dominio verificado, Resend solo permite
//                                    "onboarding@resend.dev" y enviar a tu propio correo.
//
// Límites: el plan gratuito de Resend permite 100 correos/día y 3.000/mes.
// Aquí se aplica un tope por usuario y uno global (ver constantes) usando
// la tabla public.email_logs como contador.
// ---------------------------------------------------------------------------

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escapeHtml = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
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
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" }, 405);

  try {
    // 1. Autenticación (usuario final)
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ ok: false, code: "UNAUTHORIZED", error: "Debes iniciar sesión para enviar correos." }, 401);
    }
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
    if (userError || !user) {
      return json({ ok: false, code: "UNAUTHORIZED", error: "Sesión inválida o expirada." }, 401);
    }

    // 2. Cuerpo de la petición
    let body: SendEmailRequest;
    try {
      body = await req.json();
    } catch {
      return json({ ok: false, code: "BAD_REQUEST", error: "JSON inválido." }, 400);
    }
    if (!body || !TEMPLATES.includes(body.template)) {
      return json({ ok: false, code: "BAD_REQUEST", error: "Plantilla de correo desconocida." }, 400);
    }

    // 3. Configuración de Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("[send-email] RESEND_API_KEY no está configurada en los secretos de Supabase");
      return json({
        ok: false,
        code: "NOT_CONFIGURED",
        error: "El envío de correos no está configurado. Agrega RESEND_API_KEY en Supabase → Edge Functions → Secrets.",
      });
    }
    const from = Deno.env.get("RESEND_FROM")?.trim() || DEFAULT_FROM;

    // 4. Destinatario
    const external = body.template === "task_share" || body.template === "custom";
    const to = external ? String(body.to ?? "").trim().toLowerCase() : (user.email ?? "");
    if (!isValidEmail(to)) {
      return json({
        ok: false,
        code: "BAD_REQUEST",
        error: external ? "El correo del destinatario no es válido." : "Tu cuenta no tiene un correo válido.",
      }, 400);
    }

    // 5. Validación de contenido por plantilla
    const task = sanitizeTask(body.task);
    const tasks = Array.isArray(body.tasks) ? body.tasks.map(sanitizeTask).filter((t): t is TaskPayload => !!t).slice(0, 20) : [];
    if (["task_created", "task_completed", "task_share"].includes(body.template) && !task) {
      return json({ ok: false, code: "BAD_REQUEST", error: "Falta la tarea a enviar." }, 400);
    }
    if (body.template === "task_reminder" && tasks.length === 0) {
      return json({ ok: false, code: "BAD_REQUEST", error: "No hay tareas para recordar." }, 400);
    }
    if (body.template === "custom" && (!body.subject?.trim() || !body.message?.trim())) {
      return json({ ok: false, code: "BAD_REQUEST", error: "El asunto y el mensaje son obligatorios." }, 400);
    }

    // 6. Límites diarios (plan gratuito de Resend)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [userCountRes, globalCountRes] = await Promise.all([
      supabaseAdmin.from("email_logs").select("*", { count: "exact", head: true })
        .eq("user_id", user.id).eq("status", "sent").gte("created_at", since),
      supabaseAdmin.from("email_logs").select("*", { count: "exact", head: true })
        .eq("status", "sent").gte("created_at", since),
    ]);
    if ((userCountRes.count ?? 0) >= PER_USER_DAILY_LIMIT) {
      return json({ ok: false, code: "RATE_LIMITED", error: `Alcanzaste el límite de ${PER_USER_DAILY_LIMIT} correos por día.` }, 429);
    }
    if ((globalCountRes.count ?? 0) >= GLOBAL_DAILY_LIMIT) {
      return json({ ok: false, code: "RATE_LIMITED", error: "La plataforma alcanzó su límite diario de correos. Intenta mañana." }, 429);
    }

    // 7. Nombre del remitente
    const { data: profile } = await supabaseAdmin
      .from("profiles").select("display_name, full_name").eq("user_id", user.id).maybeSingle();
    const senderEmail = user.email ?? "";
    const senderName = profile?.display_name || profile?.full_name || senderEmail.split("@")[0] || "Un usuario de Creator IA Pro";

    const email = buildEmail(body, { senderName, senderEmail, task, tasks });

    // 8. Envío con Resend
    const payload: Record<string, unknown> = {
      from,
      to: [to],
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags: [{ name: "template", value: body.template }],
    };
    if (external && senderEmail) payload.reply_to = senderEmail;

    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const raw = await res.text();
    let data: { id?: string; message?: string; name?: string } = {};
    try { data = JSON.parse(raw); } catch { /* respuesta no JSON */ }

    const logBase = {
      user_id: user.id,
      to_email: to,
      subject: email.subject,
      template: body.template,
      metadata: { task_id: task?.id ?? null, task_count: tasks.length || (task ? 1 : 0), from },
    };

    if (!res.ok) {
      const providerMsg = data?.message || raw.slice(0, 300) || `HTTP ${res.status}`;
      let friendly = `No se pudo enviar el correo: ${providerMsg}`;
      if (/verify a domain|testing emails|your own email|domain is not verified/i.test(providerMsg)) {
        friendly = "Resend (plan gratuito) solo permite enviar a tu propio correo hasta que verifiques un dominio. Verifica creator-ia.com en resend.com/domains y configura RESEND_FROM.";
      } else if (res.status === 401 || res.status === 403) {
        friendly = "La clave RESEND_API_KEY no es válida o no tiene permiso de envío.";
      } else if (res.status === 429) {
        friendly = "Resend rechazó el envío por límite de velocidad. Intenta en unos segundos.";
      }
      console.error(`[send-email] Resend ${res.status}: ${providerMsg}`);
      const { error: logErr } = await supabaseAdmin.from("email_logs").insert({ ...logBase, status: "failed", error: providerMsg.slice(0, 500) });
      if (logErr) console.error("[send-email] log insert failed:", logErr.message);
      return json({ ok: false, code: "PROVIDER_ERROR", error: friendly }, 502);
    }

    const { error: logErr } = await supabaseAdmin.from("email_logs").insert({ ...logBase, status: "sent", provider_id: data?.id ?? null });
    if (logErr) console.error("[send-email] log insert failed:", logErr.message);

    return json({ ok: true, id: data?.id ?? null, to });
  } catch (err) {
    console.error("[send-email] Unhandled error:", err);
    return json({ ok: false, code: "INTERNAL", error: err instanceof Error ? err.message : "Error interno" }, 500);
  }
});
