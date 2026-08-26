// Cambiar plan o suspender/activar un usuario — reemplaza las RPCs
// admin_update_tier / admin_set_user_status de Supabase.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../../db/index.js";
import { requireAdmin } from "../../_lib/require-admin.js";

const VALID_TIERS = new Set(["free", "creador", "pro", "agencia", "pyme"]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PATCH") {
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
    return;
  }
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const targetUserId = req.query.id as string;
  const body = (req.body ?? {}) as { subscriptionTier?: string; isActive?: boolean };
  const patch: Record<string, unknown> = { updatedAt: new Date() };

  if (body.subscriptionTier !== undefined) {
    if (!VALID_TIERS.has(body.subscriptionTier)) {
      res.status(400).json({ ok: false, code: "BAD_REQUEST", error: `Plan inválido: ${body.subscriptionTier}` });
      return;
    }
    patch.subscriptionTier = body.subscriptionTier;
  }
  if (typeof body.isActive === "boolean") {
    if (targetUserId === admin.userId && !body.isActive) {
      res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "No puedes suspender tu propia cuenta." });
      return;
    }
    patch.isActive = body.isActive;
  }

  const db = getDb();
  const [updated] = await db.update(schema.profile).set(patch).where(eq(schema.profile.userId, targetUserId)).returning();
  if (!updated) return void res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Usuario no encontrado." });
  res.status(200).json({ ok: true, profile: updated });
}
