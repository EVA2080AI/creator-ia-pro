// Cobro/reembolso de créditos — una sola sentencia SQL atómica (evita la
// necesidad de transacciones multi-round-trip, que el driver HTTP de Neon no
// soporta de forma interactiva). Mismo comportamiento que la RPC `spend_credits`
// de Supabase, pero sin depender de una sesión de Postgres persistente.
import { sql } from "drizzle-orm";
import { getDb } from "../../db/index.js";

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

export async function getBalance(userId: string): Promise<number | null> {
  const db = getDb();
  const rows = await db.execute<{ credits_balance: number }>(sql`
    SELECT credits_balance FROM profile WHERE user_id = ${userId}
  `);
  return rows.rows[0]?.credits_balance ?? null;
}
