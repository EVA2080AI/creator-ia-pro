// Cobro/reembolso de créditos — una sola sentencia SQL atómica (evita la
// necesidad de transacciones multi-round-trip, que el driver HTTP de Neon no
// soporta de forma interactiva). Mismo comportamiento que la RPC `spend_credits`
// de Supabase, pero sin depender de una sesión de Postgres persistente.
import { sql } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";

/** Descuenta `amount` créditos si el saldo alcanza. Devuelve el saldo nuevo, o null si no hay saldo suficiente. */
export async function spendCredits(userId: string, amount: number): Promise<number | null> {
  if (amount <= 0) return getBalance(userId);
  const db = getDb();
  const rows = await db.execute<{ credits_balance: number }>(sql`
    UPDATE profile
    SET credits_balance = credits_balance - ${amount}, updated_at = now()
    WHERE user_id = ${userId} AND credits_balance >= ${amount}
    RETURNING credits_balance
  `);
  return rows.rows[0]?.credits_balance ?? null;
}

export async function refundCredits(userId: string, amount: number): Promise<number | null> {
  if (amount <= 0) return getBalance(userId);
  const db = getDb();
  const rows = await db.execute<{ credits_balance: number }>(sql`
    UPDATE profile
    SET credits_balance = credits_balance + ${amount}, updated_at = now()
    WHERE user_id = ${userId}
    RETURNING credits_balance
  `);
  return rows.rows[0]?.credits_balance ?? null;
}

/** Añade créditos por una compra confirmada (Bold) o un otorgamiento de admin. Misma operación que
 * refundCredits — nombre propio para que la intención sea clara en api/billing/*. */
export const addCredits = refundCredits;

/** Límite diario de mensajes gratis (modelos `eco`, 0 créditos) — sin esto, cualquier
 * usuario/plan free genera costo real ilimitado en OpenRouter con ingreso cero. */
export const FREE_DAILY_MESSAGE_LIMIT = 30;

/** Cuenta un mensaje gratis contra el límite diario. Devuelve el conteo nuevo, o null si ya se alcanzó el límite. */
export async function consumeFreeMessage(userId: string, limit = FREE_DAILY_MESSAGE_LIMIT): Promise<number | null> {
  const db = getDb();
  const rows = await db.execute<{ free_msg_count: number }>(sql`
    UPDATE profile
    SET
      free_msg_count = CASE WHEN now() - free_msg_reset_at > interval '1 day' THEN 1 ELSE free_msg_count + 1 END,
      free_msg_reset_at = CASE WHEN now() - free_msg_reset_at > interval '1 day' THEN now() ELSE free_msg_reset_at END,
      updated_at = now()
    WHERE user_id = ${userId}
      AND (now() - free_msg_reset_at > interval '1 day' OR free_msg_count < ${limit})
    RETURNING free_msg_count
  `);
  return rows.rows[0]?.free_msg_count ?? null;
}

/** Registra un gasto real de IA (chat/imagen) para auditoría y el panel de analíticas del admin. */
export async function logSpend(userId: string, amount: number, description: string): Promise<void> {
  if (amount <= 0) return;
  const db = getDb();
  await db.insert(schema.transaction).values({
    id: crypto.randomUUID(),
    userId,
    type: "spend",
    amount: -amount,
    description,
  });
}

export async function getBalance(userId: string): Promise<number | null> {
  const db = getDb();
  const rows = await db.execute<{ credits_balance: number }>(sql`
    SELECT credits_balance FROM profile WHERE user_id = ${userId}
  `);
  return rows.rows[0]?.credits_balance ?? null;
}
