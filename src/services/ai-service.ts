import { supabase } from "@/integrations/supabase/client";

// ─── MODEL ROUTING TABLE ──────────────────────────────────────────────────────
const OPENROUTER_MODEL_MAP: Record<string, string> = {
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

// Image models (NanoBanana family)
const IMAGE_MODEL_IDS = new Set(["nano-banana-2", "nano-banana-pro", "nano-banana-25"]);

// Credit costs per model/action
const MODEL_COSTS: Record<string, number> = {
  "deepseek-chat": 1, "gemini-3-flash": 1, "gemini-3.1-pro-low": 1,
  "gemini-3.1-pro-high": 3, "claude-3.5-sonnet": 4, "claude-3-opus": 5,
  "gpt-oss-120b": 2, "mistral-large": 2, "mistral-small": 1, "nano-banana-2": 2, "nano-banana-pro": 4, "nano-banana-25": 1,
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

  // ─── PROXY CALL (todas las llamadas IA van aquí — sin keys en el cliente) ────
  async callAiProxy(provider: string, path: string, body: any) {
    const { data, error } = await supabase.functions.invoke("ai-proxy", {
      body: { provider, path, body },
    });
    if (error) throw new Error(`${provider}: ${error.message}`);
    if (data?.error) throw new Error(`${provider} API: ${data.error}`);
    return data;
  },

  // ─── PROCESS ACTION (entry point) ────────────────────────────────────────────
  async processAction(params: AIActionParams) {
    const { action, prompt, model, image, tool, node_id } = params;
    const cost = MODEL_COSTS[model] || MODEL_COSTS[tool ?? ""] || 2;
    const actionName = action || tool || "ai-gen";

    try {
      // 1. Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Acceso no autorizado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier, credits_balance")
        .eq("user_id", user.id)
        .single();

      // 2. Validate node ID
      const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let safeNodeId = node_id && isUUID(node_id) ? node_id : null;
      if (safeNodeId) {
        const { data: exists } = await supabase.from("canvas_nodes").select("id").eq("id", safeNodeId).maybeSingle();
        if (!exists) safeNodeId = null;
      }

      // 3. Deduct credits
      const { error: rpcError } = await (supabase.rpc as any)("spend_credits", {
        _amount: cost,
        _action: actionName,
        _model: model || tool || "unknown",
        _node_id: safeNodeId,
      });
      if (rpcError) throw new Error(rpcError.message || "Créditos insuficientes");

      // 4. Route
      let result: any;
      if (tool && ["upscale", "background", "enhance", "restore", "eraser", "variation"].includes(tool)) {
        if (!image) throw new Error(`La herramienta "${tool}" requiere una imagen de origen.`);
        result = await this.handleMediaProxy(tool, image);
      } else if (action === "image" || IMAGE_MODEL_IDS.has(model) || tool === "generate" || tool === "logo") {
        result = await this.handleImageGen(prompt, tool);
      } else if (action === "video") {
        result = await this.handleVideoGen(prompt);
      } else {
        result = await this.handleTextGen(action, prompt, model, profile);
      }

      // 5. Update canvas node
      if (node_id) {
        const name = tool
          ? `${tool.charAt(0).toUpperCase() + tool.slice(1)}: ${prompt.slice(0, 15)}...`
          : `${action.charAt(0).toUpperCase() + action.slice(1)}: ${prompt.slice(0, 15)}...`;
        await supabase.from("canvas_nodes").update({
          status: "ready", name,
          asset_url: result.url || null,
          data_payload: { ...result, _metadata: { generated_at: new Date().toISOString(), model: model || "proxy", cost } } as any,
        } as any).eq("id", node_id);
      }

      return result;

    } catch (err: any) {
      console.error("[Creator IA] Error:", err.message);
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u) await (supabase.rpc as any)("refund_credits", { _amount: cost, _user_id: u.id });
      } catch { /* silent */ }
      throw new Error(err.message || "Error desconocido. Por favor intenta de nuevo.");
    }
  },

  // ─── TEXT GENERATION ─────────────────────────────────────────────────────────
  async handleTextGen(action: string, prompt: string, model: string, profile?: any) {
    const openRouterModel = OPENROUTER_MODEL_MAP[model] || "google/gemini-2.0-flash-001";
    const userTier    = profile?.subscription_tier?.toUpperCase() || "FREE";
    const userCredits = profile?.credits_balance || 0;

    let systemPrompt = `
# ROLE: Antigravity - High-Performance AI Engine
Eres Antigravity, el núcleo de inteligencia de esta plataforma. Tu propósito es proporcionar soluciones de nivel Senior en diseño, tecnología y estrategia. Operas bajo una lógica de eficiencia de recursos y maximización de valor según el nivel de acceso del usuario.

# USER CONTEXT
- USER_PLAN: ${userTier}
- REMAINING_CREDITS: ${userCredits}
- EXPERTISE_LEVEL: Senior / Lead Product Designer

# TIERED BEHAVIOR:
## FREE: Max 150 palabras. Sin bloques de código extensos. Añade "[Insight Pro]" al final de respuestas técnicas.
## PRO: Sin restricciones. Razonamiento completo. Tablas, diagramas Mermaid, docs técnicas.
${userCredits < 3 ? '⚠️ Créditos bajos: menciona sutilmente que el Plan Pro garantiza acceso continuo.' : ''}`;

    if (action === "ui") {
      systemPrompt += `\n\nEres un experto UX/UI. Genera JSON válido: { "ui": { "title": "string", "description": "string", "components": [...] }, "device": "mobile|tablet|desktop" }. Solo JSON, sin markdown.`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user",   content: prompt },
    ];

    // 1. OpenRouter via proxy
    try {
      const data = await this.callAiProxy("openrouter", "chat/completions", {
        model: openRouterModel, messages, temperature: 0.85, max_tokens: 4096,
      });
      let text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error("Respuesta vacía");
      if (action === "ui") {
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        try { return JSON.parse(text); } catch { return { text }; }
      }
      return { text };
    } catch (e: any) { console.warn("[Text] OpenRouter proxy falló:", e.message); }

    // 2. Gemini via proxy
    const contents = action === "ui"
      ? [{ parts: [{ text: `${systemPrompt}\n\nUSER: ${prompt}` }] }]
      : [{ parts: [{ text: prompt }] }];
    try {
      const data = await this.callAiProxy("gemini", "models/gemini-1.5-flash:generateContent", { contents });
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Respuesta vacía");
      if (action === "ui") {
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        try { return JSON.parse(text); } catch { return { text }; }
      }
      return { text };
    } catch (e: any) {
      throw new Error(`Error de generación de texto. Verifica tu conexión e intenta de nuevo.`);
    }
  },

  // ─── IMAGE GENERATION ────────────────────────────────────────────────────────
  // Todo pasa por el proxy — sin API keys expuestas en el cliente
  async handleImageGen(prompt: string, tool?: string) {
    let finalPrompt = prompt;
    if (tool === "logo") {
      finalPrompt = `${prompt}, professional logo design, clean vector style, white background, sharp edges, brand identity`;
    }

    // 1. OpenRouter Flux Schnell via proxy
    try {
      const data = await this.callAiProxy("openrouter", "images/generations", {
        model: "black-forest-labs/flux-schnell",
        prompt: finalPrompt, n: 1, size: "1024x1024",
      });
      const item = data.data?.[0];
      if (item?.b64_json) return { url: `data:image/png;base64,${item.b64_json}` };
      if (item?.url)      return { url: item.url };
    } catch (e: any) { console.warn("[Image] OpenRouter falló:", e.message); }

    // 2. Gemini image generation via proxy
    for (const geminiModel of ["gemini-2.0-flash-preview-image-generation", "gemini-2.0-flash-exp"]) {
      try {
        const data = await this.callAiProxy("gemini", `models/${geminiModel}:generateContent`, {
          contents: [{ parts: [{ text: finalPrompt }] }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        });
        const imgPart = (data.candidates?.[0]?.content?.parts ?? []).find((p: any) => p.inlineData?.data);
        if (imgPart) return { url: `data:${imgPart.inlineData.mimeType || "image/png"};base64,${imgPart.inlineData.data}` };
      } catch (e: any) { console.warn(`[Image] ${geminiModel} falló:`, e.message); }
    }

    // 3. Pollinations via proxy (server-side)
    const seed = Math.floor(Math.random() * 999999);
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 3000));
      try {
        const data = await this.callAiProxy("pollinations", "image", { prompt: finalPrompt, seed, width: 1024, height: 1024 });
        if (data?.url) return { url: data.url };
      } catch (e: any) { console.warn(`[Image] Pollinations proxy intento ${attempt + 1} falló:`, e.message); }
    }

    // 4. Pollinations DIRECT — fetch, verify it's an image, convert to data URL
    for (let attempt = 0; attempt < 3; attempt++) {
      const directSeed = Math.floor(Math.random() * 999999);
      const polUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${directSeed}&nologo=true&model=flux`;
      try {
        const res = await fetch(polUrl, { signal: AbortSignal.timeout(30_000) });
        if (res.ok) {
          const blob = await res.blob();
          if (blob.type.startsWith("image/")) {
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            return { url: dataUrl };
          }
        }
      } catch { /* retry */ }
      if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
    }

    throw new Error("No se pudo generar la imagen. Todos los motores fallaron. Intenta de nuevo.");
  },

  // ─── VIDEO GENERATION ────────────────────────────────────────────────────────
  async handleVideoGen(prompt: string) {
    try {
      const { data, error } = await supabase.functions.invoke("media-proxy", {
        body: { tool: "video", prompt },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.url) return { url: data.url, text: "Video generado con IA" };
    } catch (e: any) {
      console.warn("[Video] media-proxy falló:", e.message);
    }
    // Fallback: placeholder con mensaje claro
    throw new Error("La generación de video está en proceso de activación. Tus créditos serán reembolsados.");
  },

  // ─── STREAMING TEXT GENERATION ───────────────────────────────────────────────
  // Returns an AsyncGenerator yielding text chunks as they arrive
  async *streamTextGen(
    tool: string,
    prompt: string,
    model: string,
    profile: any,
    onToken: (chunk: string) => void,
  ): Promise<void> {
    const openRouterModel = OPENROUTER_MODEL_MAP[model] || "google/gemini-2.0-flash-001";
    const userTier    = profile?.subscription_tier?.toUpperCase() || "FREE";
    const userCredits = profile?.credits_balance || 0;

    const TOOL_PROMPTS: Record<string, string> = {
      copywriter: `Eres un copywriter experto. Escribe copy persuasivo, claro y orientado a conversión. Usa fórmulas probadas (AIDA, PAS, FAB). Sé conciso y potente.`,
      social: `Eres un estratega de redes sociales. Crea contenido nativo para cada plataforma. Incluye hooks, CTAs, hashtags relevantes y emojis estratégicos. Adapta el tono a la red.`,
      blog: `Eres un escritor SEO senior. Estructura el artículo con H2/H3, incluye introducción, desarrollo y conclusión. Optimiza para intención de búsqueda. Usa datos y ejemplos concretos.`,
      ads: `Eres un especialista en paid media. Crea anuncios que maximicen CTR y conversión. Incluye headline, descripción y CTA. Adapta al formato de la plataforma solicitada.`,
      chat: `Eres Antigravity, IA de nivel Senior. Responde con precisión y valor. USER_PLAN: ${userTier}. CREDITS: ${userCredits}.`,
    };

    const systemPrompt = TOOL_PROMPTS[tool] || TOOL_PROMPTS.chat;
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user",   content: prompt },
    ];

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const res = await fetch(`${supabaseUrl}/functions/v1/ai-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        provider: "openrouter",
        path: "chat/completions",
        body: { model: openRouterModel, messages, temperature: 0.85, max_tokens: 4096, stream: true },
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error("Streaming no disponible. Intenta de nuevo.");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") return;
        try {
          const json = JSON.parse(payload);
          const chunk = json.choices?.[0]?.delta?.content;
          if (chunk) onToken(chunk);
        } catch { /* skip malformed SSE lines */ }
      }
    }
  },

  // ─── MEDIA PROXY (IMAGE EDITING) ─────────────────────────────────────────────
  async handleMediaProxy(tool: string, imageUrl: string) {
    const { data, error } = await supabase.functions.invoke("media-proxy", {
      body: { tool, image_url: imageUrl },
    });
    if (error) throw new Error(`La herramienta "${tool}" falló: ${error.message}`);
    if (data?.error) throw new Error(data.error);
    return data;
  },
};
