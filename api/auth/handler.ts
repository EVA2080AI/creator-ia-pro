// Monta el router completo de better-auth (sign-up, sign-in, OAuth, sesión,
// organizaciones...) bajo /api/auth/*. Ver api/_lib/auth.ts para la config.
import { toNodeHandler } from "better-auth/node";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { auth } from "../_lib/auth.js";

export const config = { api: { bodyParser: false } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return toNodeHandler(auth)(req, res);
}
