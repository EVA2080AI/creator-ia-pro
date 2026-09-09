// Cron diario — avisa antes de que venza un plan pagado y baja a Free a quien
// dejó vencer el suyo. Bold no soporta cobro recurrente automático (tarjeta
// tokenizada) contra su API real, así que esto es lo más cerca de "renovación
// automática" que se puede construir hoy: nunca se cobra nada solo, siempre
// hay un correo con un link de pago de un clic antes de actuar.
//
// Programado en vercel.json (`crons`). Vercel firma la llamada con
// `Authorization: Bearer $CRON_SECRET` si esa variable está configurada — si
// no lo está, se procesa igual (mismo criterio que BOLD_WEBHOOK_SECRET en
// api/billing/webhook.ts) pero se loguea la advertencia.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq, gte, isNotNull, lt, lte, ne, or, isNull } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { sendSystemEmail, emailLayout, emailButton } from "../_lib/send-system-email.js";

const REMINDER_WINDOW_DAYS = 3;
const GRACE_PERIOD_DAYS = 3;

const TIER_LABEL: Record<string, string> = { creador: "Creador", pro: "Pro", agencia: "Agencia", pyme: "Pyme" };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    if (req.headers.authorization !== `Bearer ${cronSecret}`) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }
  } else {
    console.warn("[cron/subscription-renewals] CRON_SECRET no configurado — verificación omitida.");
  }

  const db = getDb();
  const now = new Date();
  const reminderCutoff = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const graceCutoff = new Date(now.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  // ── 1. Recordatorio: vence en los próximos REMINDER_WINDOW_DAYS días y no se avisó todavía en este ciclo ──
  const dueForReminder = await db
    .select({
      userId: schema.profile.userId,
      email: schema.user.email,
      subscriptionTier: schema.profile.subscriptionTier,
      subscriptionExpiresAt: schema.profile.subscriptionExpiresAt,
    })
    .from(schema.profile)
    .innerJoin(schema.user, eq(schema.user.id, schema.profile.userId))
    .where(and(
      ne(schema.profile.subscriptionTier, "free"),
      isNotNull(schema.profile.subscriptionExpiresAt),
      lte(schema.profile.subscriptionExpiresAt, reminderCutoff),
      gte(schema.profile.subscriptionExpiresAt, now),
      or(isNull(schema.profile.renewalReminderSentAt), lt(schema.profile.renewalReminderSentAt, schema.profile.subscriptionExpiresAt)),
    ));

  let remindersSent = 0;
  for (const row of dueForReminder) {
    const tierLabel = TIER_LABEL[row.subscriptionTier] ?? row.subscriptionTier;
    const expiresLabel = row.subscriptionExpiresAt!.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" });
    const ok = await sendSystemEmail({
      to: row.email,
      userId: row.userId,
      template: "subscription_reminder",
      subject: `Tu plan ${tierLabel} vence el ${expiresLabel}`,
      html: emailLayout(
        "Tu plan está por vencer",
        `<p style="margin:0 0 10px;">Tu plan <strong>${tierLabel}</strong> vence el <strong>${expiresLabel}</strong>. Renuévalo con un clic para no perder tus créditos mensuales — no te cobramos nada automáticamente, vos eliges cuándo.</p>${emailButton(`Renovar ${tierLabel}`, "https://creator-ia.com/pricing")}`,
        `Tu plan ${tierLabel} vence el ${expiresLabel}`,
      ),
      text: `Tu plan ${tierLabel} vence el ${expiresLabel}. Renuévalo en https://creator-ia.com/pricing (no se cobra nada automáticamente).`,
    });
    if (ok) {
      await db.update(schema.profile).set({ renewalReminderSentAt: now }).where(eq(schema.profile.userId, row.userId));
      remindersSent++;
    }
  }

  // ── 2. Bajar a Free: venció hace más de GRACE_PERIOD_DAYS días y nunca renovó ──
  const dueForDowngrade = await db
    .select({
      userId: schema.profile.userId,
      email: schema.user.email,
      subscriptionTier: schema.profile.subscriptionTier,
    })
    .from(schema.profile)
    .innerJoin(schema.user, eq(schema.user.id, schema.profile.userId))
    .where(and(
      ne(schema.profile.subscriptionTier, "free"),
      isNotNull(schema.profile.subscriptionExpiresAt),
      lt(schema.profile.subscriptionExpiresAt, graceCutoff),
    ));

  let downgraded = 0;
  for (const row of dueForDowngrade) {
    const tierLabel = TIER_LABEL[row.subscriptionTier] ?? row.subscriptionTier;
    await db.update(schema.profile)
      .set({ subscriptionTier: "free", subscriptionExpiresAt: null, renewalReminderSentAt: null, updatedAt: now })
      .where(eq(schema.profile.userId, row.userId));
    await db.insert(schema.transaction).values({
      id: crypto.randomUUID(),
      userId: row.userId,
      type: "subscription_change",
      amount: 0,
      description: `Plan ${row.subscriptionTier} vencido — bajado a Free (sin renovar)`,
    });
    await sendSystemEmail({
      to: row.email,
      userId: row.userId,
      template: "subscription_downgraded",
      subject: `Tu plan ${tierLabel} venció`,
      html: emailLayout(
        "Bajamos tu plan a Free",
        `<p style="margin:0 0 10px;">No renovaste tu plan <strong>${tierLabel}</strong> dentro del plazo de gracia, así que tu cuenta pasó a <strong>Free</strong>. Tus proyectos y tu historial siguen intactos — solo cambian los créditos mensuales y los modelos disponibles.</p>${emailButton(`Reactivar ${tierLabel}`, "https://creator-ia.com/pricing")}`,
        `Tu plan ${tierLabel} venció y tu cuenta pasó a Free`,
      ),
      text: `No renovaste tu plan ${tierLabel} y tu cuenta pasó a Free. Reactívalo en https://creator-ia.com/pricing`,
    });
    downgraded++;
  }

  res.status(200).json({ ok: true, remindersSent, downgraded, checkedReminders: dueForReminder.length, checkedDowngrades: dueForDowngrade.length });
}
