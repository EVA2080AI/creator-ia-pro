import { supabase } from "@/integrations/supabase/client";

// --- CONFIGURACIÓN DE MODELOS Y COSTES (Ecosistema Creator V3.4) ---
const TEXT_MODELS = [
  "deepseek-chat", "gemini-3-flash", "gemini-3.1-pro-low", "gemini-3.1-pro-high",
  "claude-3.5-sonnet", "claude-3-opus", "gpt-oss-120b"
];

const MODEL_COSTS: Record<string, number> = {
  "deepseek-chat": 1, "gemini-3-flash": 1, "gemini-3.1-pro-low": 1, "gemini-3.1-pro-high": 3,
  "claude-3.5-sonnet": 4, "claude-3-opus": 5, "gpt-oss-120b": 2,
  "nano-banana-2": 2, "nano-banana-pro": 4, "nano-banana-25": 1,
  "upscale": 3, "background": 1, "enhance": 2, "restore": 3
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
  /**
   * Procesa una acción de IA consolidada (Reemplaza a ai-gateway-v2)
   */
  async processAction(params: AIActionParams) {
    const { action, prompt, model, image, tool, node_id } = params;
    const cost = MODEL_COSTS[model] || MODEL_COSTS[tool ?? ""] || 2;
    const actionName = action || tool || "ai-gen";

    try {
      // 1. Verificar Autenticación
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Acceso no autorizado");

      // 2. Descontar Créditos vía RPC Seguro (Atómico)
      const { error: rpcError } = await (supabase.rpc as any)('spend_credits', {
        _amount: cost,
        _action: actionName,
        _model: model || tool || "unknown",
        _node_id: node_id
      });

      if (rpcError) throw new Error(rpcError.message || "Créditos insuficientes");

      // 3. Procesamiento de IA (Directo desde Ecosistema Creator)
      let result: any = { error: "Acción no soportada" };

      if (action === "ui" || TEXT_MODELS.includes(model) || action === "chat") {
        result = await this.handleTextGen(action, prompt, model);
      } else if (action === "image" || model?.startsWith("nano-banana")) {
        result = await this.handleImageGen(prompt);
      } else if (action === "video") {
        result = { url: "https://cdn.pixabay.com/video/2023/10/20/185834-876356744_tiny.mp4", info: "Coming soon: Integración nativa de video" };
      } else if (tool && ["upscale", "background", "enhance", "restore"].includes(tool)) {
        result = await this.handleImageEdit(tool, image!);
      }

      // 4. Actualizar Nodo en Canvas (si existe)
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
              model: model || "replicate",
              cost: cost,
              powered_by: "Creator Ecosystem V3.4"
            }
          }
        } as any).eq("id", node_id);
      }

      return result;

    } catch (err: any) {
      console.error("AI Service Error [V3.4]:", err.message);
      
      // Intentar rollback de créditos (atómico en RPC, pero por seguridad reembolsamos si la IA falló)
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          await (supabase.rpc as any)('refund_credits', {
            _amount: cost,
            _user_id: currentUser.id
          });
          console.log("Créditos reembolsados tras fallo (V3.4)");
        }
      } catch (refundErr) {
        console.error("Fallo al reembolsar créditos:", refundErr);
      }

      throw new Error(`[IA Ecosystem V3.4] ${err.message}`);
    }
  },

  async handleTextGen(action: string, prompt: string, model: string) {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const activeModel = "gemini-1.5-flash"; 
    
    let systemPrompt = "";
    if (action === "ui") {
      systemPrompt = `Eres un experto diseñador de interfaces UX/UI.
      Genera un JSON válido: { "ui": { ... }, "device": "mobile|tablet|desktop" }.
      Usa colores de marca: primary (#9333ea), gold (#eab308), background (#0a0a0b).
      Responde SOLO con el JSON raw.`;
    }

    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${geminiKey}`;
    const payload = action === "ui" 
      ? { contents: [{ parts: [{ text: `${systemPrompt}\n\nUSER PROMPT: ${prompt}` }] }] }
      : { contents: [{ parts: [{ text: prompt }] }] };

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Respuesta vacía de Gemini");

    if (action === "ui") {
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(text);
    }
    return { text };
  },

  async handleImageGen(prompt: string) {
    console.log("Generating Image via Pollinations (V3.4)...");
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;
    return { url: imageUrl };
  },

  async handleImageEdit(tool: string, image: string) {
    // Para simplificar sin el SDK de Replicate en el frontend (CORS issues), usamos el gateway unificado
    // O si el usuario quiere "removerlo", deberíamos usar una API alternativa o direct fetch si Replicate permite.
    // Por ahora, simulamos el resultado o advertimos.
    throw new Error(`${tool} requiere proxy backend seguro para claves de Replicate API. Use el Dashboard Principal.`);
  }
};
