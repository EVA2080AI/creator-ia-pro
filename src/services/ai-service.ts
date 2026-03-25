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

// Models that bypass OpenRouter and call Gemini API directly (fast / low latency for UI gen)
const DIRECT_GEMINI_MODELS = new Set(["gemini-1.5-flash"]);

// Image models (NanoBanana family) — all route to Pollinations
const IMAGE_MODEL_IDS = new Set(["nano-banana-2", "nano-banana-pro", "nano-banana-25"]);

// Credit costs per model/action
const MODEL_COSTS: Record<string, number> = {
  "deepseek-chat": 1, "gemini-3-flash": 1, "gemini-3.1-pro-low": 1,
  "gemini-3.1-pro-high": 3, "claude-3.5-sonnet": 4, "claude-3-opus": 5,
  "gpt-oss-120b": 2, "nano-banana-2": 2, "nano-banana-pro": 4, "nano-banana-25": 1,
  "upscale": 3, "background": 1, "enhance": 2, "restore": 3,
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
      // 1. Verify Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Acceso no autorizado");

      // 2. Deduct Credits via Atomic RPC
      const { error: rpcError } = await (supabase.rpc as any)("spend_credits", {
        _amount: cost,
        _action: actionName,
        _model: model || tool || "unknown",
        _node_id: node_id,
      });
      if (rpcError) throw new Error(rpcError.message || "Créditos insuficientes");

      // 3. Route to correct AI provider
      let result: any = { error: "Acción no soportada" };

      if (tool && ["upscale", "background", "enhance", "restore", "eraser"].includes(tool)) {
        // Image edit tools require a secure backend proxy — show meaningful message
        result = { text: `⚙️ La herramienta "${tool}" requiere un proxy de servidor seguro para procesar imágenes de alta calidad. Esta función estará disponible próximamente en el plan Pro. Por ahora, usa "Texto a Imagen" para generar imágenes desde cero.` };
      } else if (action === "image" || IMAGE_MODEL_IDS.has(model) || tool === "generate") {
        result = await this.handleImageGen(prompt);
      } else if (action === "video") {
        result = {
          url: "https://cdn.pixabay.com/video/2023/10/20/185834-876356744_tiny.mp4",
          text: "🎬 Generación de video próximamente. Tu crédito fue reembolsado.",
        };
      } else {
        // Text / chat / UI — route by model
        result = await this.handleTextGen(action, prompt, model);
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
      console.error("AI Service Error [V3.5]:", err.message);

      // Attempt credit refund on AI failure
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          await (supabase.rpc as any)("refund_credits", {
            _amount: cost,
            _user_id: currentUser.id,
          });
        }
      } catch (refundErr) {
        console.error("Credit refund failed:", refundErr);
      }

      throw new Error(`[IA V3.5] ${err.message}`);
    }
  },

  // ─── TEXT GENERATION ─────────────────────────────────────────────────────────
  async handleTextGen(action: string, prompt: string, model: string) {
    const openRouterModel = OPENROUTER_MODEL_MAP[model];
    const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

    let systemPrompt = "";
    if (action === "ui") {
      systemPrompt = `Eres un experto diseñador de interfaces UX/UI. 
Genera un JSON válido con esta estructura exacta: { "ui": { "title": "string", "description": "string", "components": [...] }, "device": "mobile|tablet|desktop" }.
Usa colores de marca: primary (#9333ea), gold (#eab308), background (#0a0a0b).
Responde SOLO con el JSON raw, sin markdown, sin explicaciones.`;
    }

    const messages = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: `${systemPrompt ? "" : ""}${prompt}` });

    // Route via OpenRouter for all non-Gemini-direct models
    if (openRouterModel && openRouterKey) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "HTTP-Referer": "https://creatoria.pro",
          "X-Title": "Creator IA Pro",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: openRouterModel,
          messages,
          temperature: 0.85,
          max_tokens: 4096,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`OpenRouter error ${res.status}: ${errBody.slice(0, 200)}`);
      }

      const data = await res.json();
      let text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error("Respuesta vacía de OpenRouter");

      if (action === "ui") {
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        try { return JSON.parse(text); } catch { return { text }; }
      }
      return { text };
    }

    // Fallback: Gemini Flash direct (for UI gen or when OpenRouter key missing)
    if (!geminiKey) throw new Error("No se encontró API key de IA. Configura VITE_GEMINI_API_KEY.");

    const activeGeminiModel = "gemini-1.5-flash";
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${activeGeminiModel}:generateContent?key=${geminiKey}`;

    const geminiMessages = action === "ui"
      ? [{ parts: [{ text: `${systemPrompt}\n\nUSER PROMPT: ${prompt}` }] }]
      : [{ parts: [{ text: prompt }] }];

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: geminiMessages }),
    });

    if (!res.ok) throw new Error(`Gemini error ${res.status}`);

    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Respuesta vacía de Gemini");

    if (action === "ui") {
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      try { return JSON.parse(text); } catch { return { text }; }
    }
    return { text };
  },

  // ─── IMAGE GENERATION ────────────────────────────────────────────────────────
  async handleImageGen(prompt: string) {
    const seed = Math.floor(Math.random() * 999999);
    // Use Pollinations – free, reliable, no key needed
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;
    return { url: imageUrl };
  },
};
