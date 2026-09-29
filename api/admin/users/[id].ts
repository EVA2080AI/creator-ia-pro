// Cambiar plan/permisos, suspender/activar, o borrar un usuario — reemplaza
// las RPCs admin_update_tier / admin_set_user_status de Supabase.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../../db/index.js";
import { requireAdmin } from "../../_lib/require-admin.js";

const VALID_TIERS = new Set(["free", "creador", "pro", "agencia", "pyme"]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const targetUserId = req.query.id as string;

  if (req.method === "DELETE") {
    if (targetUserId === admin.userId) {
      res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "No puedes borrar tu propia cuenta." });
      return;
    }
    const db = getDb();
    // `user` es la raíz de las FK con onDelete: cascade (profile, session,
    // account, ticket, task, project, …) — borrarlo se lleva todo lo demás.
    const [deleted] = await db.delete(schema.user).where(eq(schema.user.id, targetUserId)).returning({ id: schema.user.id });
    if (!deleted) return void res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Usuario no encontrado." });
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH, DELETE");
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
    return;
  }
  const body = (req.body ?? {}) as { subscriptionTier?: string; isActive?: boolean; isAdmin?: boolean };
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
  if (typeof body.isAdmin === "boolean") {
    if (targetUserId === admin.userId && !body.isAdmin) {
      res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "No puedes remover tu propio rol de Admin." });
      return;
    }
    patch.isAdmin = body.isAdmin;
  }

  const db = getDb();
  const [updated] = await db.update(schema.profile).set(patch).where(eq(schema.profile.userId, targetUserId)).returning();
  if (!updated) return void res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Usuario no encontrado." });
  res.status(200).json({ ok: true, profile: updated });
}
