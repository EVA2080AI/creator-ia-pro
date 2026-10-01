// Aplica SOLO la migración 0007 (columna `pinned` del historial). Aditiva e idempotente:
// no toca datos ni otras tablas, y se puede revertir con DROP COLUMN.
//   node --env-file=.env.local scripts/apply-0007-pinned.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
await sql`ALTER TABLE "basalt_conversation" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL`;
const [{ count }] = await sql`SELECT count(*)::int AS count FROM information_schema.columns WHERE table_name = 'basalt_conversation' AND column_name = 'pinned'`;
console.log(count === 1 ? "columna pinned lista" : "la columna NO quedó creada");
