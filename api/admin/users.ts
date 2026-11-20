// Lista + creación de usuarios para el panel admin.
// GET  reemplaza la RPC de Supabase admin_list_users.
// POST crea la cuenta con una contraseña aleatoria que nadie ve (ni el admin
// ni Claude): el usuario la define solo, con el mismo correo de
// "recuperar contraseña" que ya usa UsersTab para cuentas existentes.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";
import { getDb, schema } from "../../db/index.js";
import { requireAdmin } from "../_lib/require-admin.js";
import { auth } from "../_lib/auth.js";

const VALID_TIERS = new Set(["free", "creador", "pro", "agencia", "pyme"]);

// `type` y no `interface`: db.execute<T> exige un Record<string, unknown>, y solo un alias
// de tipo trae la firma de índice implícita.
type ActivityRow = {
  user_id: string;
  last_active_at: string | null;
  messages: number;
  chats: number;
  images: number;
};

/**
 * Qué tanto usa la app cada cuenta — para responder "¿quién lo usa?" en Admin → Usuarios.
 *
 * "Última actividad" es lo más reciente entre: una sesión (entrar o seguir conectado), un
 * chat de Basalt, un mensaje a un Experto, una imagen guardada o un gasto de créditos. Los
 * mensajes son los que escribió la PERSONA (no las respuestas); en Basalt salen del JSON de
 * cada conversación, que se guarda con tope de 50 por usuario y se puede borrar, así que
 * la cuenta es un piso.
 *
 * Las columnas son `timestamp` sin zona y guardan UTC: se devuelven como ISO con "Z". Sin
 * eso el navegador las leía como hora local y a un admin en Colombia le salía actividad
 * "en el futuro".
 *
 * Una consulta agregada para todos los usuarios, no una por fila. Recorre el JSON de todas
 * las conversaciones: sobra para cientos de cuentas; con decenas de miles habría que
 * guardar un contador en `profile`.
 */
async function loadActivity(db: ReturnType<typeof getDb>): Promise<Map<string, ActivityRow>> {
  const res = await db.execute<ActivityRow>(sql`
    SELECT p.user_id,
           to_char(GREATEST(bc.last, ex.last, sa.last, tx.last, se.last), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS last_active_at,
           (COALESCE(bc.msgs, 0) + COALESCE(ex.msgs, 0))::int AS messages,
           (COALESCE(bc.n, 0) + COALESCE(ex.n, 0))::int AS chats,
           COALESCE(sa.n, 0)::int AS images
      FROM "profile" p
      LEFT JOIN (
        SELECT user_id, count(*) AS n, max(updated_at) AS last,
               sum((SELECT count(*) FROM jsonb_array_elements(messages) e WHERE e->>'role' = 'user')) AS msgs
          FROM "basalt_conversation" GROUP BY user_id
      ) bc ON bc.user_id = p.user_id
      LEFT JOIN (
        SELECT c.user_id, count(DISTINCT c.id) AS n, max(m.created_at) AS last,
               count(m.id) FILTER (WHERE m.role = 'user') AS msgs
          FROM "conversation" c LEFT JOIN "message" m ON m.conversation_id = c.id GROUP BY c.user_id
      ) ex ON ex.user_id = p.user_id
      LEFT JOIN (
        SELECT user_id, count(*) FILTER (WHERE type = 'image') AS n, max(created_at) AS last
          FROM "saved_asset" GROUP BY user_id
      ) sa ON sa.user_id = p.user_id
      LEFT JOIN (
        SELECT user_id, max(created_at) AS last FROM "transaction" WHERE type = 'spend' GROUP BY user_id
      ) tx ON tx.user_id = p.user_id
      LEFT JOIN (
        SELECT user_id, max(updated_at) AS last FROM "session" GROUP BY user_id
      ) se ON se.user_id = p.user_id
  `);
  return new Map(res.rows.map((r) => [r.user_id, r]));
}

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

    // La actividad es un extra: si esa consulta falla (una tabla que todavía no existe en
    // este entorno, un timeout), la lista de usuarios tiene que seguir cargando.
    let activity: Map<string, ActivityRow> | null = null;
    try {
      activity = await loadActivity(db);
    } catch (e) {
      console.error("[admin/users] No se pudo calcular la actividad:", e);
    }

    const users = activity
      ? rows.map((r) => {
          const a = activity.get(r.user_id);
          return { ...r, last_active_at: a?.last_active_at ?? null, messages: a?.messages ?? 0, chats: a?.chats ?? 0, images: a?.images ?? 0 };
        })
      : rows;

    res.status(200).json({ ok: true, users });
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
