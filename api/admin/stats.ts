// Estadísticas para la pestaña Analytics del panel admin — reemplaza las
// consultas directas a Supabase (transactions/profiles) de useAdminAnalytics.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq, gte, count } from "drizzle-orm";
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

  const [spendTxs, recentUsersRow] = await Promise.all([
    db.select().from(schema.transaction).where(and(eq(schema.transaction.type, "spend"), gte(schema.transaction.createdAt, thirtyDaysAgo))),
    db.select({ total: count() }).from(schema.profile).where(gte(schema.profile.createdAt, sevenDaysAgo)),
  ]);

  let totalSpend = 0;
  let image = 0, video = 0, text = 0, canvas = 0, studio = 0;
  const dayMap: Record<string, { name: string; credits: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dayMap[d.toDateString()] = { name: DAY_LABELS[d.getDay()], credits: 0 };
  }

  for (const tx of spendTxs) {
    const abs = Math.abs(tx.amount);
    totalSpend += abs;
    const desc = (tx.description || "").toLowerCase();
    if (desc.includes("image") || desc.includes("imagen") || desc.includes("logo")) image++;
    else if (desc.includes("video")) video++;
    else if (desc.includes("studio") || desc.includes("code") || desc.includes("builderai")) studio++;
    else if (desc.includes("canvas") || desc.includes("formarketing")) canvas++;
    else text++;
    const key = new Date(tx.createdAt).toDateString();
    if (dayMap[key]) dayMap[key].credits += abs;
  }

  res.status(200).json({
    ok: true,
    totalSpend,
    recentUsers: recentUsersRow[0]?.total ?? 0,
    toolUsage: [
      { name: "Imagen IA", count: image, color: "#A855F7" },
      { name: "Texto / Copy", count: text, color: "#60A5FA" },
      { name: "Video", count: video, color: "#F59E0B" },
      { name: "BuilderAI", count: studio, color: "#A855F7" },
      { name: "Canvas", count: canvas, color: "#EC4899" },
    ],
    dailyCredits: Object.values(dayMap),
  });
}
