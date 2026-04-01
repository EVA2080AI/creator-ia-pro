import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
// All slugs verified against OpenRouter's model catalog (Mar 2026)
export const IMAGE_MODEL_MAP: Record<string, string> = {
  "flux-schnell":  "black-forest-labs/flux-schnell",          // Free, fast FLUX
  "flux-pro":      "black-forest-labs/flux-1.1-pro",          // FLUX 1.1 Pro
  "flux-pro-1.1":  "black-forest-labs/flux-1.1-pro",          // alias
  "sdxl":          "stability-ai/stable-diffusion-3-5-large", // SD 3.5
};

// IDs that trigger image generation routing
const IMAGE_MODEL_IDS = new Set(Object.keys(IMAGE_MODEL_MAP));

// ─── CREDIT COSTS (Credits per request) ──────────────────────────────────────
export const MODEL_COSTS: Record<string, number> = {
  // Standard Models (1 crédito) - Disponibles para todos los planes
  "anthropic/claude-3-5-haiku-20241022":   1,
  "openai/gpt-4o-mini":                    1,
  "meta-llama/llama-3-8b-instruct":        1,
  "meta-llama/llama-3-70b-instruct":       1,
  "deepseek/deepseek-chat":                1,
  "google/gemini-2.0-flash-001":           1,
  "mistralai/mistral-small-3.1-24b-instruct": 1,

  // Premium Models (3 - 5 créditos) - EXCLUSIVO PYMES
  "anthropic/claude-3.5-sonnet":           5,
  "anthropic/claude-3-5-sonnet-20241022":  5,
  "anthropic/claude-3-opus-20240229":      5,
  "openai/gpt-4o":                         5,
  "deepseek/deepseek-r1":                  3,
  "google/gemini-2.5-pro-preview-03-25":   3,
  "mistralai/mistral-large":               3,

  // Image Generation (Premium)
  "black-forest-labs/flux-schnell": 2,
  "black-forest-labs/flux-1.1-pro": 5,
  "stability-ai/stable-diffusion-3-5-large": 3,
  "flux-schnell": 2, "flux-pro": 5, "flux-pro-1.1": 5, "sdxl": 3,
  
  // Image editing tools
  "upscale": 3, "background": 1, "enhance": 2, "restore": 3, "variation": 4, "video": 5,
};

// Modelos que requieren el plan Pymes
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

export interface AIActionParams {
  action: "ui" | "image" | "video" | "chat";
  prompt: string;
  model: string;
  image?: string;
  tool?: string;
  node_id?: string;
  onProgress?: (step: string, pct: number) => void;
}

// ─── ERROR CLASSIFIER ─────────────────────────────────────────────────────────
export type ErrorType = 'credits' | 'rate_limit' | 'timeout' | 'model_down' | 'network' | 'unknown';
export interface ClassifiedError {
  type: ErrorType;
  userMessage: string;
  canRetry: boolean;
}

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

  // ─── SINGLE PROXY CALL — all AI traffic goes through here ────────────────────
  async callProxy(provider: string, path: string, body: unknown) {
    // Proactively fetch/refresh the token before invoking the edge function 
    // to prevent 401 (Invalid JWT)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error("No hay sesión activa. Por favor, recarga la página o vuelve a ingresar.");
    }

    const { data, error } = await supabase.functions.invoke("ai-proxy", {
      body: { provider, path, body },
    });
    if (error) throw new Error(`[${provider}] ${error.message}`);
    if ((data as any)?.error) throw new Error(`[${provider}] ${(data as any).error}`);
    return data as any;
  },

  // ─── ENTRY POINT ─────────────────────────────────────────────────────────────
  async processAction(params: AIActionParams) {
    const { action, prompt, model, image, tool, node_id } = params;
    const cost = MODEL_COSTS[model] ?? MODEL_COSTS[tool ?? ""] ?? 2;

    try {
      // 1. Auth check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Acceso no autorizado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier, credits_balance")
        .eq("user_id", user.id)
        .single();

      // 2. Validate canvas node
      const isUUID = (id: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let safeNodeId = node_id && isUUID(node_id) ? node_id : null;
      if (safeNodeId) {
        const { data: exists } = await supabase
          .from("canvas_nodes").select("id").eq("id", safeNodeId).maybeSingle();
        if (!exists) safeNodeId = null;
      }

      // 2b. Smart credit warning and zero balance guard
      const balance = profile?.credits_balance ?? 0;
      if (balance <= 0 || balance < cost) {
        toast.error("Créditos insuficientes. Actualiza tu plan o compra créditos extra para continuar.", {
          action: { label: "Planes", onClick: () => { window.location.href = '/pricing'; } },
          duration: 6000,
        });
        throw new Error("Créditos exhaustos");
      }

      // 2c. Validar permisos de modelos premium (Solo plan Pymes)
      const userTier = profile?.subscription_tier?.toLowerCase() || 'free';
      const orModel = TEXT_MODEL_MAP[model] || model;
      if (PREMIUM_MODELS.has(orModel) || PREMIUM_MODELS.has(model)) {
        if (userTier !== 'pymes' && userTier !== 'agency' && userTier !== 'admin') {
          toast.error("Modelo bloqueado", {
            description: "Los modelos de IA Premium y Thinking (ej. Claude 3.5 Sonnet, GPT-4o) son exclusivos del plan Pymes.",
            action: { label: "Actualizar Plan", onClick: () => { window.location.href = '/pricing'; } },
            duration: 8000,
          });
          throw new Error("Este modelo premium requiere el plan Pymes.");
        }
      }
      if (balance < 50) {
        toast.warning(`Solo te quedan ${balance} créditos. ¡Recarga pronto!`, {
          action: { label: "Actualizar", onClick: () => { window.location.href = '/pricing'; } },
          duration: 5000,
          id: 'low-credits-warning', // deduplicate toasts
        });
      }

      // 3. Deduct credits
      const { error: rpcError } = await (supabase.rpc as any)("spend_credits", {
        _amount: cost,
        _action: action || tool || "ai-gen",
        _model: model || tool || "unknown",
        _node_id: safeNodeId,
      });
      if (rpcError) throw new Error(rpcError.message || "Créditos insuficientes");

      // 4. Route to correct handler
      let result: any;
      if (tool && ["variation", "style", "product"].includes(tool)) {
        // These use GPT-5 Image Mini with image input (img2img)
        if (!image) throw new Error(`La herramienta "${tool}" requiere una imagen de origen.`);
        result = await this.handleImageGen(prompt, model, tool, image);
      } else if (tool && ["upscale", "background", "enhance", "restore", "eraser"].includes(tool)) {
        if (!image) throw new Error(`La herramienta "${tool}" requiere una imagen de origen.`);
        result = await this.handleMediaProxy(tool, image);
      } else if (action === "image" || IMAGE_MODEL_IDS.has(model) || tool === "generate" || tool === "logo") {
        result = await this.handleImageGen(prompt, model, tool);
      } else if (action === "video") {
        result = await this.handleVideoGen(prompt);
      } else {
        result = await this.handleTextGen(action, prompt, model, profile);
      }

      // 5. Update canvas node if present
      if (safeNodeId) {
        const name = tool
          ? `${tool.charAt(0).toUpperCase() + tool.slice(1)}: ${prompt.slice(0, 15)}…`
          : `${action.charAt(0).toUpperCase() + action.slice(1)}: ${prompt.slice(0, 15)}…`;
        await supabase.from("canvas_nodes").update({
          status: "ready", name,
          asset_url: result.url ?? null,
          data_payload: {
            ...result,
            _metadata: { generated_at: new Date().toISOString(), model: model || "openrouter", cost },
          } as any,
        } as any).eq("id", safeNodeId);
      }

      return result;

    } catch (err: any) {
      console.error("[Creator IA] Error:", err.message);
      // Refund credits on failure
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u) await (supabase.rpc as any)("refund_credits", { _amount: cost, _user_id: u.id });
      } catch { /* silent */ }
      throw new Error(err.message || "Error desconocido. Intenta de nuevo.");
    }
  },

  // ─── TEXT GENERATION — OpenRouter only ───────────────────────────────────────
  async handleTextGen(action: string, prompt: string, model: string, profile?: any) {
    const orModel    = TEXT_MODEL_MAP[model] ?? "google/gemini-2.0-flash-001";
    const userTier   = profile?.subscription_tier?.toUpperCase() ?? "FREE";
    const userCredits = profile?.credits_balance ?? 0;

    let systemPrompt = `# ROLE: Antigravity — High-Performance AI Engine
Eres Antigravity, el núcleo de inteligencia de Creator IA Pro. Proporciona soluciones de nivel Senior en diseño, tecnología y estrategia.

# USER CONTEXT
- PLAN: ${userTier}
- CRÉDITOS: ${userCredits}

# BEHAVIOR
${userTier === "FREE" ? "- Respuestas máx 150 palabras. Añade [Insight Pro] al final de respuestas técnicas.\n- Sin bloques de código extensos." : "- Sin restricciones. Razonamiento completo. Tablas, diagramas Mermaid, docs técnicas."}
${userCredits < 3 ? "⚠️ Créditos bajos — Plan Pro garantiza acceso continuo." : ""}`;

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

  // ─── IMAGE GENERATION — OpenRouter (supports img2img via image_url) ──────────
  async handleImageGen(prompt: string, model: string, tool?: string, imageUrl?: string) {
    let finalPrompt = prompt;
    if (tool === "logo") {
      finalPrompt = `${prompt}, professional logo design, clean vector style, minimalist, white background, sharp edges, brand identity`;
    } else if (tool === "variation") {
      finalPrompt = prompt || "Create a creative variation of this image, keep the subject but change style or composition";
    } else if (tool === "style") {
      finalPrompt = prompt || "Apply an artistic painterly style to this image while keeping the original composition and subject";
    } else if (tool === "product") {
      finalPrompt = prompt || "Place this product in a clean professional studio setting with soft lighting and white background";
    }

    // Resolve OpenRouter model ID from internal ID
    const orModel = IMAGE_MODEL_MAP[model] ?? "black-forest-labs/flux-schnell";

    const body: Record<string, unknown> = {
      prompt: finalPrompt,
      model: orModel,
      width: 1024,
      height: 1024,
    };
    if (imageUrl) body.image_url = imageUrl;

    const data = await this.callProxy("openrouter-image", "", body);

    if (data?.url) return { url: data.url, model: data.model ?? orModel };
    throw new Error("No se pudo generar la imagen. Intenta de nuevo.");
  },

  // ─── VIDEO GENERATION — Replicate via media-proxy ────────────────────────────
  async handleVideoGen(prompt: string, onProgress?: (step: string, pct: number) => void) {
    const steps = [
      ['Iniciando generación…', 5],
      ['Enviando a Replicate…', 20],
      ['Procesando frames…', 55],
      ['Exportando video…', 85],
    ] as [string, number][];

    let stepIdx = 0;
    onProgress?.(steps[0][0], steps[0][1]);
    const progressTimer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1);
      onProgress?.(steps[stepIdx][0], steps[stepIdx][1]);
    }, 12000);

    try {
      const { data, error } = await supabase.functions.invoke("media-proxy", {
        body: { tool: "video", prompt },
      });
      clearInterval(progressTimer);
      onProgress?.('Listo', 100);
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      if ((data as any)?.url) return { url: (data as any).url, text: "Video generado con IA" };
      throw new Error("La generación de video tardó demasiado. Tus créditos serán reembolsados.");
    } catch (err) {
      clearInterval(progressTimer);
      throw err;
    }
  },

  // ─── STREAMING TEXT (for ForMarketing tools) ──────────────────────────────────
  async streamTextGen(
    tool: string,
    prompt: string,
    model: string,
    profile: any,
    onToken: (chunk: string) => void,
  ): Promise<void> {
    const orModel    = TEXT_MODEL_MAP[model] ?? "google/gemini-2.0-flash-001";
    const userTier   = profile?.subscription_tier?.toUpperCase() ?? "FREE";
    const userCredits = profile?.credits_balance ?? 0;

    const TOOL_PROMPTS: Record<string, string> = {
      copywriter: "Eres un copywriter experto. Escribe copy persuasivo, claro y orientado a conversión. Usa fórmulas probadas (AIDA, PAS, FAB). Sé conciso y potente.",
      social:     "Eres un estratega de redes sociales. Crea contenido nativo para cada plataforma. Incluye hooks, CTAs, hashtags relevantes y emojis estratégicos.",
      blog:       "Eres un escritor SEO senior. Estructura el artículo con H2/H3, incluye introducción, desarrollo y conclusión. Optimiza para intención de búsqueda.",
      ads:        "Eres un especialista en paid media. Crea anuncios que maximicen CTR y conversión. Incluye headline, descripción y CTA.",
      chat:       `Eres Antigravity, IA de nivel Senior. Responde con precisión y valor. PLAN: ${userTier}. CRÉDITOS: ${userCredits}.`,
    };

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error("Sesión caducada. Por favor, refresca la página.");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const res = await fetch(`${supabaseUrl}/functions/v1/ai-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        provider: "openrouter",
        path: "chat/completions",
        body: {
          model: orModel,
          messages: [
            { role: "system", content: TOOL_PROMPTS[tool] ?? TOOL_PROMPTS.chat },
            { role: "user",   content: prompt },
          ],
          temperature: 0.85,
          max_tokens: 4096,
          stream: true,
        },
      }),
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Token de sesión inválido (401). Verifica tu inicio de sesión.");
      }
      throw new Error("Streaming no disponible. Intenta de nuevo.");
    }
    if (!res.body) throw new Error("Cuerpo de respuesta vacío");

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
        } catch { /* skip malformed lines */ }
      }
    }
  },

  // ─── MEDIA PROXY (image editing tools) ───────────────────────────────────────
  async handleMediaProxy(tool: string, imageUrl: string, onProgress?: (step: string, pct: number) => void) {
    const steps = [
      ['Iniciando…', 5],
      ['Enviando imagen…', 20],
      ['Procesando…', 60],
      ['Finalizando…', 90],
    ] as [string, number][];

    let stepIdx = 0;
    onProgress?.(steps[0][0], steps[0][1]);
    const progressTimer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1);
      onProgress?.(steps[stepIdx][0], steps[stepIdx][1]);
    }, 3000);

    try {
      const { data, error } = await supabase.functions.invoke("media-proxy", {
        body: { tool, image_url: imageUrl },
      });
      clearInterval(progressTimer);
      onProgress?.('Listo', 100);
      if (error) throw new Error(`La herramienta "${tool}" falló: ${error.message}`);
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as any;
    } catch (err) {
      clearInterval(progressTimer);
      throw err;
    }
  },

  // ─── CREDIT HELPERS ─────────────────────────────────────────────────────────
  async spendCredits(amount: number, action: string, model: string, nodeId: string | null = null) {
    const { error } = await (supabase.rpc as any)("spend_credits", {
      _amount: amount,
      _action: action,
      _model: model,
      _node_id: nodeId,
    });
    if (error) {
       if (error.message?.toLowerCase().includes('insufficient')) {
         toast.error("Créditos insuficientes.", {
           description: "Recarga tu plan para continuar construyendo.",
           action: { label: "Actualizar", onClick: () => window.location.href = '/pricing' },
           duration: 6000
         });
       }
       throw new Error(error.message || "Error al descontar créditos");
    }
    return true;
  },

  async refundCredits(amount: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      await (supabase.rpc as any)("refund_credits", { _amount: amount, _user_id: user.id });
    } catch (e) {
      console.warn("[aiService] Refund failed:", e);
    }
  },
};
