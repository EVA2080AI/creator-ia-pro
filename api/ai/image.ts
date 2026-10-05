// Generación de imágenes — OpenRouter (proveedor activo) + Replicate (rama
// existente, en pausa desde que esa cuenta se quedó sin saldo — ver el
// comentario en src/lib/ai/models.ts). Mismo patrón que api/ai/chat.ts:
// sesión → plan → cobro atómico de créditos ANTES de generar → reembolso si falla.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSessionUser, getProfile } from "../_lib/session.js";
import { spendCredits, refundCredits, getBalance, logSpend } from "../_lib/credits.js";
import { IMAGE_MODELS, DEFAULT_IMAGE_MODEL_ID, canAccessModel, getImageModel } from "../../src/lib/ai/models.js";
import { uploadImage } from "../_lib/blob.js";
import { hasDriveLinked, uploadToDrive, DRIVE_PREFIX } from "../_lib/drive.js";

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
  // Solo una referencia con forma de imagen y acotada: esto se reenvía al proveedor
  // tal cual y sin tope aceptaba cualquier cosa hasta el límite del cuerpo (4,5 MB).
  const imagePrompt = model.supportsImagePrompt
    && typeof body.imagePrompt === "string"
    && body.imagePrompt.length <= 2_000_000
    && (/^data:image\/(png|jpe?g|webp);base64,/.test(body.imagePrompt) || /^https:\/\//.test(body.imagePrompt))
      ? body.imagePrompt
      : undefined;

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
      const balance = profile?.creditsBalance ?? 0;
      res.status(402).json({
        ok: false,
        code: "INSUFFICIENT_CREDITS",
        error: `Te faltan ${cost - balance} créditos (tienes ${balance}, esta imagen cuesta ${cost}).`,
        required: cost,
        balance,
      });
      return;
    }
  }

  const apiKeyEnvVar = model.provider === "openrouter" ? "OPENROUTER_API_KEY" : "REPLICATE_API_TOKEN";
  const apiKey = process.env[apiKeyEnvVar];
  if (!apiKey) {
    if (cost > 0) await refundCredits(user.userId, cost);
    res.status(200).json({
      ok: false,
      code: "NOT_CONFIGURED",
      error: `La generación de imágenes no está configurada. Agrega ${apiKeyEnvVar} en Vercel.`,
    });
    return;
  }

  try {
    const generated = model.provider === "openrouter"
      ? await generateOpenRouterImage(model.openrouterSlug!, prompt, aspectRatio, imagePrompt, apiKey)
      : await generateReplicateImage(model.replicateSlug!, prompt, aspectRatio, imagePrompt, apiKey);
    // Los proveedores devuelven o una URL temporal o un data URI de varios MB. La
    // imagen se guarda antes de responder para que lo que viaje al navegador sea una
    // referencia corta, no la imagen entera en base64.
    //
    // Si el usuario vinculó su Google Drive, va ahí (es su espacio y su decisión, ver
    // /perfil). Si no lo vinculó —o Drive falla por token, permisos o cuota— se usa el
    // almacenamiento de la plataforma. Y si todo falla, se devuelve lo que vino: una
    // imagen que el usuario pagó no se pierde por un problema de almacenamiento.
    const imageUrl = (await guardarImagen(generated, user.userId)) ?? generated;
    if (cost > 0) await logSpend(user.userId, cost, `image: ${modelId}`);
    const creditsRemaining = await getBalance(user.userId).catch(() => null);
    res.status(200).json({ ok: true, imageUrl, model: modelId, cost, creditsRemaining });
  } catch (err) {
    if (cost > 0) await refundCredits(user.userId, cost);
    const message = err instanceof Error ? err.message : "Error al generar la imagen.";
    res.status(502).json({ ok: false, code: "PROVIDER_ERROR", error: message.slice(0, 300) });
  }
}

const DATA_URI = /^data:([^;,]+);base64,(.*)$/s;

/**
 * Guarda la imagen donde corresponda y devuelve la referencia que se persistirá:
 * `drive:<fileId>` si es el Drive del usuario, o la URL pública de Blob.
 */
async function guardarImagen(generated: string, userId: string): Promise<string | null> {
  const match = DATA_URI.exec(generated);
  if (match && (await hasDriveLinked(userId))) {
    const [, mime, base64] = match;
    const nombre = `creator-ia-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${mime.split("/")[1] || "png"}`;
    const fileId = await uploadToDrive(userId, Buffer.from(base64, "base64"), mime, nombre);
    if (fileId) return `${DRIVE_PREFIX}${fileId}`;
    console.warn("[image] Drive no aceptó la imagen; se guarda en la plataforma.");
  }
  return uploadImage(generated, userId);
}

/** Forma mínima de una respuesta de la Image API de OpenRouter (POST /api/v1/images). */
interface OpenRouterImageResponse {
  data?: { b64_json?: string; url?: string; media_type?: string }[];
  error?: { message?: string };
}

async function generateOpenRouterImage(
  openrouterSlug: string,
  prompt: string,
  aspectRatio: string,
  imagePrompt: string | undefined,
  token: string,
): Promise<string> {
  const body: Record<string, unknown> = { model: openrouterSlug, prompt, n: 1, aspect_ratio: aspectRatio };
  if (imagePrompt) body.input_references = [imagePrompt];

  const res = await fetch("https://openrouter.ai/api/v1/images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => null)) as OpenRouterImageResponse | null;
  if (!res.ok || !data) {
    throw new Error(data?.error?.message || `${res.status} ${res.statusText}`);
  }

  const item = data.data?.[0];
  if (item?.url) return item.url;
  if (item?.b64_json) return `data:${item.media_type || "image/png"};base64,${item.b64_json}`;
  throw new Error("sin imagen en la respuesta de OpenRouter");
}

/** Forma mínima de una predicción de Replicate (creación + polling manual). */
interface ReplicatePrediction {
  status: string;
  urls?: { get: string };
  error?: unknown;
  output?: string | string[];
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

  let prediction = (await createRes.json()) as ReplicatePrediction;

  // Si el `wait` síncrono expiró antes de terminar, seguimos con polling manual.
  for (let i = 0; i < 20 && (prediction.status === "starting" || prediction.status === "processing"); i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(prediction.urls?.get, { headers: { Authorization: `Bearer ${token}` } });
    if (!pollRes.ok) continue;
    prediction = (await pollRes.json()) as ReplicatePrediction;
  }

  if (prediction.status !== "succeeded") {
    throw new Error(String(prediction.error || `predicción en estado ${prediction.status}`));
  }
  const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (typeof output !== "string" || !output) throw new Error("sin URL de imagen en la respuesta");
  return output;
}
