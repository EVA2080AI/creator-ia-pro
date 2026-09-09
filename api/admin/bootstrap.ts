// Activa al primer admin del sistema — reemplaza la RPC `bootstrap_admin` de
// Supabase (ver src/pages/admin/components/AdminBootstrap.tsx). Solo exige
// sesión (no admin — ese es justamente el punto): si ya existe un admin, no
// hace nada; si no existe ninguno, activa al usuario que llama.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { getSessionUser } from "../_lib/session.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
    return;
  }

  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ ok: false, code: "UNAUTHORIZED", error: "Debes iniciar sesión." });
    return;
  }

  const db = getDb();
  const [existingAdmin] = await db
    .select({ userId: schema.profile.userId })
    .from(schema.profile)
    .where(eq(schema.profile.isAdmin, true))
    .limit(1);

  if (existingAdmin) {
    res.status(200).json({ ok: true, result: "admin_exists" });
    return;
  }

  await db.update(schema.profile).set({ isAdmin: true, updatedAt: new Date() }).where(eq(schema.profile.userId, user.userId));
  res.status(200).json({ ok: true, result: "ok" });
}
