// Receptor del webhook de Bold.co — puerto de supabase/functions/bold-webhook.
// Bold llama esto directamente (sin sesión de usuario); la única defensa es la
// firma HMAC. Necesita el body crudo tal cual llegó, por eso bodyParser:false.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq, and, like } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { addCredits } from "../_lib/credits.js";

export const config = { api: { bodyParser: false } };

async function readRawBody(req: VercelRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

/** Firma Bold = HMAC-SHA256(base64(body crudo), secreto), en hex. */
function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const base64Body = Buffer.from(rawBody, "utf8").toString("base64");
  const expected = createHmac("sha256", secret).update(base64Body).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const CREDIT_MAP: Record<string, number> = {
  pack_200: 200,
  pack_1000: 1000,
  pack_2000: 2000,
  creador: 1000,
  pro: 3000,
  agencia: 8000,
  pyme: 20000,
};

const PLAN_IDS = new Set(["creador", "pro", "agencia", "pyme"]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).end("Método no permitido");
    return;
  }

  const rawBody = await readRawBody(req);
  const secret = process.env.BOLD_WEBHOOK_SECRET;
  const signature = (req.headers["x-bold-signature"] as string | undefined) ?? null;

  if (secret) {
    if (!verifySignature(rawBody, signature, secret)) {
      console.error("[billing/webhook] Firma inválida");
      res.status(401).end("Unauthorized");
      return;
    }
  } else {
    console.warn("[billing/webhook] BOLD_WEBHOOK_SECRET no configurado — verificación omitida.");
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    res.status(400).end("JSON inválido");
    return;
  }

  const linkId = payload?.data?.reference || payload?.reference || payload?.payment_link_id;
  const status = payload?.data?.status || payload?.status;

  if (!linkId) {
    res.status(400).end("Falta reference");
    return;
  }

  if (status !== "APPROVED" && status !== "PAID") {
    res.status(200).json({ ok: true, ignored: true });
    return;
  }

  const db = getDb();
  const pending = await db
    .select()
    .from(schema.transaction)
    .where(and(eq(schema.transaction.type, "bold_pending"), like(schema.transaction.description, `%${linkId}%`)));

  const tx = pending.find((t) => t.description?.includes(linkId));
  if (!tx) {
    console.error("[billing/webhook] Sin transacción pendiente para:", linkId);
    res.status(404).end("Transaction not found");
    return;
  }

  const packId = tx.description?.split("|")[0]?.trim() ?? "";
  const creditsToAdd = CREDIT_MAP[packId] || 0;

  if (creditsToAdd > 0) {
    await addCredits(tx.userId, creditsToAdd);

    if (PLAN_IDS.has(packId)) {
      await db
        .update(schema.profile)
        .set({ subscriptionTier: packId, updatedAt: new Date() })
        .where(eq(schema.profile.userId, tx.userId));
      await db.insert(schema.transaction).values({
        id: crypto.randomUUID(),
        userId: tx.userId,
        type: "subscription_change",
        amount: 0,
        description: `Plan activado: ${packId} (Bold)`,
      });
    }

    await db
      .update(schema.transaction)
      .set({ type: "bold_approved", amount: creditsToAdd })
      .where(eq(schema.transaction.id, tx.id));
  }

  res.status(200).json({ ok: true });
}
