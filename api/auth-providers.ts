// Qué formas de entrar están configuradas de verdad en este despliegue.
//
// La pantalla de entrada mostraba siempre los tres botones (Google, Apple, GitHub),
// pero `api/_lib/auth.ts` solo registra el proveedor si existen sus credenciales:
// sin ellas, better-auth responde "Provider not found" y el usuario recibe un error
// justo en el momento de registrarse. Medido en producción el 2026-10-01: los tres
// fallaban. Ahora el formulario pregunta y solo pinta lo que funciona.
import type { VercelRequest, VercelResponse } from "@vercel/node";

const PROVIDERS = [
  { id: "google", env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] },
  { id: "apple", env: ["APPLE_CLIENT_ID", "APPLE_CLIENT_SECRET"] },
  { id: "github", env: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"] },
] as const;

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido." });
    return;
  }
  // Solo los nombres, nunca las credenciales. Es información pública: equivale a
  // mirar qué botones tiene el formulario.
  const providers = PROVIDERS.filter((p) => p.env.every((key) => !!process.env[key])).map((p) => p.id);
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).json({ ok: true, providers });
}
