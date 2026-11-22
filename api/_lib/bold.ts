// Las tres cosas que se le piden a Bold por red, y la firma de sus avisos.
// El formato (qué campos trae cada respuesta) está en src/lib/bold.ts, que no toca la red.
import { createHmac, timingSafeEqual } from "node:crypto";
import { isLinkId, parseLink, type BoldLink } from "../../src/lib/bold.js";

const BOLD_API = "https://integrations.api.bold.co";

/**
 * Firma de un aviso de Bold: HMAC-SHA256 del cuerpo crudo EN BASE64, con la llave secreta,
 * en hexadecimal (cabecera `x-bold-signature`). Con llaves de prueba Bold firma con una
 * llave vacía: por eso un secreto vacío nunca se acepta (ver api/billing/webhook.ts).
 */
export function verifySignature(rawBody: string, signature: string | null | undefined, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(Buffer.from(rawBody, "utf8").toString("base64")).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.trim().toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export class BoldError extends Error {
  constructor(message: string, readonly status: number, readonly timeout = false) {
    super(message);
    this.name = "BoldError";
  }
}

async function call(apiKey: string, path: string, init: { method: string; body?: string }, timeoutMs: number): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${BOLD_API}${path}`, {
      method: init.method,
      headers: { "Content-Type": "application/json", Authorization: `x-api-key ${apiKey}` },
      body: init.body,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const timeout = err instanceof Error && err.name === "TimeoutError";
    throw new BoldError(timeout ? "Bold no respondió a tiempo" : "No se pudo conectar con Bold", 0, timeout);
  }
  const text = await res.text();
  let data: { message?: string; errors?: Array<{ detail?: string } | string> } | null = null;
  try {
    data = JSON.parse(text);
  } catch {
    throw new BoldError(`Bold respondió algo inesperado (HTTP ${res.status})`, res.status);
  }
  if (!res.ok) {
    const first = data?.errors?.[0];
    const detail = typeof first === "string" ? first : first?.detail;
    throw new BoldError(detail || data?.message || `Bold respondió HTTP ${res.status}`, res.status);
  }
  return data;
}

/**
 * Crea un link de pago de monto cerrado (el comprador no puede cambiar el valor).
 *
 * NO se envía `payer_email`: con ese campo Bold le manda el link por correo a esa dirección,
 * y acá el correo de una cuenta no está verificado — cualquiera podía registrarse con el
 * correo de otra persona y hacer que Bold le enviara cobros "de Creator IA". Además dejaba
 * un link pagable en el buzón aunque el cobro fallara después de crearlo. El comprador
 * llega al link porque la app lo redirige, no por correo.
 *
 * Tampoco `reference`: sin ella Bold usa el id del link (LNK_…) como referencia del aviso.
 * Ni `expiration_date`: la documentación dice nanosegundos y sus ejemplos traen milisegundos;
 * hasta probarlo con llaves reales, un link no vence (por eso la conciliación mira 30 días).
 */
export async function createPaymentLink(
  apiKey: string,
  o: { amountCop: number; description: string; callbackUrl: string },
): Promise<{ linkId: string; url: string }> {
  const data = (await call(apiKey, "/online/link/v1", {
    method: "POST",
    body: JSON.stringify({
      amount_type: "CLOSE",
      amount: { currency: "COP", tip_amount: 0, total_amount: o.amountCop },
      description: o.description,
      callback_url: o.callbackUrl,
    }),
  }, 10_000)) as { payload?: { payment_link?: unknown; url?: unknown } };
  const linkId = data.payload?.payment_link;
  const url = data.payload?.url;
  // El id tiene que poder leerse después (decodePurchase): si Bold devolviera otro formato,
  // la compra quedaría guardada pero ningún camino sabría acreditarla. Mejor fallar acá, a la vista.
  if (!isLinkId(linkId) || typeof url !== "string" || !/^https:\/\//.test(url)) {
    throw new BoldError("Bold no devolvió un link de pago con el formato esperado", 502);
  }
  return { linkId, url };
}

/** Le pregunta a Bold en qué estado está un link. Es la única fuente que no se puede falsificar desde afuera. */
export async function getPaymentLink(apiKey: string, linkId: string, timeoutMs = 8_000): Promise<BoldLink> {
  const link = parseLink(await call(apiKey, `/online/link/v1/${encodeURIComponent(linkId)}`, { method: "GET" }, timeoutMs));
  if (!link) throw new BoldError("Bold no devolvió el estado del link", 502);
  return link;
}
