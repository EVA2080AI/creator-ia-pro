// Correo transaccional disparado por el sistema (cron), no por una sesión de
// usuario — a diferencia de api/email/send.ts (que exige `requireUser` y solo
// manda a la sesión activa), esto lo usa api/cron/subscription-renewals.ts
// para avisar antes de un vencimiento sin que haya nadie logueado en ese
// momento. Mismo remitente/plantilla visual, log en la misma tabla.
import { getDb, schema } from "../../db/index.js";

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "Creator IA Pro <onboarding@resend.dev>";

function layout(title: string, content: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;border:1px solid #e4e4e7;overflow:hidden;">
<tr><td style="background:#a855f7;background-image:linear-gradient(135deg,#a855f7,#6366f1);padding:22px 28px;">
  <div style="font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:rgba(255,255,255,.85);font-weight:700;">Creator IA Pro</div>
  <div style="font-size:20px;font-weight:800;color:#ffffff;margin-top:6px;">${title}</div>
</td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.6;">${content}</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #f4f4f5;font-size:12px;color:#71717a;">
  Creator IA Pro · <a href="https://creator-ia.com/pricing" style="color:#a855f7;text-decoration:none;font-weight:600;">Planes y precios</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

export function emailButton(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:12px;padding:12px 22px;background:#18181b;color:#ffffff;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">${label}</a>`;
}

export function emailLayout(title: string, content: string, preheader = ""): string {
  return layout(title, content, preheader);
}

/** true si se pudo enviar (o si RESEND_API_KEY no está configurada — no bloquea al llamador, solo loguea). */
export async function sendSystemEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  template: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const db = getDb();

  if (!RESEND_API_KEY) {
    console.warn(`[send-system-email] RESEND_API_KEY no configurada — se omite envío de "${opts.template}" a ${opts.to}`);
    return false;
  }

  const from = process.env.RESEND_FROM?.trim() || DEFAULT_FROM;
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html, text: opts.text, tags: [{ name: "template", value: opts.template }] }),
  });
  const raw = await res.text();
  let data: { id?: string; message?: string } = {};
  try { data = JSON.parse(raw); } catch { /* respuesta no JSON */ }

  await db.insert(schema.emailLog).values({
    id: crypto.randomUUID(),
    userId: opts.userId ?? null,
    toEmail: opts.to,
    subject: opts.subject,
    template: opts.template,
    status: res.ok ? "sent" : "failed",
    providerId: res.ok ? (data?.id ?? null) : null,
    error: res.ok ? null : (data?.message || raw.slice(0, 300) || `HTTP ${res.status}`),
    metadata: opts.metadata ?? {},
  });

  if (!res.ok) console.error(`[send-system-email] Resend ${res.status} para "${opts.template}" a ${opts.to}: ${data?.message || raw.slice(0, 200)}`);
  return res.ok;
}
