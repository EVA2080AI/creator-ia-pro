import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Replicate from "https://esm.sh/replicate@0.29.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- CONFIGURACIÓN DE MODELOS Y COSTES ---
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let userId: string | null = null;
  let cost = 0;
  let actionName = "unknown";

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Autenticación
    const authHeader = req.headers.get("Authorization")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error("Acceso no autorizado");
    userId = user.id;

    // 2. Parse Request
    const { action, prompt, model, image, tool, node_id } = await req.json();
    actionName = action || tool || "ai-gen";
    
    // 3. Determinar Coste
    cost = MODEL_COSTS[model] || MODEL_COSTS[tool] || 2;

    // 4. Verificar y Descontar Créditos (Atómico)
    const { data: profile, error: profErr } = await adminClient
      .from("profiles")
      .select("credits_balance")
      .eq("user_id", userId)
      .single();

    if (profErr || !profile) throw new Error("Perfil no encontrado");
    if (profile.credits_balance < cost) throw new Error(`Créditos insuficientes. Necesitas ${cost}.`);

    await adminClient
      .from("profiles")
      .update({ credits_balance: profile.credits_balance - cost })
      .eq("user_id", userId);

    // --- PROCESAMIENTO DE IA ---
    let result: any = { error: "Acción no soportada" }; // Inicializado con error por defecto

    if (action === "ui" || TEXT_MODELS.includes(model) || action === "chat") {
      // PROMPT-TO-UI (FORMKETING V2.0) & CHAT
      const geminiKey = Deno.env.get("GEMINI_API_KEY");
      const activeModel = "gemini-1.5-flash"; 

      let systemPrompt = "";
      if (action === "ui") {
        systemPrompt = `Eres un experto diseñador de interfaces UX/UI.
        Tu objetivo es generar una estructura JSON para un layout web/móvil basado en el prompt del usuario.
        
        REGLAS CRÍTICAS:
        1. Responde ÚNICAMENTE con un objeto JSON válido.
        2. La raíz del JSON debe ser { "ui": { ... }, "device": "mobile|tablet|desktop" }.
        3. Cada componente debe tener: "type" (container, text, button, image), "content" (texto opcional), "styles" (CSS inline en camelCase), "children" (array opcional).
        4. Usa colores de la marca: primary (#9333ea), gold (#eab308), background (#0a0a0b).
        5. No incluyas explicaciones tácticas ni markdown, solo el JSON raw.`;
      }

      const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${geminiKey}`;
      
      const payload = action === "ui" 
        ? { contents: [{ parts: [{ text: `${systemPrompt}\n\nUSER PROMPT: ${prompt}` }] }] }
        : { contents: [{ parts: [{ text: prompt }] }] };

      const aiRes = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await aiRes.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Cerebro IA saturado (Sin respuesta)");

      if (action === "ui") {
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        try {
          const parsed = JSON.parse(text);
          result = parsed;
        } catch (e) {
          console.error("JSON Parse Error:", text);
          throw new Error("La IA generó un diseño inválido. Prueba un prompt más simple.");
        }
      } else {
        result = { text };
      }

    } else if (action === "image" || model?.startsWith("nano-banana")) {
      // IMAGE GENERATION (POLLINATIONS - FREE)
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;
      result = { url: imageUrl };

    } else if (action === "video") {
      // VIDEO GENERATION (Luma/Replicate Placeholder)
      // Por ahora usamos un placeholder ya que la generación de video es costosa/lenta
      result = { url: "https://cdn.pixabay.com/video/2023/10/20/185834-876356744_tiny.mp4", info: "Placeholder: Integración de video en proceso" };

    } else if (["upscale", "background", "enhance", "restore"].includes(tool)) {
      // IMAGE EDITING (REPLICATE - PAID)
      const replicateToken = Deno.env.get("REPLICATE_API_TOKEN");
      const replicate = new Replicate({ auth: replicateToken });
      
      let replicaUrl = "";
      if (tool === "upscale") {
         const out = await replicate.run("nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b", { input: { image, scale: 4 } });
         replicaUrl = Array.isArray(out) ? out[0] : out;
      } else if (tool === "background") {
         const out = await replicate.run("cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003", { input: { image } });
         replicaUrl = Array.isArray(out) ? out[0] : out;
      } else if (tool === "enhance") {
         const out = await replicate.run("sczhou/codeformer:7de2ea4a352829bf9286d9a04aab3e3cd094aed9da2b412cbca8f3435c24944b", { input: { image, upscale: 2, face_upsample: true } });
         replicaUrl = Array.isArray(out) ? out[0] : out;
      } else if (tool === "restore") {
         const out = await replicate.run("tencentarc/gfpgan:9283608cc6b7c96b373ee5730c337a4ca6d9822762bd1c55060136209be4a9a0", { input: { img: image, version: "v1.4", scale: 2 } });
         replicaUrl = Array.isArray(out) ? out[0] : out;
      }
      result = { url: replicaUrl };
    }

    // 5. Update Canvas Node (si existe)
    if (node_id) {
       const smartName = action === "ui" 
          ? `Diseño: ${prompt.slice(0, 15)}...` 
          : tool 
            ? `${tool.charAt(0).toUpperCase() + tool.slice(1)}: ${prompt.slice(0, 15)}...`
            : `${action.charAt(0).toUpperCase() + action.slice(1)}: ${prompt.slice(0, 15)}...`;

       await adminClient.from("canvas_nodes").update({
         status: "ready",
         name: smartName,
         asset_url: result.url || null,
         data_payload: {
           ...result,
           _metadata: {
              generated_at: new Date().toISOString(),
              model: model || "replicate",
              cost: cost
           }
         }
       }).eq("id", node_id);
    }

    // 6. Audit Log (Success)
    await adminClient.from("ai_audit_logs").insert({
      user_id: userId, action: actionName, model: model || tool, cost, status: "success"
    });

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("Gateway Error:", err.message);
    
    // 6. Audit Log (Error) + Refund (Si es posible)
    if (userId && cost > 0) {
       const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
       const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
       
       // Refund credits
       const { data: p } = await adminClient.from("profiles").select("credits_balance").eq("user_id", userId).single();
       if (p) {
         await adminClient.from("profiles").update({ credits_balance: p.credits_balance + cost }).eq("user_id", userId);
       }
       
       await adminClient.from("ai_audit_logs").insert({
          user_id: userId, action: actionName, status: "error", error_message: err.message
       });
    }

    return new Response(JSON.stringify({ error: err.message }), { 
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
