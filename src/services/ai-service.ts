// Motor de IA para /tools y Canvas IA — antes llamaba a las Edge Functions de
// Supabase (ai-proxy/media-proxy) usando un access_token de supabase.auth, que
// dejó de existir con la migración a better-auth Y cuyo proyecto de Supabase
// además está pausado (DNS no resuelve). Ahora usa /api/ai/chat y /api/ai/image
// (cobro de créditos atómico en el servidor — ver docs/PLAN_REFACTOR_GENESIS.md).
// ─── TYPES & INTERFACES ───────────────────────────────────────────────────────

export type ErrorType = 'credits' | 'rate_limit' | 'timeout' | 'model_down' | 'network' | 'unknown';

export interface ClassifiedError {
  type: ErrorType;
  userMessage: string;
  canRetry: boolean;
}

export interface AIActionParams {
  action: "ui" | "image" | "video" | "chat";
  prompt: string;
  model: string;
  image?: string;
  tool?: string;
  node_id?: string;
  persona?: "antigravity" | "genesis";
  width?: number;
  height?: number;
  onProgress?: (step: string, pct: number) => void;
}

export interface AIResponse {
  text?: string;
  url?: string;
  model?: string;
  ui?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ProfileData {
  subscription_tier: string | null;
  credits_balance: number | null;
}

// ─── MODEL MAPS (ids "de vitrina" cortos, usados por los nodos de Canvas IA
// y por ToolLanding → id real del catálogo canónico src/lib/ai/models.ts,
// que es la fuente de verdad de modelos vivos y sus créditos). Si agregas un
// id de vitrina nuevo, el valor DEBE ser un id que exista hoy en CHAT_MODELS/
// IMAGE_MODELS — si no, /api/ai/chat lo rechaza y cae en silencio al modelo
// gratis por defecto (ver api/ai/chat.ts getModel()).
const TEXT_MODEL_MAP: Record<string, string> = {
  "deepseek-chat":       "deepseek/deepseek-chat-v3.1",
  "gemini-3-flash":      "google/gemini-2.5-flash-lite",
  "gemini-3.1-pro-low":  "google/gemini-2.5-flash",
  "gemini-3.1-pro-high": "anthropic/claude-sonnet-4.5",
  "claude-3.5-sonnet":   "anthropic/claude-sonnet-4.5",
  "claude-3-opus":       "anthropic/claude-opus-4.5",
  "gpt-oss-120b":        "openai/gpt-oss-120b",
  "mistral-large":       "google/gemini-2.5-flash",
  "mistral-small":       "google/gemini-2.5-flash-lite",
};

// 2026-09-09: Flux/Replicate sin saldo (ver nota en src/lib/ai/models.ts) —
// todos los ids "de vitrina" legacy caen ahora al único modelo activo
// (OpenRouter). Se conservan las keys para no romper llamadores viejos que
// todavía manden estos ids cortos.
export const IMAGE_MODEL_MAP: Record<string, string> = {
  "flux-schnell":  "gemini-flash-image",
  "flux-pro":      "gemini-flash-image",
  "flux-pro-1.1":  "gemini-flash-image",
  "flux-realism":  "gemini-flash-image",
  "ideogram-v2":   "gemini-flash-image",
  "sdxl":          "gemini-flash-image",
};

// ─── ERROR CLASSIFIER ─────────────────────────────────────────────────────────
export function classifyError(msg: string): ClassifiedError {
  const m = msg.toLowerCase();
  if (m.includes('crédito') || m.includes('credit') || m.includes('insufficient') || m.includes('balance')) {
    return { type: 'credits', userMessage: 'Créditos insuficientes. Recarga tu plan para continuar.', canRetry: false };
  }
  if (m.includes('rate limit') || m.includes('demasiadas') || m.includes('429')) {
    return { type: 'rate_limit', userMessage: 'Demasiadas solicitudes. Espera un momento y vuelve a intentarlo.', canRetry: true };
  }
  if (m.includes('timeout') || m.includes('tardó') || m.includes('too long')) {
    return { type: 'timeout', userMessage: 'La IA tardó demasiado. Tus créditos fueron reembolsados.', canRetry: true };
  }
  if (m.includes('unavailable') || m.includes('503') || m.includes('overloaded') || m.includes('not configured') || m.includes('no configurad')) {
    return { type: 'model_down', userMessage: 'El modelo de IA no está disponible ahora. Intenta con otro modelo.', canRetry: true };
  }
  if (m.includes('network') || m.includes('fetch') || m.includes('connection')) {
    return { type: 'network', userMessage: 'Error de conexión. Verifica tu internet e intenta de nuevo.', canRetry: true };
  }
  return { type: 'unknown', userMessage: msg || 'Error desconocido. Intenta de nuevo.', canRetry: true };
}

async function readErrorBody(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.error || `Error ${res.status}`;
}

export const aiService = {
  async processAction(params: AIActionParams): Promise<AIResponse> {
    const { action, prompt, model, image, tool, width, height, persona } = params;

    if (tool && ["upscale", "background", "enhance", "restore", "eraser"].includes(tool)) {
      throw new Error(`"${tool}" está temporalmente deshabilitada mientras se migra su motor de edición. Vuelve pronto.`);
    }

    if (tool && ["variation", "style", "product"].includes(tool)) {
      if (!image) throw new Error(`La herramienta "${tool}" requiere una imagen de origen.`);
      return this.handleImageGen(prompt, model, tool, image, width, height);
    }
    if (action === "image" || tool === "generate" || tool === "logo") {
      return this.handleImageGen(prompt, model, tool, undefined, width, height);
    }
    if (action === "video") {
      return this.handleVideoGen(prompt);
    }
    return this.handleTextGen(action, prompt, model, undefined, persona);
  },

  async handleTextGen(action: string, prompt: string, model: string, _profile?: ProfileData | null, persona: string = "antigravity"): Promise<AIResponse> {
    const orModel = TEXT_MODEL_MAP[model] ?? model;
    let systemPrompt = persona === "genesis"
      ? "Eres Genesis AI, arquitecto de producto senior. Responde en español, directo y accionable."
      : "Eres el Asistente de Editor, núcleo de inteligencia estratégica de Creator IA Pro. Responde en español, directo y accionable.";
    if (action === "ui") {
      systemPrompt += `\n\nEres un experto UX/UI. Genera SOLO JSON válido: { "ui": { "title": "string", "description": "string", "components": [...] }, "device": "mobile|tablet|desktop" }. Sin markdown.`;
    }

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: orModel,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
        temperature: 0.85,
      }),
    });
    if (!res.ok || res.headers.get("content-type")?.includes("application/json")) {
      throw new Error(await readErrorBody(res));
    }

    const text = await consumeChatStream(res);
    if (!text) throw new Error("El modelo devolvió una respuesta vacía.");

    if (action === "ui") {
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      try { return JSON.parse(cleaned); } catch { return { text }; }
    }
    return { text };
  },

  async handleImageGen(prompt: string, model: string, tool?: string, imageUrl?: string, width?: number, height?: number): Promise<AIResponse> {
    let finalPrompt = prompt;
    if (tool === "logo") {
      finalPrompt = `${prompt}, professional logo design, clean vector style, minimalist, white background, brand identity, masterpiece, crisp lines`;
    } else if (tool === "generate") {
      finalPrompt = `${prompt}, masterpiece, best quality, highly detailed, high resolution, photorealistic, 8k, cinematic lighting`;
    } else if (tool === "variation" || tool === "style" || tool === "product") {
      finalPrompt = prompt || `Apply ${tool} transformation to this image, masterpiece, best quality`;
    }

    const imageModel = IMAGE_MODEL_MAP[model] ?? "gemini-flash-image";
    const aspectRatio = toAspectRatio(width, height);

    const res = await fetch("/api/ai/image", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: finalPrompt, model: imageModel, aspectRatio, imagePrompt: imageUrl }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) throw new Error(data?.error || `Error ${res.status} generando la imagen`);
    if (data.imageUrl) return { url: data.imageUrl, model: data.model ?? imageModel };
    throw new Error("No se pudo generar la imagen. Intenta de nuevo.");
  },

  async handleVideoGen(_prompt: string): Promise<AIResponse> {
    throw new Error("La generación de video está temporalmente deshabilitada mientras se migra su motor. Vuelve pronto.");
  },

  async streamTextGen(tool: string, prompt: string, model: string, profile: ProfileData | null, onToken: (chunk: string) => void): Promise<void> {
    const orModel = TEXT_MODEL_MAP[model] ?? model;
    const userTier = profile?.subscription_tier?.toUpperCase() ?? "FREE";

    const TOOL_PROMPTS: Record<string, string> = {
      chat: `Eres el Asistente de Creator IA Pro, IA de nivel Senior en estrategia digital. PLAN: ${userTier}. Responde de forma directa, estructurada y en español.`,
      copywriter: `Eres un copywriter de clase mundial especializado en marketing y ventas. PLAN: ${userTier}. Escribe copy persuasivo, emocional y orientado a conversión. Usa frameworks como AIDA, PAS o FAB según el contexto. Sé directo, impactante y creativo. Responde en español.`,
      social: `Eres un estratega de redes sociales con experiencia en marcas de alto crecimiento. PLAN: ${userTier}. Genera contenido viral, ideas de posts, hooks atractivos y calendarios de contenido. Adapta el tono a cada plataforma (Instagram, LinkedIn, TikTok, X). Incluye emojis cuando sea apropiado. Responde en español.`,
      blog: `Eres un redactor SEO experto con experiencia en content marketing. PLAN: ${userTier}. Escribe artículos completos, bien estructurados con H2/H3, optimizados para motores de búsqueda. Incluye introducción enganchante, desarrollo rico en valor y conclusión con CTA. Usa bullet points y listas cuando mejore la lectura. Responde en español.`,
      ads: `Eres un especialista en publicidad digital (Google Ads, Meta Ads, LinkedIn Ads). PLAN: ${userTier}. Crea anuncios con titulares impactantes, descripciones persuasivas y CTAs que conviertan. Incluye variantes A/B cuando sea posible. Adapta el formato según la plataforma solicitada. Responde en español.`,
    };

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: orModel,
        messages: [{ role: "system", content: TOOL_PROMPTS[tool] ?? TOOL_PROMPTS.chat }, { role: "user", content: prompt }],
        temperature: 0.85,
      }),
    });

    if (!res.ok || res.headers.get("content-type")?.includes("application/json")) {
      throw new Error(await readErrorBody(res));
    }
    if (!res.body) throw new Error("Streaming no disponible.");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const parsed = JSON.parse(payload);
          const chunk = parsed.choices?.[0]?.delta?.content;
          if (chunk) onToken(chunk);
        } catch { /* fragmento no-JSON, se ignora */ }
      }
    }
  },
};

async function consumeChatStream(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payload);
        const chunk = parsed.choices?.[0]?.delta?.content;
        if (typeof chunk === "string") full += chunk;
      } catch { /* fragmento no-JSON, se ignora */ }
    }
  }
  return full;
}

function toAspectRatio(width?: number, height?: number): string {
  if (!width || !height) return "1:1";
  const candidates: Array<[string, number]> = [
    ["1:1", 1], ["16:9", 16 / 9], ["9:16", 9 / 16], ["3:2", 3 / 2], ["2:3", 2 / 3],
  ];
  const ratio = width / height;
  let best = "1:1";
  let bestDiff = Infinity;
  for (const [name, value] of candidates) {
    const diff = Math.abs(value - ratio);
    if (diff < bestDiff) { bestDiff = diff; best = name; }
  }
  return best;
}
