// Generación de imágenes — Replicate (flux). Mismo patrón que api/ai/chat.ts:
// sesión → plan → cobro atómico de créditos ANTES de generar → reembolso si falla.
// Puerto de supabase/functions/ai-proxy/index.ts (generateReplicateImage), que ya
// estaba probado en producción: predicción síncrona (`Prefer: wait=60`) con fallback
// a polling manual si el modelo tarda más.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSessionUser, getProfile } from "../_lib/session.js";
import { spendCredits, refundCredits, getBalance } from "../_lib/credits.js";
import { IMAGE_MODELS, DEFAULT_IMAGE_MODEL_ID, canAccessModel, getImageModel } from "../../src/lib/ai/models.js";

interface ImageBody {
  prompt?: string;
  model?: string;
  /** '1:1' | '16:9' | '9:16' | '3:2' | '2:3' */
  aspectRatio?: string;
  /** URL o data: URI de referencia — solo modelos con supportsImagePrompt. */
  imagePrompt?: string;
}

const ASPECT_RATIOS = new Set(["1:1", "16:9", "9:16", "3:2", "2:3"]);

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

  const body = req.body as ImageBody;
  const prompt = (body?.prompt || "").trim().slice(0, 2000);
  if (!prompt) {
    res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "Falta describir la imagen." });
    return;
  }

  const modelId = body.model && IMAGE_MODELS.some((m) => m.id === body.model) ? body.model : DEFAULT_IMAGE_MODEL_ID;
  const model = getImageModel(modelId);
  const aspectRatio = body.aspectRatio && ASPECT_RATIOS.has(body.aspectRatio) ? body.aspectRatio : "1:1";
  const imagePrompt = model.supportsImagePrompt ? body.imagePrompt : undefined;

  const profile = await getProfile(user.userId);
  const tier = profile?.subscriptionTier ?? "free";
  if (!canAccessModel(tier, model.minTier)) {
    res.status(403).json({
      ok: false,
      code: "TIER_REQUIRED",
      error: `"${model.label}" requiere el plan ${model.minTier} o superior.`,
    });
    return;
  }

  const cost = model.credits;
  if (cost > 0) {
    const newBalance = await spendCredits(user.userId, cost);
    if (newBalance === null) {
      res.status(402).json({ ok: false, code: "INSUFFICIENT_CREDITS", error: "No tienes créditos suficientes." });
      return;
    }
  }

  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) {
    if (cost > 0) await refundCredits(user.userId, cost);
    res.status(200).json({
      ok: false,
      code: "NOT_CONFIGURED",
      error: "La generación de imágenes no está configurada. Agrega REPLICATE_API_TOKEN en Vercel.",
    });
    return;
  }

  try {
    const imageUrl = await generateReplicateImage(model.replicateSlug, prompt, aspectRatio, imagePrompt, REPLICATE_API_TOKEN);
    const creditsRemaining = await getBalance(user.userId).catch(() => null);
    res.status(200).json({ ok: true, imageUrl, model: modelId, cost, creditsRemaining });
  } catch (err) {
    if (cost > 0) await refundCredits(user.userId, cost);
    const message = err instanceof Error ? err.message : "Error al generar la imagen.";
    res.status(502).json({ ok: false, code: "PROVIDER_ERROR", error: message.slice(0, 300) });
  }
}

async function generateReplicateImage(
  replicateSlug: string,
  prompt: string,
  aspectRatio: string,
  imagePrompt: string | undefined,
  token: string,
): Promise<string> {
  const input: Record<string, unknown> = { prompt, aspect_ratio: aspectRatio };
  if (imagePrompt) input.image_prompt = imagePrompt;

  const createRes = await fetch(`https://api.replicate.com/v1/models/${replicateSlug}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "wait=60",
    },
    body: JSON.stringify({ input }),
  });

  if (!createRes.ok) {
    const detail = await createRes.text();
    throw new Error(`${createRes.status} ${detail.slice(0, 200)}`);
  }

  let prediction = await createRes.json();

  // Si el `wait` síncrono expiró antes de terminar, seguimos con polling manual.
  for (let i = 0; i < 20 && (prediction.status === "starting" || prediction.status === "processing"); i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(prediction.urls?.get, { headers: { Authorization: `Bearer ${token}` } });
    if (!pollRes.ok) continue;
    prediction = await pollRes.json();
  }

  if (prediction.status !== "succeeded") {
    throw new Error(String(prediction.error || `predicción en estado ${prediction.status}`));
  }
  const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (typeof output !== "string" || !output) throw new Error("sin URL de imagen en la respuesta");
  return output;
}
