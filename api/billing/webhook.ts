// Receptor de los avisos de Bold. Bold llama esto directamente, sin sesión: la única
// defensa es la firma, y se necesita el cuerpo crudo tal cual llegó (bodyParser:false).
//
// Reglas, todas de la documentación de Bold (developers.bold.co/webhook):
//  · Sin BOLD_WEBHOOK_SECRET NO se procesa nada. Antes se saltaba la verificación "con un
//    aviso en el log": cualquiera podía mandar un pago aprobado inventado.
//  · Bold avisa TODAS las ventas del comercio (datáfono, otros links): lo que no es una
//    compra nuestra se responde 200 y se ignora. Con otra respuesta Bold reintenta 5 veces.
//  · El mismo aviso puede llegar más de una vez: acreditar es idempotente (api/_lib/billing.ts).
//  · La firma dice que el aviso es de Bold, NO que sea de un link nuestro: la referencia la
//    elige quien crea el link, y la llave de identidad con la que se crean es pública según
//    Bold. Alguien podría crear en el comercio un link de $1.000 con `reference` = el id de
//    su compra pendiente de un plan y pagarlo. Por eso acá solo se acredita si el monto
//    pagado cubre lo que se cobró; si no, deciden los caminos que le preguntan a Bold por el
//    link mismo (confirm y la conciliación), que no se pueden falsificar.
//  · Hay que responder 200 en menos de 2 segundos: acá no se llama a Bold, solo a la base.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../../db/index.js";
import { verifySignature } from "../_lib/bold.js";
import { findPurchaseByLink, settlePurchase } from "../_lib/billing.js";
import { isLinkId, parseNotification } from "../../src/lib/bold.js";

export const config = { api: { bodyParser: false } };

async function readRawBody(req: VercelRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).end("Método no permitido");
    return;
  }

  const secret = process.env.BOLD_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[billing/webhook] BOLD_WEBHOOK_SECRET no está configurado: el aviso se rechaza sin procesar.");
    res.status(503).end("Webhook sin configurar");
    return;
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["x-bold-signature"];
  if (!verifySignature(rawBody, Array.isArray(signature) ? signature[0] : signature, secret)) {
    console.error("[billing/webhook] Firma inválida");
    res.status(401).end("Unauthorized");
    return;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    res.status(400).end("JSON inválido");
    return;
  }

  const notice = parseNotification(payload);
  if (!notice) {
    console.warn("[billing/webhook] Aviso con un formato que no se reconoce; se ignora.");
    res.status(200).json({ ok: true, ignored: "formato" });
    return;
  }

  if (notice.type !== "SALE_APPROVED") {
    // Una anulación (VOID_APPROVED) devuelve la plata pero NO quita los créditos sola: se
    // hace a mano desde Admin → Usuarios. Queda en el log para que no pase inadvertida.
    if (notice.type === "VOID_APPROVED") {
      console.warn(`[billing/webhook] Venta anulada en Bold (${notice.reference ?? "sin referencia"}): revisar los créditos de esa compra.`);
    }
    res.status(200).json({ ok: true, ignored: notice.type });
    return;
  }

  try {
    const db = getDb();
    const purchase = await findPurchaseByLink(db, notice.reference);
    if (!purchase) {
      // Los links que se crean a mano en la app de Bold también empiezan por LNK_: lo normal
      // es que sea una de esas ventas. Queda anotado por si fuera una compra de la app sin fila.
      if (isLinkId(notice.reference)) console.warn(`[billing/webhook] Venta aprobada del link ${notice.reference}, que no es una compra de la app.`);
      res.status(200).json({ ok: true, ignored: "otra venta" });
      return;
    }

    if (purchase.amountCop == null || notice.totalCop == null || notice.totalCop < purchase.amountCop) {
      console.error(`[billing/webhook] ${purchase.linkId}: el aviso trae ${notice.totalCop ?? "ningún monto"} y la compra es de ${purchase.amountCop ?? "monto desconocido"}. NO se acredita por este camino.`);
      res.status(200).json({ ok: true, ignored: "monto" });
      return;
    }

    const result = await settlePurchase(db, purchase);
    if (result.status === "invalid") {
      console.error(`[billing/webhook] ${purchase.linkId}: pago aprobado SIN acreditar — ${result.reason}`);
      res.status(500).end("No se pudo acreditar");
      return;
    }
    res.status(200).json({ ok: true, status: result.status });
  } catch (err) {
    // 500 para que Bold reintente (15 min, 1 h, 4 h, 8 h, 24 h).
    console.error("[billing/webhook] fallo:", err);
    res.status(500).end("Error interno");
  }
}
