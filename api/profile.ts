// Perfil del usuario autenticado (créditos, plan). Reemplaza el acceso
// directo a `supabase.from("profiles")` — ver src/hooks/useProfile.tsx.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../db/index.js";
import { getSessionUser, getProfile } from "./_lib/session.js";

const PATCH_SCHEMA = z.object({
  displayName: z.string().trim().min(1, "El nombre no puede estar vacío.").max(120, "El nombre es demasiado largo (máx. 120 caracteres).").optional(),
  avatarUrl: z.string().trim().url("La URL del avatar no es válida.").max(2000).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ ok: false, code: "UNAUTHORIZED", error: "Debes iniciar sesión." });
    return;
  }

  try {
    if (req.method === "PATCH") {
      const parsed = PATCH_SCHEMA.safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({ ok: false, code: "BAD_REQUEST", error: parsed.error.issues[0]?.message ?? "Datos inválidos." });
        return;
      }
      if (Object.keys(parsed.data).length === 0) {
        res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "No enviaste ningún campo para actualizar." });
        return;
      }
      const db = getDb();
      const [updated] = await db
        .update(schema.profile)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(schema.profile.userId, user.userId))
        .returning();
      if (!updated) {
        res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Perfil no encontrado." });
        return;
      }
      res.status(200).json({
        ok: true,
        profile: {
          userId: updated.userId,
          displayName: updated.displayName,
          avatarUrl: updated.avatarUrl,
          email: user.email,
          creditsBalance: updated.creditsBalance,
          subscriptionTier: updated.subscriptionTier,
          subscriptionExpiresAt: updated.subscriptionExpiresAt,
          isAdmin: updated.isAdmin,
          createdAt: updated.createdAt,
        },
      });
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
        subscriptionExpiresAt: profile.subscriptionExpiresAt,
        isAdmin: profile.isAdmin,
        createdAt: profile.createdAt,
      },
    });
  } catch (err) {
    console.error("[api/profile]", err);
    res.status(500).json({ ok: false, code: "INTERNAL_ERROR", error: "Error al procesar la solicitud. Intenta de nuevo." });
  }
}