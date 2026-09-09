// Estadísticas para la pestaña Analytics del panel admin — reemplaza las
// consultas directas a Supabase (transactions/profiles) de useAdminAnalytics.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq, ne, gte, count } from "drizzle-orm";
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
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const [spendTxs, recentUsersRow, totalUsersRow, payingUsersRow] = await Promise.all([
    db.select().from(schema.transaction).where(and(eq(schema.transaction.type, "spend"), gte(schema.transaction.createdAt, thirtyDaysAgo))),
    db.select({ total: count() }).from(schema.profile).where(gte(schema.profile.createdAt, sevenDaysAgo)),
    db.select({ total: count() }).from(schema.profile),
    db.select({ total: count() }).from(schema.profile).where(ne(schema.profile.subscriptionTier, "free")),
  ]);

  let totalSpend = 0;
  // Las descripciones reales de gasto son "chat: <modelo>", "image: <modelo>"
  // o "sharescreen|p2p" (ver api/_lib/credits.ts logSpend) — no distinguen
  // desde qué superficie (Genesis IA, Canvas IA o Aplicaciones) se originó
  // el gasto, así que se agrupa por tipo de operación, no por producto.
  let image = 0, chat = 0, sharescreen = 0;
  const dayMap: Record<string, { name: string; credits: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dayMap[d.toDateString()] = { name: DAY_LABELS[d.getDay()], credits: 0 };
  }

  for (const tx of spendTxs) {
    const abs = Math.abs(tx.amount);
    totalSpend += abs;
    const desc = (tx.description || "").toLowerCase();
    if (desc.startsWith("image")) image++;
    else if (desc.startsWith("sharescreen")) sharescreen++;
    else chat++;
    const key = new Date(tx.createdAt).toDateString();
    if (dayMap[key]) dayMap[key].credits += abs;
  }

  const totalUsers = totalUsersRow[0]?.total ?? 0;
  const payingUsers = payingUsersRow[0]?.total ?? 0;

  res.status(200).json({
    ok: true,
    totalSpend,
    recentUsers: recentUsersRow[0]?.total ?? 0,
    totalUsers,
    payingUsers,
    conversionRate: totalUsers > 0 ? Math.round((payingUsers / totalUsers) * 1000) / 10 : 0,
    toolUsage: [
      { name: "Imagen", count: image, color: "#A855F7" },
      { name: "Chat / Texto", count: chat, color: "#60A5FA" },
      { name: "Videollamada", count: sharescreen, color: "#F59E0B" },
    ],
    dailyCredits: Object.values(dayMap),
  });
}
