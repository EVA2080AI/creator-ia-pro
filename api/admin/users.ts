// Lista de usuarios para el panel admin — reemplaza la RPC de Supabase admin_list_users.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, desc } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { requireAdmin } from "../_lib/require-admin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
    return;
  }
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const db = getDb();
  const rows = await db
    .select({
      user_id: schema.profile.userId,
      email: schema.user.email,
      display_name: schema.profile.displayName,
      credits_balance: schema.profile.creditsBalance,
      created_at: schema.profile.createdAt,
      subscription_tier: schema.profile.subscriptionTier,
      is_active: schema.profile.isActive,
      is_admin: schema.profile.isAdmin,
    })
    .from(schema.profile)
    .innerJoin(schema.user, eq(schema.user.id, schema.profile.userId))
    .orderBy(desc(schema.profile.createdAt));

  res.status(200).json({ ok: true, users: rows });
}
