// Motor de chat unificado — reemplaza las 5 implementaciones distintas que
// llamaban a OpenRouter por su cuenta (useStudioChatAI, ai-service.streamTextGen,
// useGenesisLite, GeniusAssistant, nodos del canvas). Un solo lugar que:
//   1) valida sesión y plan,
//   2) cobra créditos de forma atómica ANTES de generar (con reembolso si falla),
//   3) hace streaming SSE compatible con OpenAI/OpenRouter,
//   4) persiste la conversación.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { getSessionUser, getProfile } from "../_lib/session.js";
import { spendCredits, refundCredits, consumeFreeMessage, logSpend, FREE_DAILY_MESSAGE_LIMIT } from "../_lib/credits.js";
import { CHAT_MODELS, DEFAULT_MODEL_ID, canAccessModel, getModel } from "../../src/lib/ai/models.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface ChatBody {
  model?: string;
  messages: ChatMessage[];
  assistantId?: string;
  conversationId?: string;
  systemPrompt?: string;
  /** 0–2. Genesis usa ~0.3 para código (determinista) y ~0.7 para charla. */
  temperature?: number;
  maxTokens?: number;
}

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

  const body = req.body as ChatBody;
  if (!body?.messages?.length) {
    res.status(400).json({ ok: false, code: "BAD_REQUEST", error: "Faltan mensajes." });
    return;
  }

  const modelId = body.model && CHAT_MODELS.some((m) => m.id === body.model) ? body.model : DEFAULT_MODEL_ID;
  const model = getModel(modelId);

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

  const cost = model.free ? 0 : model.credits;
  if (cost > 0) {
    const newBalance = await spendCredits(user.userId, cost);
    if (newBalance === null) {
      res.status(402).json({ ok: false, code: "INSUFFICIENT_CREDITS", error: "No tienes créditos suficientes." });
      return;
    }
  } else {
    // Modelos eco (0 créditos) sí cuestan dinero real en OpenRouter — sin este tope,
    // el costo por usuario/plan free no tiene límite mientras el ingreso es cero.
    const newCount = await consumeFreeMessage(user.userId);
    if (newCount === null) {
      res.status(429).json({
        ok: false,
        code: "FREE_LIMIT_REACHED",
        error: `Alcanzaste el límite de ${FREE_DAILY_MESSAGE_LIMIT} mensajes gratis por hoy. Vuelve mañana o mejora tu plan para seguir sin límite.`,
      });
      return;
    }
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    if (cost > 0) await refundCredits(user.userId, cost);
    res.status(200).json({
      ok: false,
      code: "NOT_CONFIGURED",
      error: "El motor de IA no está configurado. Agrega OPENROUTER_API_KEY en Vercel → Settings → Environment Variables.",
    });
    return;
  }

  const messages: ChatMessage[] = body.systemPrompt
    ? [{ role: "system", content: body.systemPrompt }, ...body.messages]
    : body.messages;

  let upstream: Response;
  try {
    upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://creator-ia.com",
        "X-Title": "Creator IA Pro - Genesis",
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        stream: true,
        ...(typeof body.temperature === "number" ? { temperature: body.temperature } : {}),
        ...(typeof body.maxTokens === "number" ? { max_tokens: body.maxTokens } : {}),
      }),
    });
  } catch {
    if (cost > 0) await refundCredits(user.userId, cost);
    res.status(502).json({ ok: false, code: "PROVIDER_ERROR", error: "No se pudo contactar al proveedor de IA." });
    return;
  }

  if (!upstream.ok || !upstream.body) {
    if (cost > 0) await refundCredits(user.userId, cost);
    const text = await upstream.text().catch(() => "");
    res.status(upstream.status || 502).json({
      ok: false,
      code: "PROVIDER_ERROR",
      error: text.slice(0, 300) || `El proveedor de IA respondió ${upstream.status}.`,
    });
    return;
  }

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Model-Used", modelId);
  res.setHeader("X-Credits-Charged", String(cost));

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let sawAnyContent = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length) {
            full += delta;
            sawAnyContent = true;
          }
        } catch {
          /* fragmento no-JSON, se ignora */
        }
      }
      res.write(chunk);
    }
  } catch {
    /* stream cortado — se conserva lo acumulado en `full` */
  } finally {
    res.end();
  }

  // Cobro sin resultado: reembolsa. Con resultado parcial, se conserva el cobro
  // (igual que en un chat normal: pagas por lo que sí se generó).
  if (cost > 0) {
    if (!sawAnyContent) await refundCredits(user.userId, cost);
    else await logSpend(user.userId, cost, `chat: ${modelId}`);
  }

  try {
    await persistConversation({
      userId: user.userId,
      assistantId: body.assistantId,
      conversationId: body.conversationId,
      userMessage: body.messages[body.messages.length - 1],
      assistantText: full,
      model: modelId,
      cost,
    });
  } catch (err) {
    console.error("[ai/chat] No se pudo persistir la conversación:", err);
  }
}

async function persistConversation(opts: {
  userId: string;
  assistantId?: string;
  conversationId?: string;
  userMessage: ChatMessage;
  assistantText: string;
  model: string;
  cost: number;
}) {
  if (!opts.assistantId) return; // sin asistente asociado, no hay dónde archivar el historial
  const db = getDb();
  let conversationId = opts.conversationId;

  if (!conversationId) {
    const [created] = await db
      .insert(schema.conversation)
      .values({
        id: crypto.randomUUID(),
        userId: opts.userId,
        assistantId: opts.assistantId,
        title: typeof opts.userMessage.content === "string" ? opts.userMessage.content.slice(0, 60) : "Nueva conversación",
      })
      .returning();
    conversationId = created.id;
  } else {
    await db.update(schema.conversation).set({ updatedAt: new Date() }).where(eq(schema.conversation.id, conversationId));
  }

  const userText = typeof opts.userMessage.content === "string" ? opts.userMessage.content : JSON.stringify(opts.userMessage.content);
  await db.insert(schema.message).values([
    { id: crypto.randomUUID(), conversationId, role: "user", content: userText },
    { id: crypto.randomUUID(), conversationId, role: "assistant", content: opts.assistantText, model: opts.model, costCredits: opts.cost },
  ]);
}
