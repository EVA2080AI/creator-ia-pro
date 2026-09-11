// Motor de chat unificado — reemplaza las 5 implementaciones distintas que
// llamaban a OpenRouter por su cuenta (useStudioChatAI, ai-service.streamTextGen,
// useGenesisLite, GeniusAssistant, nodos del canvas). Un solo lugar que:
//   1) valida sesión y plan,
//   2) cobra créditos de forma atómica ANTES de generar (con reembolso si falla),
//   3) hace streaming SSE compatible con OpenAI/OpenRouter,
//   4) persiste la conversación.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../../db/index.js";
import { getSessionUser, getProfile } from "../_lib/session.js";
import { spendCredits, refundCredits, consumeFreeMessage, logSpend, FREE_DAILY_MESSAGE_LIMIT } from "../_lib/credits.js";
import { CHAT_MODELS, DEFAULT_MODEL_ID, canAccessModel, getModel } from "../../src/lib/ai/models.js";
import { tavilySearch, WEB_SEARCH_TOOL } from "../_lib/search.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// 1 crédito — mismo orden de magnitud que los modelos de chat más baratos
// (ver src/lib/ai/models.ts). Se cobra SOLO si el modelo de verdad decide
// buscar (tool_choice:"auto" — puede que nunca la use), nunca por adelantado.
const SEARCH_TOOL_COST = 1;
// Una búsqueda suma latencia real (Tavily + un segundo stream completo de
// OpenRouter) — sin esto, el timeout implícito de Vercel podría cortar la
// respuesta a mitad de la vuelta de tool-calling.
export const config = { maxDuration: 60 };

interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> | null;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
}

interface ChatBody {
  model?: string;
  messages: ChatMessage[];
  assistantId?: string;
  conversationId?: string;
  /** Proyecto de Genesis — persiste la conversación aunque no haya asistente. */
  projectId?: string;
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
      const balance = profile?.creditsBalance ?? 0;
      res.status(402).json({
        ok: false,
        code: "INSUFFICIENT_CREDITS",
        error: `Te faltan ${cost - balance} créditos (tienes ${balance}, este mensaje cuesta ${cost}).`,
        required: cost,
        balance,
      });
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

  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

  const callOpenRouter = (msgs: ChatMessage[], withTools: boolean) =>
    fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://creator-ia.com",
        "X-Title": "Creator IA Pro - Basalt",
      },
      body: JSON.stringify({
        model: modelId,
        messages: msgs,
        stream: true,
        // El modelo decide solo si busca (tool_choice:"auto") — el prompt
        // (GENESIS_CHAT_SYSTEM_BASE_RULES / CODE_GEN_SYSTEM) le dice cuándo
        // tiene sentido. En la segunda vuelta (después del resultado de la
        // búsqueda) no se ofrece de nuevo — fuerza una respuesta final en
        // vez de encadenar búsquedas.
        ...(withTools ? { tools: [WEB_SEARCH_TOOL], tool_choice: "auto" } : {}),
        ...(typeof body.temperature === "number" ? { temperature: body.temperature } : {}),
        ...(typeof body.maxTokens === "number" ? { max_tokens: body.maxTokens } : {}),
      }),
    });

  let upstream: Response;
  try {
    upstream = await callOpenRouter(messages, true);
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

  interface StreamResult {
    full: string;
    sawAnyContent: boolean;
    finishReason: string | null;
    toolCall: { id: string; name: string; argsText: string } | null;
  }

  // Lee un stream SSE de OpenRouter, reenvía cada chunk crudo al cliente
  // (comportamiento sin cambios) y ADEMÁS acumula tool_calls/finish_reason —
  // necesario para saber si hay que pausar y ejecutar una búsqueda.
  async function streamAndCollect(upstreamRes: Response): Promise<StreamResult> {
    const reader = upstreamRes.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";
    let sawAnyContent = false;
    let finishReason: string | null = null;
    let toolCallId: string | undefined;
    let toolCallName: string | undefined;
    let toolArgsText = "";

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
            const choice = json.choices?.[0];
            const delta = choice?.delta;
            const contentDelta = delta?.content;
            if (typeof contentDelta === "string" && contentDelta.length) {
              full += contentDelta;
              sawAnyContent = true;
            }
            const tc = delta?.tool_calls?.[0];
            if (tc) {
              if (tc.id) toolCallId = tc.id;
              if (tc.function?.name) toolCallName = tc.function.name;
              if (typeof tc.function?.arguments === "string") toolArgsText += tc.function.arguments;
            }
            if (choice?.finish_reason) finishReason = choice.finish_reason;
          } catch {
            /* fragmento no-JSON, se ignora */
          }
        }
        res.write(chunk);
      }
    } catch {
      /* stream cortado — se conserva lo acumulado en `full` */
    }

    return {
      full,
      sawAnyContent,
      finishReason,
      toolCall: toolCallId && toolCallName ? { id: toolCallId, name: toolCallName, argsText: toolArgsText } : null,
    };
  }

  let full = "";
  let sawAnyContent = false;
  let searchCreditCharged = false;

  try {
    const first = await streamAndCollect(upstream);
    full = first.full;
    sawAnyContent = first.sawAnyContent;

    if (first.finishReason === "tool_calls" && first.toolCall?.name === "web_search") {
      let searchQuery = "";
      try {
        searchQuery = String(JSON.parse(first.toolCall.argsText || "{}").query || "");
      } catch {
        /* argumentos truncados o inválidos — se trata como consulta vacía */
      }

      let toolResultContent: string;
      if (!searchQuery) {
        toolResultContent = JSON.stringify({ results: [], note: "consulta vacía, no se pudo buscar" });
      } else if (!TAVILY_API_KEY) {
        toolResultContent = JSON.stringify({ results: [], note: "búsqueda no configurada en este momento" });
      } else {
        const newBalance = await spendCredits(user.userId, SEARCH_TOOL_COST);
        if (newBalance === null) {
          toolResultContent = JSON.stringify({ results: [], note: "créditos insuficientes para buscar" });
        } else {
          searchCreditCharged = true;
          try {
            const results = await tavilySearch(searchQuery, TAVILY_API_KEY);
            toolResultContent = JSON.stringify({ query: searchQuery, results });
          } catch {
            await refundCredits(user.userId, SEARCH_TOOL_COST);
            searchCreditCharged = false;
            toolResultContent = JSON.stringify({ query: searchQuery, results: [], note: "búsqueda no disponible en este momento" });
          }
        }
      }

      const followUpMessages: ChatMessage[] = [
        ...messages,
        {
          role: "assistant",
          content: null,
          tool_calls: [{ id: first.toolCall.id, type: "function", function: { name: "web_search", arguments: first.toolCall.argsText } }],
        },
        { role: "tool", tool_call_id: first.toolCall.id, content: toolResultContent },
      ];

      try {
        const upstream2 = await callOpenRouter(followUpMessages, false);
        if (upstream2.ok && upstream2.body) {
          const second = await streamAndCollect(upstream2);
          full += second.full;
          sawAnyContent = sawAnyContent || second.sawAnyContent;
        }
      } catch {
        /* la primera respuesta ya se streameó — si la segunda vuelta falla,
           el usuario se queda con lo que ya vio en vez de perder todo. */
      }

      if (searchCreditCharged) await logSpend(user.userId, SEARCH_TOOL_COST, `search: ${searchQuery.slice(0, 60)}`);
    }
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
      projectId: body.projectId,
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
  projectId?: string;
  userMessage: ChatMessage;
  assistantText: string;
  model: string;
  cost: number;
}) {
  // Hay historial si hay asistente (Assistant) o proyecto (Genesis). Sin
  // ninguno de los dos (Tools, nodos sueltos) no hay dónde archivar.
  if (!opts.assistantId && !opts.projectId) return;
  const db = getDb();

  // El projectId debe pertenecer al usuario — si no, se archiva sin proyecto
  // en lugar de vincular el historial a un proyecto ajeno.
  let projectId: string | null = opts.projectId ?? null;
  if (projectId) {
    const [owned] = await db
      .select({ id: schema.project.id })
      .from(schema.project)
      .where(and(eq(schema.project.id, projectId), eq(schema.project.userId, opts.userId)))
      .limit(1);
    if (!owned) projectId = null;
  }

  let conversationId = opts.conversationId;
  if (!conversationId) {
    const [created] = await db
      .insert(schema.conversation)
      .values({
        id: crypto.randomUUID(),
        userId: opts.userId,
        // Genesis no tiene asistente (assistantId nullable desde la migración 0001)
        assistantId: opts.assistantId ?? null,
        projectId,
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
