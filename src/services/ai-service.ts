import { supabase } from "@/integrations/supabase/client";

// ─── MODEL ROUTING TABLE ──────────────────────────────────────────────────────
// Maps internal model IDs → real API model names
const OPENROUTER_MODEL_MAP: Record<string, string> = {
  "deepseek-chat":      "deepseek/deepseek-chat-v3-0324",
  "gemini-3-flash":     "google/gemini-2.0-flash-001",
  "gemini-3.1-pro-low": "google/gemini-2.5-pro-preview-03-25",
  "gemini-3.1-pro-high":"google/gemini-2.5-pro-preview-03-25",
  "claude-3.5-sonnet":  "anthropic/claude-sonnet-4-5",
  "claude-3-opus":      "anthropic/claude-opus-4-5",
  "gpt-oss-120b":       "meta-llama/llama-4-maverick",
};

// ─── URL → validated image data URL ───────────────────────────────────────────
// Fetches any image URL and converts to a base64 data URL so <img> always renders.
// Rejects only clear non-image responses (text/html, text/plain).
const urlToDataUrl = async (url: string, timeoutMs = 60000): Promise<string> => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    // Reject HTML/text error pages; accept image/* and application/octet-stream
    if (blob.type.startsWith("text/")) throw new Error(`Respuesta no es imagen: ${blob.type}`);
    const mime = blob.type.startsWith("image/") ? blob.type : "image/png";
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => {
        const result = reader.result as string;
        // If MIME was guessed, fix the data URL prefix
        resolve(blob.type.startsWith("image/") ? result : `data:${mime};base64,${result.split(",")[1]}`);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err: any) {
    clearTimeout(t);
    throw err;
  }
};

// Image models (NanoBanana family) — all route to Pollinations
const IMAGE_MODEL_IDS = new Set(["nano-banana-2", "nano-banana-pro", "nano-banana-25"]);

// Credit costs per model/action
const MODEL_COSTS: Record<string, number> = {
  "deepseek-chat": 1, "gemini-3-flash": 1, "gemini-3.1-pro-low": 1,
  "gemini-3.1-pro-high": 3, "claude-3.5-sonnet": 4, "claude-3-opus": 5,
  "gpt-oss-120b": 2, "nano-banana-2": 2, "nano-banana-pro": 4, "nano-banana-25": 1,
  "upscale": 3, "background": 1, "enhance": 2, "restore": 3, "variation": 4,
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
  async processAction(params: AIActionParams) {
    const { action, prompt, model, image, tool, node_id } = params;
    const cost = MODEL_COSTS[model] || MODEL_COSTS[tool ?? ""] || 2;
    const actionName = action || tool || "ai-gen";

    try {
      // 1. Verify Auth and Get Profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Acceso no autorizado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier, credits_balance")
        .eq("user_id", user.id)
        .single();

      // 2. Validate Node ID (must be UUID for DB and EXIST in canvas_nodes)
      const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let safeNodeId = node_id && isValidUUID(node_id) ? node_id : null;

      if (safeNodeId) {
        const { data: nodeExists } = await supabase
          .from("canvas_nodes")
          .select("id")
          .eq("id", safeNodeId)
          .maybeSingle();
        
        if (!nodeExists) {
          console.warn(`[AI Service] Node ${safeNodeId} does not exist in DB. Proceeding with null node_id.`);
          safeNodeId = null;
        }
      }

      // 3. Deduct Credits via Atomic RPC
      const { error: rpcError } = await (supabase.rpc as any)("spend_credits", {
        _amount: cost,
        _action: actionName,
        _model: model || tool || "unknown",
        _node_id: safeNodeId,
      });
      if (rpcError) throw new Error(rpcError.message || "Créditos insuficientes");

      // 3. Route to correct AI provider
      let result: any = { error: "Acción no soportada" };

      if (tool && ["upscale", "background", "enhance", "restore", "eraser", "variation"].includes(tool)) {
        if (!image) throw new Error(`La herramienta "${tool}" requiere una imagen de origen.`);
        result = await this.handleMediaProxy(tool, image);
      } else if (action === "image" || IMAGE_MODEL_IDS.has(model) || tool === "generate" || tool === "logo") {
        result = await this.handleImageGen(prompt, tool);
      } else if (action === "video") {
        result = {
          url: "https://cdn.pixabay.com/video/2023/10/20/185834-876356744_tiny.mp4",
          text: "🎬 Generación de video próximamente. Tu crédito fue reembolsado.",
        };
      } else {
        // Text / chat / UI — route by model
        result = await this.handleTextGen(action, prompt, model, profile);
      }

      // 4. Update Canvas Node if applicable
      if (node_id) {
        const smartName = action === "ui"
          ? `Diseño: ${prompt.slice(0, 15)}...`
          : tool
            ? `${tool.charAt(0).toUpperCase() + tool.slice(1)}: ${prompt.slice(0, 15)}...`
            : `${action.charAt(0).toUpperCase() + action.slice(1)}: ${prompt.slice(0, 15)}...`;

        await supabase.from("canvas_nodes").update({
          status: "ready",
          name: smartName,
          asset_url: result.url || null,
          data_payload: {
            ...result,
            _metadata: {
              generated_at: new Date().toISOString(),
              model: model || "pollinations",
              cost,
              powered_by: "Creator Ecosystem V3.5",
            },
          },
        } as any).eq("id", node_id);
      }

      return result;

    } catch (err: any) {
      console.error("[Creator IA] Error del servicio de IA:", err.message);

      // Intentar reembolso de créditos si hubo fallo de la IA
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          await (supabase.rpc as any)("refund_credits", {
            _amount: cost,
            _user_id: currentUser.id,
          });
          console.log("[Creator IA] Créditos reembolsados:", cost);
        }
      } catch (refundErr) {
        console.error("[Creator IA] Fallo en reembolso de créditos:", refundErr);
      }

      throw new Error(err.message || "Error desconocido. Por favor intenta de nuevo.");
    }
  },

  async callAiProxy(provider: "openrouter" | "gemini", path: string, body: any, signal?: AbortSignal) {
    const { data, error } = await supabase.functions.invoke("ai-proxy", {
      body: { provider, path, body },
    });
    
    // Si error no es null, hubo un problema de red, auth (401), o del proxy
    if (error) {
      throw new Error(`${provider} Proxy Error: ${error.message} (Asegúrate de haber iniciado sesión y configurado los Supabase Secrets)`);
    }

    // Si la función reenvía errores (4xx, 5xx), los mandamos tal cual
    if (data && data.error) {
      throw new Error(`${provider} API Error: ${data.error}`);
    }

    return data;
  },

  // ─── TEXT GENERATION ─────────────────────────────────────────────────────────
  async handleTextGen(action: string, prompt: string, model: string, profile?: any) {
    const openRouterModel = OPENROUTER_MODEL_MAP[model] || "google/gemini-2.0-flash-001";
    const userTier = profile?.subscription_tier?.toUpperCase() || "FREE";
    const userCredits = profile?.credits_balance || 0;

    let systemPrompt = `
# ROLE: Antigravity - High-Performance AI Engine
Eres Antigravity, el núcleo de inteligencia de esta plataforma. Tu propósito es proporcionar soluciones de nivel Senior en diseño, tecnología y estrategia. Operas bajo una lógica de eficiencia de recursos y maximización de valor según el nivel de acceso del usuario.

# USER CONTEXT (Dynamic Variables)
- USER_PLAN: ${userTier}
- REMAINING_CREDITS: ${userCredits}
- EXPERTISE_LEVEL: Senior / Lead Product Designer

# TIERNED BEHAVIOR LOGIC:

## 1. IF USER_PLAN == "FREE":
- **Objective:** Demonstrate value quickly and trigger "Product-Led Growth".
- **Constraints:**
    - Max 150 words per response.
    - No extensive code blocks (limit to 15-20 lines).
    - Use clear, bulleted lists for scannability.
- **Conversion Trigger:** Al final de una respuesta técnica o compleja, añade siempre un bloque de "Insight Pro". 
    - *Example:* "[Insight Pro]: Con la membresía Pro, puedo generar el prototipo funcional completo de esta idea y optimizar el código para producción en segundos."

## 2. IF USER_PLAN == "PRO":
- **Objective:** Maximum utility and deep analytical resolution.
- **Capabilities:**
    - Full reasoning (Chain-of-Thought).
    - Advanced formatting: Tables, Mermaid diagrams, and complex technical documentation.
    - No length restrictions. 
    - Priority on strategic thinking and Lead-level insights.

# OPERATIONAL GUIDELINES:
- **Identity:** Mantén un tono profesional, visionario y ligeramente audaz. Eres una herramienta para creadores y líderes, no un asistente genérico.
- **Safety:** Si el usuario intenta realizar tareas que consumen demasiados tokens en el plan FREE, detente amablemente. Explica que esa capacidad está reservada para el motor de procesamiento extendido del Plan Pro.
- **Efficiency:** Prioriza la precisión sobre la verborrea. Cada token debe aportar valor.

# UPSELL TRIGGERS:
- ${userCredits < 3 ? 'Si REMAINING_CREDITS < 3: Advierte al usuario con sutileza que su sesión de prueba está por concluir y que el Plan Pro garantiza acceso ininterrumpido a los modelos más potentes del mercado (Claude 3.5 Sonnet / GPT-4o).' : ''}
`;

    if (action === "ui") {
      systemPrompt += `\n\nEres un experto diseñador de interfaces UX/UI. 
Genera un JSON válido con esta estructura exacta: { "ui": { "title": "string", "description": "string", "components": [...] }, "device": "mobile|tablet|desktop" }.
Usa colores de marca: primary (#9333ea), gold (#eab308), background (#0a0a0b).
Responde SOLO con el JSON raw, sin markdown, sin explicaciones.`;
    }

    const messages = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });

    // 1. Intentar OpenRouter a través de Proxy
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const data = await this.callAiProxy("openrouter", "chat/completions", {
        model: openRouterModel,
        messages,
        temperature: 0.85,
        max_tokens: 4096,
      }, controller.signal);
      
      clearTimeout(timeoutId);

      let text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error("La IA devolvió una respuesta vacía.");

      if (action === "ui") {
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        try { return JSON.parse(text); } catch { return { text }; }
      }
      return { text };
    } catch (err: any) {
      console.warn("[AI] OpenRouter Proxy falló, intentando Gemini como respaldo...", err.message);
      
      // 2. Respaldo Gemini a través de Proxy
      return this.callGeminiDirect(action, prompt, systemPrompt);
    }
  },

  async callGeminiDirect(action: string, prompt: string, systemPrompt: string) {
    const activeGeminiModel = "gemini-1.5-flash";
    const geminiMessages = action === "ui"
      ? [{ parts: [{ text: `${systemPrompt}\n\nUSER PROMPT: ${prompt}` }] }]
      : [{ parts: [{ text: prompt }] }];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const data = await this.callAiProxy("gemini", `models/${activeGeminiModel}:generateContent`, {
        contents: geminiMessages
      }, controller.signal);
      
      clearTimeout(timeoutId);

      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Gemini devolvió una respuesta vacía.");

      if (action === "ui") {
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        try { return JSON.parse(text); } catch { return { text }; }
      }
      return { text };
    } catch (err: any) {
      clearTimeout(timeoutId);
      throw new Error(`Error de generación (ambos proveedores fallaron). Detalles: ${err.message}`);
    }
  },

  // ─── IMAGE GENERATION ────────────────────────────────────────────────────────
  // Routes: OpenRouter Flux → Gemini image models → Pollinations (retry + raw URL)
  async handleImageGen(prompt: string, tool?: string) {
    const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    const geminiKey     = import.meta.env.VITE_GEMINI_API_KEY;

    let finalPrompt = prompt;
    if (tool === "logo") {
      finalPrompt = `${prompt}, professional logo design, clean vector style, white background, sharp edges, brand identity`;
    }

    // ── 1. OpenRouter → Flux Schnell ──────────────────────────────────────
    if (openRouterKey) {
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 45000);
        const res = await fetch("https://openrouter.ai/api/v1/images/generations", {
          method: "POST", signal: controller.signal,
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "HTTP-Referer": "https://creator-ia.com",
            "X-Title": "Creator IA Pro",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model: "black-forest-labs/flux-schnell", prompt: finalPrompt, n: 1, size: "1024x1024" }),
        });
        clearTimeout(t);
        if (res.ok) {
          const json = await res.json();
          const item = json.data?.[0];
          if (item?.b64_json) return { url: `data:image/png;base64,${item.b64_json}` };
          if (item?.url) {
            try { return { url: await urlToDataUrl(item.url, 30000) }; } catch { /* fall through */ }
          }
        }
      } catch (err) { console.warn("[Image Gen] OpenRouter failed:", err); }
    }

    // ── 2. Gemini image generation ─────────────────────────────────────────
    if (geminiKey) {
      for (const geminiModel of ["gemini-2.0-flash-preview-image-generation", "gemini-2.0-flash-exp"]) {
        try {
          const controller = new AbortController();
          const t = setTimeout(() => controller.abort(), 60000);
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
            {
              method: "POST", signal: controller.signal,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: finalPrompt }] }],
                generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
              }),
            }
          );
          clearTimeout(t);
          if (res.ok) {
            const json = await res.json();
            const imgPart = (json.candidates?.[0]?.content?.parts ?? []).find((p: any) => p.inlineData?.data);
            if (imgPart) return { url: `data:${imgPart.inlineData.mimeType || "image/png"};base64,${imgPart.inlineData.data}` };
          }
        } catch (err) { console.warn(`[Image Gen] ${geminiModel} failed:`, err); }
      }
    }

    // ── 3. Pollinations fallback — retry 3× then return raw URL ───────────
    const seed = Math.floor(Math.random() * 999999);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true&model=flux`;

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 5000 * attempt));
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 45000);
        const res = await fetch(pollinationsUrl, { signal: controller.signal });
        clearTimeout(t);
        if (!res.ok) continue;
        const blob = await res.blob();
        if (blob.type.startsWith("text/")) { console.warn(`[Pollinations] attempt ${attempt + 1}: HTML page, retrying...`); continue; }
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        if (!dataUrl.startsWith("data:image/")) return { url: `data:image/png;base64,${dataUrl.split(",")[1]}` };
        return { url: dataUrl };
      } catch (err) { console.warn(`[Pollinations] attempt ${attempt + 1} failed:`, err); }
    }

    // Last resort: return raw URL — browser <img> can load without CORS restriction
    return { url: pollinationsUrl };
  },

  // ─── MEDIA PROXY (IMAGE EDITING) ──────────────────────────────────────────
  async handleMediaProxy(tool: string, imageUrl: string) {
    try {
      const { data, error } = await supabase.functions.invoke("media-proxy", {
        body: { tool, image_url: imageUrl },
      });

      if (error) {
        throw new Error(error.message || `Proxy error (Asegúrate de haber iniciado sesión y configurado los Supabase Secrets)`);
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (err: any) {
      console.error("Media Proxy Failure:", err.message);
      // Fallback: If proxy fails or is misconfigured, fail hard to trigger credit refund
      throw new Error(`Error en motor de procesamiento de medios ("${tool}"): ${err.message}`);
    }
  },
};
