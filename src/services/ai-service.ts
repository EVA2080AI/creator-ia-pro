import { supabase } from "@/integrations/supabase/client";

// ─── TEXT MODEL MAP (internal-id → OpenRouter model ID) ───────────────────────
const TEXT_MODEL_MAP: Record<string, string> = {
  "deepseek-chat":       "deepseek/deepseek-chat-v3-0324",
  "gemini-3-flash":      "google/gemini-2.0-flash-001",
  "gemini-3.1-pro-low":  "google/gemini-2.5-pro-preview-03-25",
  "gemini-3.1-pro-high": "google/gemini-2.5-pro-preview-03-25",
  "claude-3.5-sonnet":   "anthropic/claude-sonnet-4-5",
  "claude-3-opus":       "anthropic/claude-opus-4-5",
  "gpt-oss-120b":        "meta-llama/llama-4-maverick",
  "mistral-large":       "mistralai/mistral-large",
  "mistral-small":       "mistralai/mistral-small-3.1-24b-instruct",
};

// ─── IMAGE MODEL MAP (internal-id → OpenRouter model ID) ──────────────────────
export const IMAGE_MODEL_MAP: Record<string, string> = {
  "flux-schnell":  "black-forest-labs/flux-1-schnell",
  "flux-pro":      "black-forest-labs/flux-1-pro",
  "flux-pro-1.1":  "black-forest-labs/flux-1.1-pro",
  "sdxl":          "stability-ai/sdxl",
};

// IDs that trigger image generation routing
const IMAGE_MODEL_IDS = new Set(Object.keys(IMAGE_MODEL_MAP));

// ─── CREDIT COSTS ─────────────────────────────────────────────────────────────
const MODEL_COSTS: Record<string, number> = {
  // Text
  "deepseek-chat": 1, "gemini-3-flash": 1, "gemini-3.1-pro-low": 1,
  "gemini-3.1-pro-high": 3, "claude-3.5-sonnet": 4, "claude-3-opus": 5,
  "gpt-oss-120b": 2, "mistral-large": 2, "mistral-small": 1,
  // Image
  "flux-schnell": 2, "flux-pro": 4, "flux-pro-1.1": 4, "sdxl": 2,
  // Image editing tools
  "upscale": 3, "background": 1, "enhance": 2, "restore": 3, "variation": 4, "video": 5,
};

export interface AIActionParams {
  action: "ui" | "image" | "video" | "chat";
  prompt: string;
  model: string;
  image?: string;
  tool?: string;
  node_id?: string;
}

export const aiService = {

  // ─── SINGLE PROXY CALL — all AI traffic goes through here ────────────────────
  async callProxy(provider: string, path: string, body: unknown) {
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
      if (tool && ["upscale", "background", "enhance", "restore", "eraser", "variation"].includes(tool)) {
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

  // ─── IMAGE GENERATION — OpenRouter only (FLUX → SDXL fallback) ───────────────
  async handleImageGen(prompt: string, model: string, tool?: string) {
    let finalPrompt = prompt;
    if (tool === "logo") {
      finalPrompt = `${prompt}, professional logo design, clean vector style, minimalist, white background, sharp edges, brand identity`;
    }

    // Resolve OpenRouter model ID from internal ID
    const orModel = IMAGE_MODEL_MAP[model] ?? "black-forest-labs/flux-1-schnell";

    const data = await this.callProxy("openrouter-image", "", {
      prompt: finalPrompt,
      model: orModel,
      width: 1024,
      height: 1024,
    });

    if (data?.url) return { url: data.url, model: data.model ?? orModel };
    throw new Error("No se pudo generar la imagen. Intenta de nuevo.");
  },

  // ─── VIDEO GENERATION ─────────────────────────────────────────────────────────
  async handleVideoGen(prompt: string) {
    const { data, error } = await supabase.functions.invoke("media-proxy", {
      body: { tool: "video", prompt },
    });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    if ((data as any)?.url) return { url: (data as any).url, text: "Video generado con IA" };
    throw new Error("La generación de video está en proceso de activación. Tus créditos serán reembolsados.");
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

    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const res = await fetch(`${supabaseUrl}/functions/v1/ai-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token ?? ""}`,
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

    if (!res.ok || !res.body) throw new Error("Streaming no disponible. Intenta de nuevo.");

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
  async handleMediaProxy(tool: string, imageUrl: string) {
    const { data, error } = await supabase.functions.invoke("media-proxy", {
      body: { tool, image_url: imageUrl },
    });
    if (error) throw new Error(`La herramienta "${tool}" falló: ${error.message}`);
    if ((data as any)?.error) throw new Error((data as any).error);
    return data as any;
  },
};
