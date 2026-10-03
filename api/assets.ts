// Biblioteca de assets guardados — reemplaza `supabase.from("saved_assets")`.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq, isNull, desc, count, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "../db/index.js";
import { requireUser } from "./_lib/require-user.js";

const PAGE_SIZE_MAX = 100;

/** Caracteres de `content` que viajan en la lista. La biblioteca pinta un resumen
 *  recortado a seis líneas; el documento entero se pide al abrir el editor. */
const PREVIEW_CHARS = 400;

/**
 * Columnas de la lista. NO incluye `asset_url` ni `content` crudos: hoy las imágenes
 * generadas se guardan como data URI base64 dentro de la fila, así que devolverlas
 * significaba mandar 6 MB para cuatro imágenes (medido en producción, una de 1,9 MB).
 * En su lugar viaja la URL de /api/assets/<id>/raw, que el navegador sí cachea y solo
 * pide para las miniaturas que de verdad se ven.
 */
const listColumns = {
  id: schema.savedAsset.id,
  userId: schema.savedAsset.userId,
  spaceId: schema.savedAsset.spaceId,
  nodeId: schema.savedAsset.nodeId,
  prompt: schema.savedAsset.prompt,
  type: schema.savedAsset.type,
  isFavorite: schema.savedAsset.isFavorite,
  tags: schema.savedAsset.tags,
  createdAt: schema.savedAsset.createdAt,
  /** true = el contenido está incrustado en la fila y hay que servirlo por /raw. */
  // "inline" = hay que servirlo por /raw: o está incrustado como data URI (filas
  // viejas) o vive en el Drive del usuario, que exige su token para leerlo.
  inline: sql<boolean>`(${schema.savedAsset.assetUrl} LIKE 'data:%' OR ${schema.savedAsset.assetUrl} LIKE 'drive:%')`.as("inline"),
  /** La url tal cual cuando ya vive fuera (Blob, Replicate…); null si está incrustada. */
  remoteUrl: sql<string | null>`CASE WHEN (${schema.savedAsset.assetUrl} LIKE 'data:%' OR ${schema.savedAsset.assetUrl} LIKE 'drive:%') THEN NULL ELSE ${schema.savedAsset.assetUrl} END`.as("remote_url"),
  contentPreview: sql<string | null>`left(${schema.savedAsset.content}, ${PREVIEW_CHARS})`.as("content_preview"),
};

type ListRow = { id: string; inline: boolean; remoteUrl: string | null };

/** La forma que espera el cliente: `assetUrl` sigue siendo algo que se puede poner
 *  en un <img src>, solo que ahora apunta a nuestro endpoint en vez de traer megas. */
function withUrl<T extends ListRow>(row: T) {
  const { inline, remoteUrl, ...rest } = row;
  return { ...rest, assetUrl: inline ? `/api/assets/${row.id}/raw` : (remoteUrl ?? "") };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const db = getDb();

  try {
  if (req.method === "GET") {
    const { spaceId, favoriteOnly, limit, offset, ids } = req.query as Record<string, string | undefined>;

    // Usado para rehidratar imágenes generadas en el chat de Basalt/Expertos
    // (ver src/lib/basalt.ts) — el historial de conversación solo guarda el
    // assetId, no la url pesada, así que al reabrir una conversación se piden
    // acá las urls reales de un lote puntual de assets en vez de paginar.
    if (ids) {
      const idList = ids.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50);
      if (!idList.length) { res.status(200).json({ ok: true, assets: [], total: 0 }); return; }
      const rows = await db.select(listColumns).from(schema.savedAsset)
        .where(and(eq(schema.savedAsset.userId, user.userId), inArray(schema.savedAsset.id, idList)));
      res.status(200).json({ ok: true, assets: rows.map(withUrl), total: rows.length });
      return;
    }

    // Ojo con el 0: `parseInt(limit) || 24` lo trataba como "sin valor" y devolvía la
    // página entera, justo lo contrario de lo que pide `limit=0` (solo el total).
    const parsedLimit = parseInt(limit ?? "", 10);
    const take = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 0), PAGE_SIZE_MAX) : 24;
    const skip = Math.max(parseInt(offset || "0", 10) || 0, 0);

    const conditions = [eq(schema.savedAsset.userId, user.userId)];
    if (spaceId === "none") conditions.push(isNull(schema.savedAsset.spaceId));
    else if (spaceId && spaceId !== "all") conditions.push(eq(schema.savedAsset.spaceId, spaceId));
    if (favoriteOnly === "true") conditions.push(eq(schema.savedAsset.isFavorite, true));
    const where = and(...conditions);

    // limit=0 = solo el total (el panel lo usaba con limit=1 y se bajaba una fila
    // entera, que podía ser el data URI de 1,9 MB, nada más que para contar).
    if (take === 0) {
      const [{ total }] = await db.select({ total: count() }).from(schema.savedAsset).where(where);
      res.status(200).json({ ok: true, assets: [], total });
      return;
    }

    const [rows, [{ total }]] = await Promise.all([
      db.select(listColumns).from(schema.savedAsset).where(where).orderBy(desc(schema.savedAsset.createdAt)).limit(take).offset(skip),
      db.select({ total: count() }).from(schema.savedAsset).where(where),
    ]);

    res.status(200).json({ ok: true, assets: rows.map(withUrl), total });
    return;
  }

  if (req.method === "POST") {
    const body = (req.body ?? {}) as {
      assetUrl?: string; prompt?: string; type?: string; spaceId?: string | null;
      tags?: string[]; content?: string;
    };
    // assetUrl puede venir vacío para assets tipo "document" (su contenido vive en `content`).
    if (body.assetUrl === undefined) {
      res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "Falta assetUrl." });
      return;
    }
    const [created] = await db
      .insert(schema.savedAsset)
      .values({
        id: crypto.randomUUID(),
        userId: user.userId,
        spaceId: body.spaceId || null,
        assetUrl: body.assetUrl,
        prompt: body.prompt ?? null,
        type: body.type || "image",
        tags: Array.isArray(body.tags) ? body.tags.slice(0, 20) : [],
        content: body.content ?? null,
      })
      // Sin columnas explícitas, el POST devolvía la fila completa: al generar una
      // imagen se subían 2 MB de base64 y se bajaban otros 2 MB de vuelta.
      .returning(listColumns);
    res.status(200).json({ ok: true, asset: withUrl(created) });
    return;
  }

  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
  } catch (err) {
    console.error("[api/assets]", err);
    res.status(500).json({ ok: false, code: "INTERNAL_ERROR", error: "Error al procesar la solicitud. Intenta de nuevo." });
  }
}
