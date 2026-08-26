// Instancia de better-auth compartida por el endpoint /api/auth/[...all]
// y por cualquier función de servidor que necesite validar sesión.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { Resend } from "resend";
import { getDb, schema } from "../../db/index.js";

const FREE_CREDITS = 5;
// Dueño(s) de la plataforma — se promueven a admin automáticamente al crear su
// perfil, igual que el allowlist ya usado como respaldo en src/pages/Admin.tsx.
const ADMIN_EMAILS = ["sebastian689@gmail.com"];
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// En producción usa el dominio estable; en previews, la URL única de ese
// deploy (VERCEL_URL) — así cada preview de Vercel tiene su propio callback
// de OAuth y no hace falta fijar APP_URL a mano por entorno.
const APP_URL =
  process.env.APP_URL ||
  (process.env.VERCEL_ENV === "production"
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || "creator-ia.com"}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:5173");

const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  socialProviders.apple = {
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  baseURL: APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    APP_URL,
    "http://localhost:5173",
    "http://localhost:3000",
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],
  database: drizzleAdapter(getDb(), { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    // La verificación por correo se activa en cuanto RESEND_API_KEY esté configurada.
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      if (!resend) {
        console.warn(`[auth] RESEND_API_KEY no configurada — enlace de recuperación para ${user.email}: ${url}`);
        return;
      }
      await resend.emails.send({
        from: process.env.RESEND_FROM || "Creator IA Pro <onboarding@resend.dev>",
        to: user.email,
        subject: "Recupera tu contraseña — Creator IA Pro",
        html: `<p>Hola ${user.name || ""},</p><p>Pulsa el enlace para elegir una nueva contraseña (expira en 1 hora):</p><p><a href="${url}">${url}</a></p>`,
      });
    },
  },
  socialProviders,
  plugins: [organization()],
  user: {
    additionalFields: {},
  },
  databaseHooks: {
    user: {
      create: {
        // Reemplaza al trigger `handle_new_user` de Supabase (reescrito 5 veces
        // por fallos — ver docs/INVENTARIO_FUNCIONALIDADES.md §X-11). Crear el
        // perfil aquí, en la misma capa que crea el usuario, evita esa clase de bug.
        after: async (createdUser) => {
          const db = getDb();
          await db.insert(schema.profile).values({
            userId: createdUser.id,
            displayName: createdUser.name,
            avatarUrl: createdUser.image ?? null,
            creditsBalance: FREE_CREDITS,
            subscriptionTier: "free",
            isAdmin: ADMIN_EMAILS.includes(createdUser.email.toLowerCase()),
          }).onConflictDoNothing();
        },
      },
    },
  },
});

export type Auth = typeof auth;
