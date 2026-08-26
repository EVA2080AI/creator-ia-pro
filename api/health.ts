import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../db/index.js";
import { sql } from "drizzle-orm";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const db = getDb();
    await db.execute(sql`select 1`);
    res.status(200).json({ ok: true, db: "up", time: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
