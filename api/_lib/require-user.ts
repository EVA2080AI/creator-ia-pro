// Atajo común: exige sesión y responde 401 uniforme si no hay.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSessionUser } from "./session.js";

export async function requireUser(req: VercelRequest, res: VercelResponse) {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ ok: false, code: "UNAUTHORIZED", error: "Debes iniciar sesión." });
    return null;
  }
  return user;
}
