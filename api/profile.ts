// Perfil del usuario autenticado (créditos, plan). Reemplaza el acceso
// directo a `supabase.from("profiles")` — ver src/hooks/useProfile.tsx.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSessionUser, getProfile } from "./_lib/session.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ ok: false, code: "UNAUTHORIZED", error: "Debes iniciar sesión." });
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
    return;
  }

  const profile = await getProfile(user.userId);
  if (!profile) {
    res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Perfil no encontrado." });
    return;
  }

  res.status(200).json({
    ok: true,
    profile: {
      userId: profile.userId,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      email: user.email,
      creditsBalance: profile.creditsBalance,
      subscriptionTier: profile.subscriptionTier,
      isAdmin: profile.isAdmin,
      createdAt: profile.createdAt,
    },
  });
}
