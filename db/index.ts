// Conexión perezosa a Neon — evita que `neon()` reviente el build si
// DATABASE_URL todavía no está disponible en tiempo de compilación.
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema/index.js";

let _db: ReturnType<typeof createDb> | null = null;

function createDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema });
}

export function getDb() {
  if (!_db) _db = createDb();
  return _db;
}

export type Db = ReturnType<typeof getDb>;
export * as schema from "./schema/index.js";
