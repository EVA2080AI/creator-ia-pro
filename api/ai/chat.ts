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
import { spendCredits, refundCredits, consumeFreeMessage, logSpend, FREE_DAILY_MESSAGE_LIMIT, FREE_LIMIT_EXEMPT_EMAILS } from "../_lib/credits.js";
import { CHAT_MODELS, DEFAULT_MODEL_ID, canAccessModel, getModel } from "../../src/lib/ai/models.js";
import { tavilySearch, WEB_SEARCH_TOOL } from "../_lib/search.js";
import { USER_DATA_TOOLS, isUserDataToolName } from "../_lib/userDataTools.js";
import { getUserProjects, getUserAssets, getUserUsage } from "../_lib/userData.js";
import { DOC_ANALYSIS_PROMPT, DOC_RULES_MARKER, docBlock, sanitizeDocuments, type DocPayload } from "../../src/lib/doc-context.js";
import { basaltEventLine, type SearchSource } from "../../src/lib/stream-events.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// 1 crédito — mismo orden de magnitud que los modelos de chat más baratos
// (ver src/lib/ai/models.ts). Se cobra SOLO si el modelo de verdad decide
// buscar (tool_choice:"auto" — puede que nunca la use), nunca por adelantado.
const SEARCH_TOOL_COST = 1;
// Una búsqueda suma latencia real (Tavily + un segundo stream completo de
// OpenRouter) — sin esto, el timeout implícito de Vercel podría cortar la
// respuesta a mitad de la vuelta de tool-calling.
export const config = { maxDuration: 60 };
// Margen bajo maxDuration: si el modelo es lento (los gratuitos rondan pocos
// tokens/seg) Vercel mataba la función a los 60s en seco y la respuesta
// quedaba cortada a mitad de un bloque de código SIN que el cliente se
// enterara — encontrado en vivo (2026-09-30): un sitio de 3 archivos llegaba
// solo hasta index.html. Ahora se corta a los 54s con un finish_reason
// explícito ("length") para que el cliente ofrezca "Continuar".
const STREAM_DEADLINE_MS = 54_000;

/** Se agrega al prompt cuando no hay TAVILY_API_KEY en este despliegue. */
const NO_SEARCH_NOTE =
  "NOTA DEL SISTEMA: ahora mismo la búsqueda web no está disponible. No digas que vas a buscar ni que buscaste; responde con lo que sabes y avisa de que un dato que cambia (precios, versiones, noticias, horarios) puede estar desactualizado.";

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
  /**
   * Documentos adjuntos al ÚLTIMO mensaje del usuario (contratos, informes…). Van aparte del texto
   * del mensaje a propósito: se pegan delante de él solo para la llamada al modelo y NO se archivan
   * en la conversación (allí queda la pregunta y los nombres de los archivos). Los Expertos usan
   * este camino porque su historial sí se persiste en el servidor; Basalt no persiste y los manda
   * dentro del mensaje.
   */
  documents?: DocPayload[];
  /**
   * Fotos adjuntas al ÚLTIMO mensaje del usuario, como data URI (el navegador ya las
   * reescaló; ver src/lib/image-attach.ts). Mismo trato que `documents`: se pegan a la
   * llamada al modelo y NO se archivan — en la conversación queda el nombre, no la foto,
   * que es justo lo que se sacó de `saved_asset` cuando una lista de 4 imágenes pesaba
   * 6 MB. Solo las entienden los modelos con `vision`.
   */
  images?: string[];
  /** Nombres de esas fotos, para que la ficha siga en el historial del servidor. */
  imageNames?: string[];
}

/** Lo que acepta un modelo con visión de OpenRouter, y el tope por imagen y en total. */
const IMAGE_DATA_URI = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/]+=*$/;
const MAX_IMAGES = 2;
const MAX_IMAGE_CHARS = 1_600_000; // ~1,2 MB por foto ya reescalada
const MAX_IMAGES_CHARS = 3_000_000;

/** Descarta lo que no sea una imagen base64 razonable: entra por la red. */
function sanitizeImages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  let left = MAX_IMAGES_CHARS;
  for (const item of raw) {
    if (out.length >= MAX_IMAGES) break;
    if (typeof item !== "string" || item.length > MAX_IMAGE_CHARS || item.length > left) continue;
    if (!IMAGE_DATA_URI.test(item)) continue;
    out.push(item);
    left -= item.length;
  }
  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Método no permitido" });
    return;
  }

  const startedAt = Date.now();
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

  // Antes de cobrar: si el modelo elegido no ve, decirlo en vez de cobrar un mensaje
  // en el que la foto se iba a ignorar en silencio.
  const images = sanitizeImages(body.images);
  if (images.length && !model.vision) {
    const conVista = CHAT_MODELS.filter((m) => m.vision && m.free).map((m) => m.label);
    res.status(400).json({
      ok: false,
      code: "MODEL_HAS_NO_VISION",
      error: `"${model.label}" no puede ver imágenes. Cambia a uno que sí${conVista.length ? ` (gratis: ${conVista.join(", ")})` : ""} y vuelve a enviarla.`,
    });
    return;
  }

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
  } else if (!FREE_LIMIT_EXEMPT_EMAILS.has(user.email ?? "")) {
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

  // Los documentos son DATOS de terceros: se recortan (número y caracteres) y viajan dentro de un
  // bloque <documento> del que no pueden escapar (ver docBlock), con la regla de "no obedecer lo que
  // diga el documento" en el system prompt.
  const docs = sanitizeDocuments(body.documents);
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

  // Añadidos al prompt que decide el servidor, no el cliente:
  //  - las reglas de documentos (el cliente ya las manda cuando hay documentos en el
  //    historial; acá se garantizan para cualquier cliente que mande `documents`);
  //  - el aviso de que no hay búsqueda, porque el prompt del cliente SÍ le dice al
  //    modelo que puede buscar: sin la clave eso lo llevaría a prometer una búsqueda
  //    que nunca ocurre (y a gastar una ronda llamando a una herramienta muerta).
  const extras = [
    docs.length && !(body.systemPrompt ?? "").includes(DOC_RULES_MARKER) ? DOC_ANALYSIS_PROMPT : "",
    TAVILY_API_KEY ? "" : NO_SEARCH_NOTE,
  ].filter(Boolean);
  const systemPrompt = [body.systemPrompt, ...extras].filter(Boolean).join("\n\n");

  const conAdjuntos = withImages(withDocuments(body.messages, docs), images);
  const messages: ChatMessage[] = systemPrompt
    ? [{ role: "system", content: systemPrompt }, ...conAdjuntos]
    : conAdjuntos;

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
        // El modelo decide solo si usa una herramienta (tool_choice:"auto")
        // — el prompt le dice cuándo tiene sentido cada una. `withTools` se
        // apaga en la última ronda permitida (ver MAX_SEARCH_ROUNDS más
        // abajo) para forzar una respuesta final en vez de seguir
        // encadenando llamadas.
        ...(withTools ? { tools: [...(TAVILY_API_KEY ? [WEB_SEARCH_TOOL] : []), ...USER_DATA_TOOLS], tool_choice: "auto" } : {}),
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

  // Lo que el usuario ve mientras la respuesta se cocina: que está buscando, con qué
  // consulta, qué fuentes trajo y qué se le cobró. Viaja por el mismo SSE; ver
  // src/lib/stream-events.ts para por qué es seguro mezclarlo con los chunks crudos.
  const emit = (event: Parameters<typeof basaltEventLine>[0]) => res.write(basaltEventLine(event));

  interface StreamResult {
    full: string;
    sawAnyContent: boolean;
    finishReason: string | null;
    toolCall: { id: string; name: string; argsText: string } | null;
    timedOut: boolean;
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
    let timedOut = false;

    try {
      while (true) {
        const remaining = STREAM_DEADLINE_MS - (Date.now() - startedAt);
        if (remaining <= 0) { timedOut = true; break; }
        let timer: ReturnType<typeof setTimeout> | undefined;
        const next = await Promise.race([
          reader.read(),
          new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), remaining); }),
        ]);
        clearTimeout(timer);
        if (next === null) { timedOut = true; break; }
        const { done, value } = next;
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
    if (timedOut) void reader.cancel().catch(() => {});

    return {
      full,
      sawAnyContent,
      finishReason,
      toolCall: toolCallId && toolCallName ? { id: toolCallId, name: toolCallName, argsText: toolArgsText } : null,
      timedOut,
    };
  }

  // Antes se permitía UNA sola llamada a herramienta por respuesta (cortaba
  // duro después de la primera vuelta) — si Tavily no traía lo que hacía
  // falta a la primera, el modelo se quedaba con resultados incompletos en
  // vez de reformular y buscar nuevamente. Ahora encadena hasta
  // MAX_TOOL_ROUNDS rondas (búsqueda y/o las herramientas de datos del
  // usuario, en cualquier combinación); en la última ya no se vuelve a
  // ofrecer ninguna herramienta, para forzar una respuesta final
  // (2026-09-29, pedido: "búsqueda web más fuerte" + herramientas de datos).
  const MAX_TOOL_ROUNDS = 3;

  let full = "";
  let sawAnyContent = false;
  let currentMessages: ChatMessage[] = messages;
  let cutForTime = false;

  try {
    let current = await streamAndCollect(upstream);
    full = current.full;
    sawAnyContent = current.sawAnyContent;
    cutForTime = current.timedOut;

    let toolRound = 0;
    while (
      !cutForTime &&
      current.finishReason === "tool_calls" &&
      current.toolCall &&
      (current.toolCall.name === "web_search" || isUserDataToolName(current.toolCall.name)) &&
      toolRound < MAX_TOOL_ROUNDS
    ) {
      toolRound++;
      const toolCall = current.toolCall;
      let toolResultContent: string;

      if (toolCall.name === "web_search") {
        let searchQuery = "";
        try {
          searchQuery = String(JSON.parse(toolCall.argsText || "{}").query || "");
        } catch {
          /* argumentos truncados o inválidos — se trata como consulta vacía */
        }

        let searchCreditCharged = false;
        let fuentes: SearchSource[] = [];
        if (searchQuery) emit({ type: "search", query: searchQuery });
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
              fuentes = results.filter((r) => r.url).map((r) => ({ title: r.title, url: r.url }));
              toolResultContent = JSON.stringify({ query: searchQuery, results });
            } catch {
              await refundCredits(user.userId, SEARCH_TOOL_COST);
              searchCreditCharged = false;
              toolResultContent = JSON.stringify({ query: searchQuery, results: [], note: "búsqueda no disponible en este momento" });
            }
          }
        }
        if (searchCreditCharged) await logSpend(user.userId, SEARCH_TOOL_COST, `search ${toolRound}: ${searchQuery.slice(0, 60)}`);
        if (searchQuery) {
          // Se manda también cuando no hubo fuentes (fallo o sin créditos): el cliente
          // tiene que poder apagar el "buscando…" en vez de dejarlo colgado.
          emit({ type: "sources", query: searchQuery, sources: fuentes, credits: searchCreditCharged ? SEARCH_TOOL_COST : 0 });
        }
      } else {
        // Herramientas de datos del usuario — solo lectura, sin costo (ver
        // el comentario al tope de api/_lib/userDataTools.ts).
        emit({ type: "account", tool: toolCall.name });
        try {
          if (toolCall.name === "get_my_projects") {
            const rows = await getUserProjects(user.userId);
            toolResultContent = JSON.stringify({ projects: rows.map((p) => ({ name: p.name, updatedAt: p.updatedAt })) });
          } else if (toolCall.name === "get_my_assets") {
            const rows = await getUserAssets(user.userId);
            toolResultContent = JSON.stringify({ assets: rows.map((a) => ({ type: a.type, prompt: a.prompt, createdAt: a.createdAt })) });
          } else {
            const usage = await getUserUsage(user.userId);
            toolResultContent = JSON.stringify(usage ?? { note: "no se pudo obtener la información de la cuenta en este momento" });
          }
        } catch {
          toolResultContent = JSON.stringify({ note: "no se pudo obtener la información en este momento" });
        }
      }

      currentMessages = [
        ...currentMessages,
        {
          role: "assistant",
          content: null,
          tool_calls: [{ id: toolCall.id, type: "function", function: { name: toolCall.name, arguments: toolCall.argsText } }],
        },
        { role: "tool", tool_call_id: toolCall.id, content: toolResultContent },
      ];

      // Solo se vuelve a ofrecer herramientas si todavía queda margen — la
      // última ronda permitida fuerza una respuesta final en vez de
      // encadenar otra llamada más.
      const offerToolsAgain = toolRound < MAX_TOOL_ROUNDS;
      // Sin margen para una vuelta más al modelo: se corta acá en vez de dejar
      // que Vercel mate la función a mitad de la respuesta.
      if (STREAM_DEADLINE_MS - (Date.now() - startedAt) < 6_000) { cutForTime = true; break; }
      try {
        const upstreamNext = await callOpenRouter(currentMessages, offerToolsAgain);
        if (!upstreamNext.ok || !upstreamNext.body) break;
        current = await streamAndCollect(upstreamNext);
        full += current.full;
        sawAnyContent = sawAnyContent || current.sawAnyContent;
        cutForTime = current.timedOut;
      } catch {
        /* la respuesta previa ya se streameó — si esta vuelta falla, el
           usuario se queda con lo que ya vio en vez de perder todo. */
        break;
      }
    }
  } finally {
    if (cutForTime) {
      res.write(`data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "length" }] })}\n\n`);
      res.write("data: [DONE]\n\n");
    }
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
      // Solo los nombres: el texto de los documentos no se guarda (ver ChatBody.documents).
      attachmentNames: [...docs.map((d) => d.name), ...imageNames(body.imageNames, images.length)],
      assistantText: full,
      model: modelId,
      cost,
    });
  } catch (err) {
    console.error("[ai/chat] No se pudo persistir la conversación:", err);
  }
}

/**
 * Pega los documentos delante del último mensaje del usuario, en una COPIA: `body.messages` sigue
 * intacto para persistConversation, que es lo que archiva el texto del usuario.
 */
function withDocuments(messages: ChatMessage[], docs: DocPayload[]): ChatMessage[] {
  if (!docs.length) return messages;
  const i = messages.map((m) => m.role).lastIndexOf("user");
  if (i < 0) return messages;
  const original = messages[i];
  const text = textOf(original.content);
  const blocks = docs.map(docBlock).join("\n\n");
  const copy = [...messages];
  copy[i] = { ...original, content: `${blocks}\n\n${text}` };
  return copy;
}

/** El texto de un contenido que puede venir ya en partes (texto + imágenes). */
function textOf(content: ChatMessage["content"]): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.filter((p) => p.type === "text").map((p) => p.text ?? "").join("\n");
}

/**
 * Convierte el último mensaje del usuario a contenido multimodal: su texto más una parte
 * por foto. Va DESPUÉS de withDocuments para que el texto que llega acá ya incluya los
 * bloques <documento> — antes, con una imagen y un documento en el mismo mensaje, el
 * `typeof content === "string"` de withDocuments descartaba el texto del usuario.
 */
function withImages(messages: ChatMessage[], images: string[]): ChatMessage[] {
  if (!images.length) return messages;
  const i = messages.map((m) => m.role).lastIndexOf("user");
  if (i < 0) return messages;
  const original = messages[i];
  const copy = [...messages];
  copy[i] = {
    ...original,
    content: [
      { type: "text", text: textOf(original.content) },
      ...images.map((url) => ({ type: "image_url", image_url: { url } })),
    ],
  };
  return copy;
}

/** Nombres de las fotos para el historial: solo los que de verdad acompañan a una imagen. */
function imageNames(raw: unknown, count: number): string[] {
  const names = Array.isArray(raw) ? raw.filter((n): n is string => typeof n === "string") : [];
  return Array.from({ length: count }, (_, i) => (names[i] || `imagen ${i + 1}`).slice(0, 200));
}

async function persistConversation(opts: {
  userId: string;
  assistantId?: string;
  conversationId?: string;
  projectId?: string;
  userMessage: ChatMessage;
  attachmentNames?: string[];
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

  const plain = typeof opts.userMessage.content === "string" ? opts.userMessage.content : JSON.stringify(opts.userMessage.content);
  // Deja constancia de qué adjuntó sin guardar el contenido: si no, el archivo del historial queda
  // con preguntas ("¿qué riesgos tiene?") sin nada a qué se refieren.
  const userText = opts.attachmentNames?.length
    ? `${plain}\n\n[Documentos adjuntos (no se guarda su contenido): ${opts.attachmentNames.join(", ")}]`
    : plain;
  await db.insert(schema.message).values([
    { id: crypto.randomUUID(), conversationId, role: "user", content: userText },
    { id: crypto.randomUUID(), conversationId, role: "assistant", content: opts.assistantText, model: opts.model, costCredits: opts.cost },
  ]);
}
