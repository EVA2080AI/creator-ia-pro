// Genera un link de pago de Bold. El usuario y el correo salen de la sesión de better-auth
// y el precio del catálogo del servidor (src/lib/limits.ts → billingProduct): del navegador
// solo llega el id de lo que se quiere comprar.
//
// La compra queda como una fila `bold_pending`; quién la convierte en créditos y cómo está
// en api/_lib/billing.ts.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, schema } from "../../db/index.js";
import { getSessionUser } from "../_lib/session.js";
import { BoldError, createPaymentLink } from "../_lib/bold.js";
import { recentPendingCount } from "../_lib/billing.js";
import { billingProduct } from "../../src/lib/limits.js";
import { encodePurchase, purchaseDescription } from "../../src/lib/bold.js";

const APP_URL = process.env.APP_URL || "https://creator-ia.com";

/** Links por usuario y por hora. Nadie necesita más para comprar, y cada uno es una llamada a Bold y una fila. */
const MAX_LINKS_PER_HOUR = 8;

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

  const product = billingProduct((req.body as { packId?: unknown } | undefined)?.packId);
  if (!product) {
    res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "Ese plan o recarga no está disponible." });
    return;
  }

  const apiKey = process.env.BOLD_API_KEY;
  if (!apiKey) {
    res.status(200).json({ ok: false, code: "NOT_CONFIGURED", error: "Los pagos todavía no están habilitados. Escríbenos y lo resolvemos." });
    return;
  }

  try {
    const db = getDb();
    if ((await recentPendingCount(db, user.userId)) >= MAX_LINKS_PER_HOUR) {
      res.status(429).json({ ok: false, code: "TOO_MANY", error: "Ya abriste varios pagos en la última hora. Termina uno de ellos o espera un momento." });
      return;
    }

    const { linkId, url } = await createPaymentLink(apiKey, {
      amountCop: product.priceCop,
      description: purchaseDescription(product),
      callbackUrl: `${APP_URL}/pricing?status=payment_returned&pack=${encodeURIComponent(product.id)}`,
    });

    // Si esto falla el link no llega a nadie (no se devuelve, y Bold no lo envía por correo
    // porque no se manda payer_email): un pago sin fila pendiente no tendría a quién acreditarse.
    await db.insert(schema.transaction).values({
      id: crypto.randomUUID(),
      userId: user.userId,
      type: "bold_pending",
      amount: 0,
      description: encodePurchase(product.id, linkId, product.priceCop),
    });

    res.status(200).json({ ok: true, url });
  } catch (err) {
    // El detalle de Bold (o de la base) sirve para depurar, no para el usuario.
    console.error("[billing/checkout] fallo:", err);
    const timeout = err instanceof BoldError && err.timeout;
    res.status(502).json({
      ok: false,
      code: timeout ? "TIMEOUT" : "PROVIDER_ERROR",
      error: timeout
        ? "Bold tardó demasiado en responder. Intenta de nuevo."
        : "No se pudo iniciar el pago. Intenta de nuevo en unos minutos.",
    });
  }
}
