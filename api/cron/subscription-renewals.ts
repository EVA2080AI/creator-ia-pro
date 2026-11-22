// Cron diario — concilia los pagos de Bold, avisa antes de que venza un plan pagado y baja
// a Free a quien dejó vencer el suyo. Bold no soporta cobro recurrente automático (tarjeta
// tokenizada) contra su API real, así que esto es lo más cerca de "renovación automática"
// que se puede construir hoy: nunca se cobra nada solo, siempre hay un correo con un link
// de pago de un clic antes de actuar.
//
// Programado en vercel.json (`crons`). Vercel firma la llamada con
// `Authorization: Bearer $CRON_SECRET`. Sin esa variable NO corre: desde que concilia
// pagos, cada llamada le pregunta a Bold por las compras pendientes, y eso no puede
// quedar abierto a quien encuentre la URL.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq, gte, isNotNull, lt, lte, ne, or, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { sendSystemEmail, emailLayout, emailButton } from "../_lib/send-system-email.js";
import { getPaymentLink } from "../_lib/bold.js";
import { pendingPurchases, settlePurchase } from "../_lib/billing.js";

const REMINDER_WINDOW_DAYS = 3;
const GRACE_PERIOD_DAYS = 3;

// Conciliación: de a 5 links a la vez y con un tope de tiempo, para que una caída de Bold
// no se coma la función entera y deje sin correr los recordatorios y las bajadas de plan.
const RECONCILE_BATCH = 5;
const RECONCILE_BUDGET_MS = 45_000;

const TIER_LABEL: Record<string, string> = { creador: "Creador", pro: "Pro", agencia: "Agencia", pyme: "Pyme" };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron/subscription-renewals] CRON_SECRET no está configurado: no se ejecuta.");
    res.status(503).json({ ok: false, error: "Cron sin configurar" });
    return;
  }
  if (req.headers.authorization !== `Bearer ${cronSecret}`) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  const db = getDb();

  // ── 0. Conciliar: compras que Bold ya cobró y acá siguen pendientes ──
  // El aviso de Bold puede perderse (webhook sin registrar, una caída, el comprador que
  // cierra la pestaña antes de volver). Una vez al día se le pregunta a Bold por cada compra
  // pendiente de los últimos 30 días (un link no vence). Va PRIMERO: quien renovó ayer no
  // debe recibir el recordatorio ni bajar a Free unas líneas más abajo.
  let reconciled = 0;
  let reconcileSkipped = 0;
  const boldKey = process.env.BOLD_API_KEY;
  if (boldKey) {
    try {
      const pending = await pendingPurchases(db);
      const deadline = Date.now() + RECONCILE_BUDGET_MS;
      for (let i = 0; i < pending.length; i += RECONCILE_BATCH) {
        if (Date.now() > deadline) {
          reconcileSkipped = pending.length - i;
          console.error(`[cron/subscription-renewals] conciliación: se acabó el tiempo y quedaron ${reconcileSkipped} compras sin revisar.`);
          break;
        }
        await Promise.all(pending.slice(i, i + RECONCILE_BATCH).map(async (purchase) => {
          try {
            const link = await getPaymentLink(boldKey, purchase.linkId, 5_000);
            if (link.status !== "PAID") return;
            // Pago de prueba (o Bold no dijo si lo era): solo a un admin. Ver api/billing/confirm.ts.
            if (link.isSandbox !== false && !purchase.isAdmin) return;
            const result = await settlePurchase(db, purchase, { test: link.isSandbox !== false });
            if (result.status === "credited") reconciled++;
            else if (result.status === "invalid") console.error(`[cron/subscription-renewals] ${purchase.linkId}: pagado SIN acreditar — ${result.reason}`);
          } catch (err) {
            console.error(`[cron/subscription-renewals] no se pudo conciliar ${purchase.linkId}:`, err);
          }
        }));
      }
    } catch (err) {
      console.error("[cron/subscription-renewals] conciliación:", err);
    }
  }

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
      // "Todavía no se avisó de ESTE vencimiento": el aviso de este ciclo solo puede haber
      // salido dentro de la ventana (vencimiento − 3 días). Antes comparaba contra el
      // vencimiento a secas, que siempre es posterior al aviso: salía un correo cada día.
      or(
        isNull(schema.profile.renewalReminderSentAt),
        lt(schema.profile.renewalReminderSentAt, sql`${schema.profile.subscriptionExpiresAt} - make_interval(days => ${REMINDER_WINDOW_DAYS}::int)`),
      ),
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
    // La condición se repite en el UPDATE: entre la lista de arriba y este punto se mandan
    // correos, y en ese rato puede entrar el aviso de Bold de una renovación. Sin esto la
    // bajada pisaba el plan recién pagado y además le avisaba "bajamos tu plan".
    const changed = await db.update(schema.profile)
      .set({ subscriptionTier: "free", subscriptionExpiresAt: null, renewalReminderSentAt: null, updatedAt: now })
      .where(and(
        eq(schema.profile.userId, row.userId),
        ne(schema.profile.subscriptionTier, "free"),
        lt(schema.profile.subscriptionExpiresAt, graceCutoff),
      ))
      .returning({ userId: schema.profile.userId });
    if (changed.length === 0) continue;
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

  res.status(200).json({ ok: true, reconciled, reconcileSkipped, remindersSent, downgraded, checkedReminders: dueForReminder.length, checkedDowngrades: dueForDowngrade.length });
}
