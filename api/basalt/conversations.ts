// Historial de conversaciones de Basalt Y de los Expertos — antes vivía solo
// en localStorage (Basalt) o en memoria pura sin guardar nada (Expertos), ver
// db/schema/basalt.ts. ?assistant=<slug> filtra/asigna por Experto; sin ese
// query param es el chat de Basalt mismo (assistantSlug null). GET lista las
// últimas 50 conversaciones del usuario para ese contexto; POST hace upsert
// de una conversación completa, mismo shape que StoredConversation en
// src/lib/basalt.ts. DELETE de una sola conversación vive en [id].ts.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../../db/index.js";
import { requireUser } from "../_lib/require-user.js";

const MAX_CONVERSATIONS = 50;
const MAX_TITLE = 200;
const MAX_SLUG = 80;

const IMAGE_SCHEMA = z.object({
  prompt: z.string(),
  format: z.string(),
  url: z.string().optional(),
  error: z.string().optional(),
  /** id en saved_asset — para rehidratar la url real sin guardarla acá (ver src/lib/basalt.ts). */
  assetId: z.string().optional(),
});

/** Ficha del documento adjunto: SOLO el rastro de que existió (nombre y tamaño). El texto del
 *  documento no se guarda en ninguna parte — ver src/lib/doc-context.ts. */
const ATTACHMENT_SCHEMA = z.object({
  name: z.string().max(200),
  chars: z.number(),
  pages: z.number().optional(),
  truncated: z.boolean().optional(),
});

const MSG_SCHEMA = z.object({
  id: z.string(),
  role: z.enum(["user", "model"]),
  text: z.string(),
  images: z.array(IMAGE_SCHEMA).optional(),
  // Sin esto, zod las descartaba al guardar: al recargar la conversación desaparecía la ficha
  // "contrato.pdf" de la burbuja y no quedaba señal de que ese mensaje llevaba un documento.
  attachments: z.array(ATTACHMENT_SCHEMA).max(5).optional(),
});

const UPSERT_SCHEMA = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(MAX_TITLE),
  messages: z.array(MSG_SCHEMA),
  assistantSlug: z.string().trim().min(1).max(MAX_SLUG).nullish(),
});

const PIN_SCHEMA = z.object({
  id: z.string().min(1),
  pinned: z.boolean(),
});

/**
 * Las migraciones de este proyecto se aplican a mano (`npx drizzle-kit push`), así que el código
 * puede llegar a producción antes que la columna `pinned` (db/migrations/0007). Mientras no exista,
 * el historial sigue funcionando exactamente como antes y anclar devuelve un error entendible, en vez
 * de tumbar la pantalla entera con un 500.
 */
function isMissingPinnedColumn(e: unknown): boolean {
  const err = e as { code?: string; message?: string };
  return err?.code === "42703" || /column .*pinned.* does not exist/i.test(err?.message ?? "");
}

function slugFilter(slug: string | null) {
  return slug ? eq(schema.basaltConversation.assistantSlug, slug) : isNull(schema.basaltConversation.assistantSlug);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const db = getDb();
  const assistantSlug = typeof req.query.assistant === "string" ? req.query.assistant : null;

  if (req.method === "GET") {
    const cols = {
      id: schema.basaltConversation.id,
      title: schema.basaltConversation.title,
      updatedAt: schema.basaltConversation.updatedAt,
      messages: schema.basaltConversation.messages,
    };
    const where = and(eq(schema.basaltConversation.userId, user.userId), slugFilter(assistantSlug));
    // Las ancladas primero: con el tope de 50, ordenarlo acá (y no en el cliente) es lo que
    // garantiza que una anclada vieja no se caiga de la lista.
    let rows: { id: string; title: string; updatedAt: Date; messages: unknown; pinned: boolean }[];
    try {
      rows = await db.select({ ...cols, pinned: schema.basaltConversation.pinned }).from(schema.basaltConversation)
        .where(where)
        .orderBy(desc(schema.basaltConversation.pinned), desc(schema.basaltConversation.updatedAt))
        .limit(MAX_CONVERSATIONS);
    } catch (e) {
      if (!isMissingPinnedColumn(e)) throw e;
      const plain = await db.select(cols).from(schema.basaltConversation)
        .where(where)
        .orderBy(desc(schema.basaltConversation.updatedAt))
        .limit(MAX_CONVERSATIONS);
      rows = plain.map((r) => ({ ...r, pinned: false }));
    }
    res.status(200).json({
      ok: true,
      conversations: rows.map((r) => ({
        id: r.id,
        title: r.title,
        updatedAt: r.updatedAt.getTime(),
        messages: r.messages,
        pinned: r.pinned,
      })),
    });
    return;
  }

  // Anclar / desanclar. Va aparte del POST a propósito: guardar una conversación no toca `pinned`,
  // así que ese camino sigue funcionando aunque la columna todavía no exista.
  if (req.method === "PATCH") {
    const parsed = PIN_SCHEMA.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ ok: false, code: "BAD_REQUEST", error: parsed.error.issues[0]?.message ?? "Datos inválidos." });
      return;
    }
    try {
      await db.update(schema.basaltConversation)
        .set({ pinned: parsed.data.pinned })
        .where(and(eq(schema.basaltConversation.id, parsed.data.id), eq(schema.basaltConversation.userId, user.userId)));
    } catch (e) {
      if (!isMissingPinnedColumn(e)) throw e;
      console.error("[basalt/conversations] Falta aplicar la migración 0007 (columna pinned): npx drizzle-kit push");
      res.status(503).json({ ok: false, code: "PIN_UNAVAILABLE", error: "Anclar conversaciones todavía no está disponible. Inténtalo más tarde." });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === "POST") {
    const parsed = UPSERT_SCHEMA.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ ok: false, code: "BAD_REQUEST", error: parsed.error.issues[0]?.message ?? "Datos inválidos." });
      return;
    }
    const { id, title, messages, assistantSlug: bodySlug } = parsed.data;
    const slug = bodySlug ?? null;

    // setWhere scopea el UPDATE al dueño real de la fila — sin esto, un
    // cliente que mande un `id` que por casualidad (o a propósito) coincide
    // con la conversación de OTRO usuario podía sobreescribírsela, porque
    // onConflictDoUpdate por sí solo solo mira el `id`, no el `userId`
    // (encontrado en auditoría 2026-09-29; el resto de los upserts del
    // proyecto sí scopean el conflicto — este había quedado como excepción).
    await db.insert(schema.basaltConversation)
      .values({ id, userId: user.userId, assistantSlug: slug, title, messages, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: schema.basaltConversation.id,
        set: { title, messages, updatedAt: new Date() },
        setWhere: eq(schema.basaltConversation.userId, user.userId),
      });

    // Tope de 50 conversaciones por usuario Y contexto (Basalt o cada
    // Experto por separado) — igual al límite que ya aplicaba el
    // localStorage (Array.slice(0, 50) en src/lib/basalt.ts).
    let all: { id: string }[];
    try {
      // Las ancladas quedan de primeras: lo que se cae del tope es lo más viejo SIN anclar.
      all = await db.select({ id: schema.basaltConversation.id })
        .from(schema.basaltConversation)
        .where(and(eq(schema.basaltConversation.userId, user.userId), slugFilter(slug)))
        .orderBy(desc(schema.basaltConversation.pinned), desc(schema.basaltConversation.updatedAt));
    } catch (e) {
      if (!isMissingPinnedColumn(e)) throw e;
      all = await db.select({ id: schema.basaltConversation.id })
        .from(schema.basaltConversation)
        .where(and(eq(schema.basaltConversation.userId, user.userId), slugFilter(slug)))
        .orderBy(desc(schema.basaltConversation.updatedAt));
    }
    if (all.length > MAX_CONVERSATIONS) {
      const toDelete = all.slice(MAX_CONVERSATIONS).map((r) => r.id);
      await db.delete(schema.basaltConversation).where(inArray(schema.basaltConversation.id, toDelete));
    }

    res.status(200).json({ ok: true });
    return;
  }

  res.setHeader("Allow", "GET, POST, PATCH");
  res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido." });
}
