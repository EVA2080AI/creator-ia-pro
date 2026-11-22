// Acreditar una compra de Bold — el único lugar donde un pago se convierte en créditos.
// Llegan acá tres caminos y los tres pueden coincidir sobre la misma compra:
//   1. el aviso de Bold (api/billing/webhook.ts), que puede repetirse y tardar hasta 10 min;
//   2. el comprador que vuelve de pagar (api/billing/confirm.ts);
//   3. la conciliación diaria (api/cron/subscription-renewals.ts).
// Por eso acreditar es UNA sola sentencia SQL: marca la fila como aprobada solo si seguía
// pendiente y, en la misma sentencia, suma los créditos. Dos llamadas a la vez no pueden
// sumar dos veces, y no puede quedar "aprobada" sin créditos (el driver HTTP de Neon no
// tiene transacciones interactivas; ver api/_lib/credits.ts).
//
// Todo va en SQL crudo sobre `execute` para que la prueba (src/test/billing.test.ts) corra
// EXACTAMENTE estas sentencias contra un Postgres de verdad (PGlite), no contra un doble.
import { sql, type SQL } from "drizzle-orm";
import { billingProduct } from "../../src/lib/limits.js";
import { decodePurchase, isLinkId, TEST_MARK, type PurchaseRef } from "../../src/lib/bold.js";

/** Lo mínimo que se usa de la base: lo cumplen drizzle/neon-http y drizzle/pglite. */
export interface Exec {
  execute(query: SQL): PromiseLike<{ rows: unknown[] }>;
}

export interface Purchase extends PurchaseRef {
  id: string;
  userId: string;
  approved: boolean;
}

interface Row { id: string; user_id: string; type: string; description: string | null; is_admin?: boolean | null }

function toPurchase(r: Row): Purchase | null {
  const ref = decodePurchase(r.description);
  return ref ? { id: r.id, userId: r.user_id, approved: r.type === "bold_approved", ...ref } : null;
}

/**
 * La compra de un link. Coincidencia EXACTA sobre el segundo campo de la descripción:
 * antes era `LIKE '%<referencia>%'` con la referencia que traía el aviso, y una referencia
 * "|" o "pack_" coincidía con la compra pendiente de cualquier usuario.
 */
export async function findPurchaseByLink(db: Exec, linkId: unknown): Promise<Purchase | null> {
  if (!isLinkId(linkId)) return null;
  const { rows } = await db.execute(sql`
    SELECT id, user_id, type::text AS type, description
      FROM "transaction"
     WHERE type IN ('bold_pending', 'bold_approved')
       AND split_part(description, '|', 2) = ${linkId}
     ORDER BY created_at DESC
     LIMIT 1`);
  return rows[0] ? toPurchase(rows[0] as Row) : null;
}

/**
 * Cuánto tiempo se sigue preguntando por una compra pendiente. Un link de Bold no vence
 * (no se envía `expiration_date`, ver api/_lib/bold.ts), así que alguien puede pagarlo días
 * después: si las redes de seguridad miraran solo unos días, ese pago dependería de que el
 * aviso de Bold llegue.
 */
export const PENDING_WINDOW_DAYS = 30;

/**
 * Las compras PENDIENTES más recientes de un usuario. Son varias a propósito: dos clics en
 * "comprar" dejan dos links y el comprador puede pagar el primero.
 */
export async function userPendings(db: Exec, userId: string, packId?: string, limit = 4): Promise<Purchase[]> {
  const onlyPack = packId ? sql`AND split_part(description, '|', 1) = ${packId}` : sql``;
  const { rows } = await db.execute(sql`
    SELECT id, user_id, type::text AS type, description
      FROM "transaction"
     WHERE user_id = ${userId}
       AND type = 'bold_pending'
       AND created_at > now() - make_interval(days => ${PENDING_WINDOW_DAYS}::int)
       ${onlyPack}
     ORDER BY created_at DESC
     LIMIT ${limit}::int`);
  return (rows as Row[]).map(toPurchase).filter((p): p is Purchase => p !== null);
}

/**
 * Una compra del usuario acreditada hace un momento (al aprobar, `created_at` pasa a ser la
 * hora del pago). Es lo que ve quien vuelve de pagar cuando el aviso de Bold llegó primero.
 */
export async function justApproved(db: Exec, userId: string, packId?: string, minutes = 30): Promise<Purchase | null> {
  const onlyPack = packId ? sql`AND split_part(description, '|', 1) = ${packId}` : sql``;
  const { rows } = await db.execute(sql`
    SELECT id, user_id, type::text AS type, description
      FROM "transaction"
     WHERE user_id = ${userId}
       AND type = 'bold_approved'
       AND created_at > now() - make_interval(mins => ${minutes}::int)
       ${onlyPack}
     ORDER BY created_at DESC
     LIMIT 1`);
  return rows[0] ? toPurchase(rows[0] as Row) : null;
}

/** Links de pago que un usuario generó en la última hora (para no dejar crear cientos). */
export async function recentPendingCount(db: Exec, userId: string): Promise<number> {
  const { rows } = await db.execute(sql`
    SELECT count(*)::int AS n
      FROM "transaction"
     WHERE user_id = ${userId} AND type = 'bold_pending' AND created_at > now() - interval '1 hour'`);
  return Number((rows[0] as { n?: number } | undefined)?.n ?? 0);
}

/** Todas las compras que siguen pendientes, para preguntarle a Bold por cada una (las más nuevas primero). */
export async function pendingPurchases(db: Exec, days = PENDING_WINDOW_DAYS, limit = 400): Promise<Array<Purchase & { isAdmin: boolean }>> {
  const { rows } = await db.execute(sql`
    SELECT t.id, t.user_id, t.type::text AS type, t.description, coalesce(p.is_admin, false) AS is_admin
      FROM "transaction" t
      LEFT JOIN profile p ON p.user_id = t.user_id
     WHERE t.type = 'bold_pending'
       AND t.created_at > now() - make_interval(days => ${days}::int)
     ORDER BY t.created_at DESC
     LIMIT ${limit}::int`);
  const out: Array<Purchase & { isAdmin: boolean }> = [];
  for (const r of rows as Row[]) {
    const p = toPurchase(r);
    if (p) out.push({ ...p, isAdmin: r.is_admin === true });
  }
  return out;
}

export type Settlement =
  /** Se acreditó en esta llamada. */
  | { status: "credited"; userId: string; packId: string; credits: number; isPlan: boolean; balance: number | null }
  /** Ya estaba acreditada (otro aviso, o el comprador volvió antes). No se suma de nuevo. */
  | { status: "already"; userId: string; packId: string; credits: number; isPlan: boolean }
  /** No se pudo acreditar y hay que mirarlo: producto que ya no existe, cuenta sin perfil. */
  | { status: "invalid"; reason: string };

/**
 * `test`: la compra se pagó con llaves de prueba (solo se acredita a un admin). Queda
 * marcada en la fila para que el panel financiero no la cuente como ingreso.
 */
export async function settlePurchase(db: Exec, purchase: Purchase, o: { test?: boolean } = {}): Promise<Settlement> {
  const product = billingProduct(purchase.packId);
  if (!product) return { status: "invalid", reason: `producto desconocido: ${purchase.packId}` };
  const { credits, isPlan } = product;
  const base = { userId: purchase.userId, packId: product.id, credits, isPlan };
  if (purchase.approved) return { status: "already", ...base };

  // Un plan no se renueva solo (Bold no cobra recurrente): cada compra corre el vencimiento
  // 30 días desde el mayor entre "ahora" y el vencimiento actual, así quien renueva antes
  // no pierde los días que le quedaban. `created_at` pasa a ser la fecha del pago, que es
  // la que cuenta el panel financiero; hasta acá era la del clic en "comprar".
  const { rows } = await db.execute(sql`
    WITH claimed AS (
      UPDATE "transaction" t
         SET type = 'bold_approved', amount = ${credits}::int, created_at = now(),
             description = t.description || ${o.test ? `|${TEST_MARK}` : ""}::text
       WHERE t.id = ${purchase.id}
         AND t.type = 'bold_pending'
         AND EXISTS (SELECT 1 FROM profile p WHERE p.user_id = t.user_id)
      RETURNING t.user_id
    ), credited AS (
      UPDATE profile p
         SET credits_balance = p.credits_balance + ${credits}::int,
             subscription_tier = CASE WHEN ${isPlan}::boolean THEN ${product.id}::text ELSE p.subscription_tier END,
             subscription_expires_at = CASE WHEN ${isPlan}::boolean
               THEN greatest(p.subscription_expires_at, now()::timestamp) + interval '30 days'
               ELSE p.subscription_expires_at END,
             renewal_reminder_sent_at = CASE WHEN ${isPlan}::boolean THEN NULL ELSE p.renewal_reminder_sent_at END,
             updated_at = now()
       WHERE p.user_id IN (SELECT user_id FROM claimed)
      RETURNING p.user_id, p.credits_balance
    ), logged AS (
      INSERT INTO "transaction" (id, user_id, type, amount, description)
      SELECT ${crypto.randomUUID()}::text, c.user_id, 'subscription_change'::transaction_type, 0, ${`Plan activado: ${product.id} (Bold)`}::text
        FROM credited c
       WHERE ${isPlan}::boolean
      RETURNING id
    )
    SELECT (SELECT count(*) FROM claimed)::int AS claimed,
           (SELECT credits_balance FROM credited LIMIT 1) AS balance`);

  const r = rows[0] as { claimed?: number; balance?: number | null } | undefined;
  if (Number(r?.claimed) === 1) {
    return { status: "credited", ...base, balance: r?.balance == null ? null : Number(r.balance) };
  }

  // No se reclamó nada: o alguien la acreditó un instante antes, o la cuenta no tiene perfil.
  const again = await db.execute(sql`SELECT type::text AS type FROM "transaction" WHERE id = ${purchase.id}`);
  if ((again.rows[0] as { type?: string } | undefined)?.type === "bold_approved") return { status: "already", ...base };
  return { status: "invalid", reason: "la compra no se pudo acreditar (cuenta sin perfil o fila borrada)" };
}
