// Cobra 1 crédito por sesión P2P de ShareScreen — reemplaza la RPC `spend_credits`
// de Supabase (ver src/pages/ShareScreen.tsx). Cobro atómico igual que
// /api/ai/chat y /api/ai/image, vía api/_lib/credits.ts.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSessionUser } from "./_lib/session.js";
import { spendCredits, logSpend } from "./_lib/credits.js";

const COST = 1;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
    return;
  }

  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ ok: false, code: "UNAUTHORIZED", error: "Debes iniciar sesión." });
    return;
  }

  const newBalance = await spendCredits(user.userId, COST);
  if (newBalance === null) {
    // COST es 1, así que si spendCredits devolvió null el saldo actual es 0.
    res.status(402).json({ ok: false, code: "INSUFFICIENT_CREDITS", error: "No tienes créditos. Recarga en Planes para poder ser Host.", required: COST, balance: 0 });
    return;
  }

  await logSpend(user.userId, COST, "sharescreen|p2p");
  res.status(200).json({ ok: true, creditsBalance: newBalance });
}
