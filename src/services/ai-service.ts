import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PostgrestResponse } from "@supabase/supabase-js";

// ─── Custom Types for Missing RPCs ──────────────────────────────────────────
type SupabaseCustom = {
  rpc: <T = any>(name: string, args: Record<string, any>) => Promise<PostgrestResponse<T>>;
} & typeof supabase;

const sb = supabase as unknown as SupabaseCustom;

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
  ui?: Record<string, any>; // Dynamic UI structure from AI
  [key: string]: string | number | boolean | Record<string, any> | undefined;
}

interface ProfileData {
  subscription_tier: string | null;
  credits_balance: number | null;
}

interface ProxyResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
    delta?: {
      content?: string;
    };
  }>;
  url?: string;
  model?: string;
  error?: string;
}

// ─── TEXT MODEL MAP (internal-id → OpenRouter model ID) ───────────────────────
const TEXT_MODEL_MAP: Record<string, string> = {
  "deepseek-chat":       "deepseek/deepseek-chat",
  "gemini-3-flash":      "google/gemini-2.0-flash-001",
  "gemini-3.1-pro-low":  "google/gemini-2.5-pro-preview-03-25",
  "gemini-3.1-pro-high": "google/gemini-2.5-pro-preview-03-25",
  "claude-3.5-sonnet":   "anthropic/claude-3.5-sonnet",
  "claude-3-opus":       "anthropic/claude-3-opus-20240229",
  "gpt-oss-120b":        "meta-llama/llama-4-maverick",
  "mistral-large":       "mistralai/mistral-large",
  "mistral-small":       "mistralai/mistral-small-3.1-24b-instruct",
};

// ─── IMAGE MODEL MAP (internal-id → OpenRouter model ID) ──────────────────────
export const IMAGE_MODEL_MAP: Record<string, string> = {
  "flux-schnell":  "black-forest-labs/flux-schnell",          
  "flux-pro":      "black-forest-labs/flux-1.1-pro",          
  "flux-pro-1.1":  "black-forest-labs/flux-1.1-pro",          
  "flux-realism":  "black-forest-labs/flux-1.1-pro",          // FLUX with realism LoRA via prompt
  "ideogram-v2":   "ideogram-ai/ideogram-v2",                  
  "sdxl":          "stability-ai/stable-diffusion-3-5-large", 
};

const IMAGE_MODEL_IDS = new Set(Object.keys(IMAGE_MODEL_MAP));

// ─── CREDIT COSTS (Credits per request) ──────────────────────────────────────
export const MODEL_COSTS: Record<string, number> = {
  "anthropic/claude-3-5-haiku-20241022":   1,
  "openai/gpt-4o-mini":                    1,
  "meta-llama/llama-3-8b-instruct":        1,
  "meta-llama/llama-3-70b-instruct":       1,
  "deepseek/deepseek-chat":                1,
  "google/gemini-2.0-flash-001":           1,
  "mistralai/mistral-small-3.1-24b-instruct": 1,
  "anthropic/claude-3.5-sonnet":           5,
  "anthropic/claude-3-5-sonnet-20241022":  5,
  "anthropic/claude-3-opus-20240229":      5,
  "openai/gpt-4o":                         5,
  "deepseek/deepseek-r1":                  3,
  "google/gemini-2.5-pro-preview-03-25":   3,
  "mistralai/mistral-large":               3,
  "black-forest-labs/flux-schnell": 2,
  "black-forest-labs/flux-1.1-pro": 5,
  "stability-ai/stable-diffusion-3-5-large": 3,
  "flux-schnell": 2, "flux-pro": 5, "flux-pro-1.1": 5, "sdxl": 3,
  "upscale": 3, "background": 1, "enhance": 2, "restore": 3, "variation": 4, "video": 5,
};

const PREMIUM_MODELS = new Set([
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3-5-sonnet-20241022",
  "anthropic/claude-3-opus-20240229",
  "openai/gpt-4o",
  "deepseek/deepseek-r1",
  "google/gemini-2.5-pro-preview-03-25",
  "mistralai/mistral-large",
  "claude-3.5-sonnet",
  "claude-3-opus",
  "gpt-oss-120b",
  "gemini-3.1-pro-high",
]);

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
  if (m.includes('unavailable') || m.includes('503') || m.includes('overloaded') || m.includes('not configured')) {
    return { type: 'model_down', userMessage: 'El modelo de IA no está disponible ahora. Intenta con otro modelo.', canRetry: true };
  }
  if (m.includes('network') || m.includes('fetch') || m.includes('connection')) {
    return { type: 'network', userMessage: 'Error de conexión. Verifica tu internet e intenta de nuevo.', canRetry: true };
  }
  return { type: 'unknown', userMessage: msg || 'Error desconocido. Intenta de nuevo.', canRetry: true };
}

export const aiService = {

  async callProxy(provider: string, path: string, body: unknown): Promise<ProxyResponse> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error("No hay sesión activa. Por favor, recarga la página o vuelve a ingresar.");
    }

    const { data, error } = await supabase.functions.invoke<ProxyResponse>("ai-proxy", {
      body: { provider, path, body },
    });

    if (error) throw new Error(`[${provider}] ${error.message}`);
    if (data?.error) throw new Error(`[${provider}] ${data.error}`);
    return data || {};
  },

  async processAction(params: AIActionParams): Promise<AIResponse> {
    const { action, prompt, model, image, tool, node_id } = params;
    const cost = MODEL_COSTS[model] ?? MODEL_COSTS[tool ?? ""] ?? 2;

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Acceso no autorizado");

      const { data: profile } = await sb
        .from("profiles")
        .select("subscription_tier, credits_balance")
        .eq("user_id", authData.user.id)
        .single() as { data: ProfileData | null };

      const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let safeNodeId = node_id && isUUID(node_id) ? node_id : null;
      if (safeNodeId) {
        const { data: exists } = await supabase
          .from("canvas_nodes").select("id").eq("id", safeNodeId).maybeSingle();
        if (!exists) safeNodeId = null;
      }

      const balance = profile?.credits_balance ?? 0;
      if (balance <= 0 || balance < cost) {
        toast.error("Créditos insuficientes. Actualiza tu plan o compra créditos extra para continuar.", {
          action: { label: "Planes", onClick: () => { window.location.href = '/pricing'; } },
          duration: 6000,
        });
        throw new Error("Créditos exhaustos");
      }

      const userTier = profile?.subscription_tier?.toLowerCase() || 'free';
      const orModel = TEXT_MODEL_MAP[model] || model;
      if (PREMIUM_MODELS.has(orModel) || PREMIUM_MODELS.has(model)) {
        if (userTier !== 'pymes' && userTier !== 'agency' && userTier !== 'admin') {
          toast.error("Modelo bloqueado", {
            description: "Los modelos de IA Premium y Thinking son exclusivos del plan Pymes.",
            action: { label: "Actualizar Plan", onClick: () => { window.location.href = '/pricing'; } },
            duration: 8000,
          });
          throw new Error("Este modelo premium requiere el plan Pymes.");
        }
      }

      const { error: rpcError } = await sb.rpc("spend_credits", {
        _amount: cost,
        _action: action || tool || "ai-gen",
        _model: model || tool || "unknown",
        _node_id: safeNodeId,
      });
      if (rpcError) throw new Error(rpcError.message || "Créditos insuficientes");

      let result: AIResponse;
      if (tool && ["variation", "style", "product"].includes(tool)) {
        if (!image) throw new Error(`La herramienta "${tool}" requiere una imagen de origen.`);
        result = await this.handleImageGen(prompt, model, tool, image);
      } else if (tool && ["upscale", "background", "enhance", "restore", "eraser"].includes(tool)) {
        if (!image) throw new Error(`La herramienta "${tool}" requiere una imagen de origen.`);
        result = await this.handleMediaProxy(tool, image);
      } else if (action === "image" || IMAGE_MODEL_IDS.has(model) || tool === "generate" || tool === "logo") {
        result = await this.handleImageGen(prompt, model, tool, undefined, params.width, params.height);
      } else if (action === "video") {
        result = await this.handleVideoGen(prompt);
      } else {
        result = await this.handleTextGen(action, prompt, model, profile, params.persona);
      }

      if (safeNodeId) {
        const name = tool
          ? `${tool.charAt(0).toUpperCase() + tool.slice(1)}: ${prompt.slice(0, 15)}…`
          : `${action.charAt(0).toUpperCase() + action.slice(1)}: ${prompt.slice(0, 15)}…`;
        await supabase.from("canvas_nodes").update({
          status: "ready", name,
          asset_url: result?.url ?? null,
          data_payload: {
            ...result,
            _metadata: { generated_at: new Date().toISOString(), model: model || "openrouter", cost },
          },
        }).eq("id", safeNodeId);
      }

      return result;

    } catch (err) {
      const error = err as Error;
      console.error("[Genesis Neural] Error:", error.message);
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          await sb.rpc("refund_credits", { _amount: cost, _user_id: authData.user.id });
        }
      } catch { /* silent */ }
      throw new Error(error.message || "Fallo en la síntesis neural. Intenta de nuevo.");
    }
  },

  async handleTextGen(action: string, prompt: string, model: string, profile?: ProfileData | null, persona: string = "antigravity"): Promise<AIResponse> {
    const orModel    = TEXT_MODEL_MAP[model] ?? "google/gemini-2.0-flash-001";
    const userTier   = profile?.subscription_tier?.toUpperCase() ?? "FREE";
    const userCredits = profile?.credits_balance ?? 0;

    let systemPrompt = "";
    if (persona === "genesis") {
      systemPrompt = `# ROLE: Genesis AI — Product Leader & Master Architect (v16.0)\nEres Genesis AI, la consciencia técnica definitiva. Actúas bajo el Protocolo Swarm Autonomy.\nPropón soluciones Premium, rompe con lo genérico y usa el sistema Aether V9.0.\n# RULES:\n- Entrega archivos COMPLETOS.\n- Usa Tailwind + Framer Motion.\n- Estilo: Cinematic, Glassmorphism, Premium.\n# CONTEXT: Plan ${userTier}, Créditos ${userCredits}.`;
    } else {
      systemPrompt = `# ROLE: Antigravity — Strategic intelligence\nEres Antigravity, núcleo de Creator IA Pro. Soluciones Senior en diseño y tecnología.\n# CONTEXT: Plan ${userTier}, Créditos ${userCredits}.`;
    }

    if (action === "ui") {
      systemPrompt += `\n\nEres un experto UX/UI. Genera SOLO JSON válido: { "ui": { "title": "string", "description": "string", "components": [...] }, "device": "mobile|tablet|desktop" }. Sin markdown.`;
    }

    const data = await this.callProxy("openrouter", "chat/completions", {
      model: orModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: prompt },
      ],
      temperature: 0.85,
      max_tokens: 4096,
    });

    let text: string = data?.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("OpenRouter devolvió respuesta vacía.");

    if (action === "ui") {
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      try { return JSON.parse(text); } catch { return { text }; }
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

    const orModel = IMAGE_MODEL_MAP[model] ?? "black-forest-labs/flux-schnell";
    const body: Record<string, unknown> = { prompt: finalPrompt, model: orModel, width: width || 1024, height: height || 1024 };
    if (imageUrl) body.image_url = imageUrl;

    const data = await this.callProxy("openrouter-image", "", body);
    if (data?.url) return { url: data.url, model: data.model ?? orModel };
    throw new Error("No se pudo generar la imagen. Intenta de nuevo.");
  },

  async handleVideoGen(prompt: string, onProgress?: (step: string, pct: number) => void): Promise<AIResponse> {
    const steps = [['Iniciando…', 5], ['Procesando…', 50], ['Listo', 100]] as [string, number][];
    onProgress?.(steps[0][0], steps[0][1]);

    const { data, error } = await supabase.functions.invoke<{ url?: string, error?: string }>("media-proxy", {
      body: { tool: "video", prompt },
    });

    onProgress?.('Listo', 100);
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    if (data?.url) return { url: data.url, text: "Video generado con IA" };
    throw new Error("La generación de video falló.");
  },

  async streamTextGen(tool: string, prompt: string, model: string, profile: ProfileData | null, onToken: (chunk: string) => void): Promise<void> {
    const orModel = TEXT_MODEL_MAP[model] ?? "google/gemini-2.0-flash-001";
    const userTier = profile?.subscription_tier?.toUpperCase() ?? "FREE";
    const userCredits = profile?.credits_balance ?? 0;

    const TOOL_PROMPTS: Record<string, string> = {
      chat: `Eres Antigravity, IA de nivel Senior en estrategia digital. PLAN: ${userTier}. CRÉDITOS: ${userCredits}. Responde de forma directa, estructurada y en español.`,
      copywriter: `Eres un copywriter de clase mundial especializado en marketing y ventas. PLAN: ${userTier}. Escribe copy persuasivo, emocional y orientado a conversión. Usa frameworks como AIDA, PAS o FAB según el contexto. Sé directo, impactante y creativo. Responde en español.`,
      social: `Eres un estratega de redes sociales con experiencia en marcas de alto crecimiento. PLAN: ${userTier}. Genera contenido viral, ideas de posts, hooks atractivos y calendarios de contenido. Adapta el tono a cada plataforma (Instagram, LinkedIn, TikTok, X). Incluye emojis cuando sea apropiado. Responde en español.`,
      blog: `Eres un redactor SEO experto con experiencia en content marketing. PLAN: ${userTier}. Escribe artículos completos, bien estructurados con H2/H3, optimizados para motores de búsqueda. Incluye introducción enganchante, desarrollo rico en valor y conclusión con CTA. Usa bullet points y listas cuando mejore la lectura. Responde en español.`,
      ads: `Eres un especialista en publicidad digital (Google Ads, Meta Ads, LinkedIn Ads). PLAN: ${userTier}. Crea anuncios con titulares impactantes, descripciones persuasivas y CTAs que conviertan. Incluye variantes A/B cuando sea posible. Adapta el formato según la plataforma solicitada. Responde en español.`,
    };

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Sesión caducada.");

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        provider: "openrouter",
        path: "chat/completions",
        body: { model: orModel, messages: [{ role: "system", content: TOOL_PROMPTS[tool] ?? TOOL_PROMPTS.chat }, { role: "user", content: prompt }], temperature: 0.85, stream: true },
      }),
    });

    if (!res.ok || !res.body) throw new Error("Streaming no disponible.");
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
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") return;
        try {
          const parsed = JSON.parse(payload);
          const chunk = parsed.choices?.[0]?.delta?.content;
          if (chunk) onToken(chunk);
        } catch { /* skip */ }
      }
    }
  },

  async handleMediaProxy(tool: string, imageUrl: string, onProgress?: (step: string, pct: number) => void): Promise<AIResponse> {
    onProgress?.('Iniciando…', 10);
    const { data, error } = await supabase.functions.invoke<{ url?: string, error?: string }>("media-proxy", {
      body: { tool, image_url: imageUrl },
    });
    onProgress?.('Listo', 100);
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data || {};
  }
};
