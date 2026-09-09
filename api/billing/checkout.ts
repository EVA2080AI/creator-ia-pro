// Genera un link de pago Bold.co — puerto de supabase/functions/bold-checkout,
// que dejó de funcionar en producción tras la migración a better-auth: dependía
// de `supabase.auth.getUser()` en el cliente, que ya no tiene sesión (ver
// src/services/billing-service.ts). Ahora el usuario y el email salen de la
// sesión de better-auth en el servidor — nunca del body del request.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, schema } from "../../db/index.js";
import { getSessionUser } from "../_lib/session.js";

interface CheckoutBody {
  packId?: string;
}

// Precios verificados en servidor — el cliente solo manda el id del pack.
const PRICE_MAP: Record<string, number> = {
  // Planes mensuales
  creador: 149900,
  pro: 349900,
  agencia: 699900,
  pyme: 1499900,
  // Recargas puntuales
  pack_200: 25000,
  pack_1000: 90000,
  pack_2000: 150000,
};

const APP_URL = process.env.APP_URL || "https://creator-ia.com";

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

  const { packId } = req.body as CheckoutBody;
  const amount = packId ? PRICE_MAP[packId] : undefined;
  if (!packId || !amount) {
    res.status(400).json({ ok: false, code: "BAD_REQUEST", error: `Identificador de pack inválido: ${packId}` });
    return;
  }

  const BOLD_API_KEY = process.env.BOLD_API_KEY;
  if (!BOLD_API_KEY) {
    res.status(200).json({ ok: false, code: "NOT_CONFIGURED", error: "Pasarela de pagos no configurada. Contacta soporte." });
    return;
  }

  try {
    const payload = {
      amount_type: "CLOSE",
      amount: { currency: "COP", total_amount: amount },
      description: `Creator IA Pro: ${packId}`,
      payer_email: user.email,
      callback_url: `${APP_URL}/pricing?status=payment_returned&pack=${packId}`,
    };

    const boldRes = await fetch("https://integrations.api.bold.co/online/link/v1", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `x-api-key ${BOLD_API_KEY}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    const rawText = await boldRes.text();
    let data: { payload?: { payment_link?: string; url?: string }; message?: string; errors?: Array<{ detail?: string }> };
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(`Bold respondió algo inesperado (status ${boldRes.status}).`);
    }

    if (!boldRes.ok) {
      throw new Error(data?.errors?.[0]?.detail || data?.message || `Bold API error (${boldRes.status})`);
    }

    const linkId = data.payload?.payment_link;
    const url = data.payload?.url;
    if (!url || !linkId) throw new Error("Bold no devolvió un link de pago.");

    // Transacción pendiente — el webhook la busca por linkId para saber a quién
    // acreditar cuando Bold confirme el pago.
    const db = getDb();
    await db.insert(schema.transaction).values({
      id: crypto.randomUUID(),
      userId: user.userId,
      type: "bold_pending",
      amount: 0,
      description: `${packId}|${linkId}`,
    });

    res.status(200).json({ ok: true, url, linkId });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    const message = isTimeout ? "Bold tardó demasiado en responder. Intenta de nuevo." : err instanceof Error ? err.message : "Error al conectar con Bold.";
    res.status(502).json({ ok: false, code: isTimeout ? "TIMEOUT" : "PROVIDER_ERROR", error: message });
  }
}
