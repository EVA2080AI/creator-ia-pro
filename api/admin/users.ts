// Lista + creación de usuarios para el panel admin.
// GET  reemplaza la RPC de Supabase admin_list_users.
// POST crea la cuenta con una contraseña aleatoria que nadie ve (ni el admin
// ni Claude): el usuario la define solo, con el mismo correo de
// "recuperar contraseña" que ya usa UsersTab para cuentas existentes.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";
import { getDb, schema } from "../../db/index.js";
import { requireAdmin } from "../_lib/require-admin.js";
import { auth } from "../_lib/auth.js";

const VALID_TIERS = new Set(["free", "creador", "pro", "agencia", "pyme"]);

const CREATE_SCHEMA = z.object({
  email: z.string().trim().toLowerCase().email("Correo inválido."),
  name: z.string().trim().min(1, "Falta el nombre.").max(120),
  subscriptionTier: z.string().refine((t) => VALID_TIERS.has(t), "Plan inválido.").default("free"),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const db = getDb();

  if (req.method === "GET") {
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
    return;
  }

  if (req.method === "POST") {
    const parsed = CREATE_SCHEMA.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ ok: false, code: "BAD_REQUEST", error: parsed.error.issues[0]?.message ?? "Datos inválidos." });
      return;
    }
    const { email, name, subscriptionTier } = parsed.data;

    let created;
    try {
      // Contraseña temporal aleatoria — descartada de inmediato, nunca se
      // muestra ni se guarda: abajo se dispara el correo de "elige tu
      // contraseña" para que el usuario la reemplace en su primer ingreso.
      const throwaway = randomBytes(24).toString("base64url");
      created = await auth.api.signUpEmail({ body: { email, password: throwaway, name } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo crear el usuario.";
      res.status(400).json({ ok: false, code: "SIGNUP_FAILED", error: msg });
      return;
    }

    const userId = created.user.id;
    if (subscriptionTier !== "free") {
      await db.update(schema.profile).set({ subscriptionTier, updatedAt: new Date() }).where(eq(schema.profile.userId, userId));
    }

    let emailSent = true;
    try {
      await auth.api.requestPasswordReset({ body: { email, redirectTo: "/reset-password" } });
    } catch (e) {
      emailSent = false;
      console.error("[admin/users] No se pudo enviar el correo de bienvenida:", e);
    }

    res.status(201).json({ ok: true, userId, emailSent });
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido." });
}
