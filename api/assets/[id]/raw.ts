// Sirve el binario de un asset guardado. Existe porque hoy las imágenes generadas se
// guardan como data URI base64 DENTRO de la fila de Postgres: pedir la lista de la
// biblioteca descargaba 6 MB para cuatro imágenes (una de 1,9 MB), y el navegador no
// podía cachear nada porque el contenido viajaba dentro del JSON.
//
// Ahora la lista manda la URL de este endpoint y cada imagen se pide por separado, se
// cachea y solo se baja la que de verdad se ve (los <img> de la biblioteca son lazy).
// Cuando las imágenes estén en Vercel Blob este endpoint solo servirá a las filas
// viejas, y se podrá borrar cuando no quede ninguna.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../../../db/index.js";
import { requireUser } from "../../_lib/require-user.js";

/** Lo que se devuelve con su propio Content-Type. Un SVG puede traer <script> y acá se
 *  serviría desde nuestro propio origen, así que no entra: se baja como archivo. */
const INLINE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/avif"]);

const DATA_URI = /^data:([^;,]+)(;base64)?,(.*)$/s;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido." });
    return;
  }

  const id = req.query.id as string;
  const db = getDb();

  try {
    // El filtro por userId es lo que impide que un id adivinado sirva la imagen de otro.
    const [row] = await db
      .select({ assetUrl: schema.savedAsset.assetUrl })
      .from(schema.savedAsset)
      .where(and(eq(schema.savedAsset.id, id), eq(schema.savedAsset.userId, user.userId)))
      .limit(1);

    if (!row?.assetUrl) {
      res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Ese archivo no existe." });
      return;
    }

    // Las que ya están en un almacenamiento externo (Blob, Replicate…) no se proxean.
    if (/^https?:\/\//i.test(row.assetUrl)) {
      res.redirect(302, row.assetUrl);
      return;
    }

    const match = DATA_URI.exec(row.assetUrl);
    if (!match) {
      res.status(404).json({ ok: false, code: "NOT_FOUND", error: "Ese archivo no existe." });
      return;
    }

    const [, mime, isBase64, payload] = match;
    const buf = isBase64 ? Buffer.from(payload, "base64") : Buffer.from(decodeURIComponent(payload), "utf8");

    // `asset_url` no se modifica nunca después del insert (el PATCH solo toca
    // favorito, tags, espacio y contenido), así que es seguro marcarlo inmutable.
    // `private` porque la respuesta depende de la cookie de sesión.
    const etag = `"${id}"`;
    if (req.headers["if-none-match"] === etag) {
      res.status(304).end();
      return;
    }

    const inline = INLINE_TYPES.has(mime.toLowerCase());
    res.setHeader("Content-Type", inline ? mime : "application/octet-stream");
    if (!inline) res.setHeader("Content-Disposition", `attachment; filename="${id}"`);
    res.setHeader("Content-Length", String(buf.length));
    res.setHeader("Cache-Control", "private, max-age=31536000, immutable");
    res.setHeader("ETag", etag);
    res.status(200).end(buf);
  } catch (err) {
    console.error("[api/assets/raw]", err);
    res.status(500).json({ ok: false, code: "INTERNAL_ERROR", error: "No se pudo leer el archivo." });
  }
}
