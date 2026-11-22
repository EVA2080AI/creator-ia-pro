// "¿Ya entró mi pago?" — lo llama la página de planes cuando el comprador vuelve de Bold.
//
// Existe porque el aviso de Bold no alcanza por sí solo: para un link de pago puede tardar
// hasta 10 minutos, con llaves de prueba no se envía, y si el webhook no quedó registrado
// en el panel de Bold no llega nunca. Acá no se le cree a nada que venga del navegador: se
// toman las compras pendientes del usuario de la sesión y se le pregunta a Bold por ESOS
// links (varios: dos clics en "comprar" dejan dos, y puede haber pagado el primero).
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../../db/index.js";
import { getProfile, getSessionUser } from "../_lib/session.js";
import { getPaymentLink } from "../_lib/bold.js";
import { justApproved, settlePurchase, userPendings, type Purchase } from "../_lib/billing.js";
import { billingProduct } from "../../src/lib/limits.js";

// Cada consulta le cuesta a Bold hasta 4 llamadas con la llave del comercio. La página
// pregunta como mucho cada 2,5 s; más seguido que esto es alguien en un bucle. La memoria es
// por instancia (Fluid Compute las reutiliza): no es exacta, alcanza para frenar el abuso.
const MIN_GAP_MS = 1_500;
const lastAsk = new Map<string, number>();

/** Solo para las pruebas: cada una empieza sin historial de consultas. */
export function resetConfirmThrottle() {
  lastAsk.clear();
}

const summary = (p: Purchase) => {
  const product = billingProduct(p.packId);
  return { packId: p.packId, credits: product?.credits ?? 0, isPlan: product?.isPlan ?? false };
};

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

  try {
    const db = getDb();
    // `pack` solo acota cuáles de las compras del propio usuario se miran; no decide nada.
    const pack = billingProduct((req.body as { pack?: unknown } | undefined)?.pack)?.id;
    const pendings = await userPendings(db, user.userId, pack);

    if (pendings.length === 0) {
      // Nada pendiente: o el aviso de Bold ya la acreditó, o no hay compra.
      const done = await justApproved(db, user.userId, pack);
      res.status(200).json(done ? { ok: true, state: "approved", fresh: false, ...summary(done) } : { ok: true, state: "none" });
      return;
    }

    const apiKey = process.env.BOLD_API_KEY;
    if (!apiKey) {
      res.status(200).json({ ok: false, code: "NOT_CONFIGURED", error: "Los pagos todavía no están habilitados." });
      return;
    }

    const now = Date.now();
    if (now - (lastAsk.get(user.userId) ?? 0) < MIN_GAP_MS) {
      res.status(429).json({ ok: false, code: "TOO_MANY", error: "Espera un momento antes de volver a consultar." });
      return;
    }
    if (lastAsk.size > 5_000) lastAsk.clear();
    lastAsk.set(user.userId, now);

    const checks = await Promise.allSettled(pendings.map((p) => getPaymentLink(apiKey, p.linkId)));
    const links = checks.map((c, i) => ({ purchase: pendings[i], link: c.status === "fulfilled" ? c.value : null }));
    for (const c of checks) if (c.status === "rejected") console.error("[billing/confirm] Bold no respondió por un link:", c.reason);

    const paid = links.find((l) => l.link?.status === "PAID");
    if (paid?.link) {
      const { purchase, link } = paid;
      // Con llaves de PRUEBA Bold aprueba cualquier compra hecha con una tarjeta de ejemplo
      // que es pública. Eso solo acredita a un administrador (para probar el flujo completo):
      // si las llaves de prueba llegan a producción, nadie más se regala créditos. Se exige
      // que Bold diga `is_sandbox: false`; si no lo dice, tampoco se acredita por acá.
      const isAdmin = link.isSandbox === false ? false : !!(await getProfile(user.userId))?.isAdmin;
      if (link.isSandbox !== false && !isAdmin) {
        if (link.isSandbox === true) {
          console.warn(`[billing/confirm] ${purchase.linkId}: pago de prueba de una cuenta que no es admin; no se acredita.`);
          res.status(200).json({ ok: true, state: "sandbox", ...summary(purchase) });
        } else {
          // No se sabe si es real: que lo acredite el aviso firmado de Bold, no este camino.
          console.error(`[billing/confirm] ${purchase.linkId}: Bold no dijo si el pago es de prueba (is_sandbox ausente). No se acredita por este camino.`);
          res.status(200).json({ ok: true, state: "processing", ...summary(purchase) });
        }
        return;
      }

      if (purchase.amountCop != null && link.totalCop != null && link.totalCop !== purchase.amountCop) {
        console.error(`[billing/confirm] ${purchase.linkId}: Bold reporta ${link.totalCop} y se esperaban ${purchase.amountCop}.`);
      }

      const result = await settlePurchase(db, purchase, { test: link.isSandbox !== false });
      if (result.status === "invalid") {
        console.error(`[billing/confirm] ${purchase.linkId}: pago aprobado SIN acreditar — ${result.reason}`);
        res.status(500).json({ ok: false, code: "INTERNAL_ERROR", error: "Tu pago está aprobado pero no pudimos sumar los créditos. Escríbenos y lo resolvemos." });
        return;
      }
      res.status(200).json({ ok: true, state: "approved", fresh: result.status === "credited", ...summary(purchase) });
      return;
    }

    const processing = links.find((l) => l.link?.status === "PROCESSING");
    if (processing) {
      res.status(200).json({ ok: true, state: "processing", ...summary(processing.purchase) });
      return;
    }

    // Ninguna pendiente está pagada. Puede que la que acaba de pagar ya la haya acreditado el
    // aviso de Bold y lo que quede pendiente sean intentos viejos.
    const done = await justApproved(db, user.userId, pack);
    if (done) {
      res.status(200).json({ ok: true, state: "approved", fresh: false, ...summary(done) });
      return;
    }

    // Si Bold no contestó por ninguna, no se sabe: no se le dice "sin pago" a quien quizá pagó.
    if (links.every((l) => l.link === null)) {
      res.status(502).json({ ok: false, code: "PROVIDER_ERROR", error: "No pudimos consultar el pago en este momento." });
      return;
    }

    // ACTIVE (no pagó, o el intento falló), REJECTED, CANCELLED o EXPIRED.
    res.status(200).json({ ok: true, state: "unpaid", ...summary(pendings[0]) });
  } catch (err) {
    console.error("[billing/confirm] fallo:", err);
    res.status(502).json({ ok: false, code: "PROVIDER_ERROR", error: "No pudimos consultar el pago en este momento." });
  }
}
