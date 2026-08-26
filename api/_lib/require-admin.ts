// Atajo común: exige sesión + profile.isAdmin, responde 401/403 uniforme si no.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSessionUser, getProfile } from "./session.js";

export async function requireAdmin(req: VercelRequest, res: VercelResponse) {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ ok: false, code: "UNAUTHORIZED", error: "Debes iniciar sesión." });
    return null;
  }
  const profile = await getProfile(user.userId);
  if (!profile?.isAdmin) {
    res.status(403).json({ ok: false, code: "FORBIDDEN", error: "No tienes permisos de administrador." });
    return null;
  }
  return user;
}
