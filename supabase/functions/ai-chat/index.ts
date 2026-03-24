import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapping front-end models to Pollinations AI internal models
const MODEL_MAPPING: Record<string, string> = {
  "gemini-3.1-pro-high":  "gemini-1.5-pro",
  "gemini-3.1-pro-low":   "gemini-1.5-flash",
  "gemini-3-flash":       "gemini-1.5-flash",
  "deepseek-chat":        "gemini-1.5-flash", 
  "claude-3.5-sonnet":    "gemini-1.5-pro", 
  "claude-3-opus":        "gemini-1.5-pro",
  "gpt-oss-120b":         "gemini-1.5-flash",
  "nano-banana-25":       "gemini-1.5-flash",
  "nano-banana-2":        "gemini-1.5-flash",
  "nano-banana-pro":      "gemini-1.5-pro",
};

const GUEST_TRIAL_LIMIT = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await userClient.auth.getUser();
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const isGuest = !user;

    const bodyArgs = await req.json();
    const type = bodyArgs.type;
    const prompt = bodyArgs.prompt;
    const requestedModel = bodyArgs.model || "deepseek-chat";
    const requiredCredits = typeof bodyArgs.cost === "number" ? bodyArgs.cost : 1;

    const finalModelString = MODEL_MAPPING[requestedModel] || "openai";

    if (!type || !prompt) throw new Error("Missing type or prompt");

    let guestFingerprint: string | null = null;
    let guestTrialsUsed = 0;

    if (isGuest) {
      guestFingerprint = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "no-ip";
      const { data: usageRow } = await adminClient
        .from("demo_usage")
        .select("trials_used")
        .eq("fingerprint", guestFingerprint)
        .maybeSingle();

      guestTrialsUsed = usageRow?.trials_used ?? 0;
      if (guestTrialsUsed >= GUEST_TRIAL_LIMIT) {
        return new Response(JSON.stringify({ error: "Límite de pruebas gratuitas alcanzado. Regístrate para continuar.", demo_limit_reached: true, demo_remaining: 0 }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    let originalCredits: number | null = null;

    if (!isGuest && user) {
      const { data: profile } = await adminClient.from("profiles").select("credits_balance").eq("user_id", user.id).single();
      if (!profile || profile.credits_balance < requiredCredits) {
        throw new Error(`Créditos insuficientes. Necesitas ${requiredCredits}.`);
      }
      originalCredits = profile.credits_balance;
      await adminClient.from("profiles").update({ credits_balance: profile.credits_balance - requiredCredits }).eq("user_id", user.id);
    }

    const systemPrompts: Record<string, string> = {
      copywriter: `Eres un experto copywriter de marketing digital. Genera textos persuasivos, creativos y optimizados para conversión. Responde en español. Formatea bien el texto con secciones claras.`,
      blog: `Eres un escritor de blogs SEO profesional. Genera artículos completos, bien estructurados con H1, H2, H3, párrafos, listas y conclusiones. Responde en español.`,
      social: `Eres un experto en marketing de redes sociales. Genera contenido optimizado para la plataforma indicada. Incluye hashtags sugeridos, mejor hora de publicación, y tips. Responde en español.`,
      general: `Eres un asistente de marketing de IA avanzado. Ayudas a crear contenido profesional de alta calidad. Responde en español.`,
    };

    const systemPrompt = systemPrompts[type] || systemPrompts.general;
    
    // Pollinations Text API (100% Free, NO API KEY) via GET params
    const POLLINATIONS_URL = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?system=${encodeURIComponent(systemPrompt)}&model=${finalModelString}&seed=${Math.floor(Math.random() * 1000000)}`;

    const aiResponse = await fetch(POLLINATIONS_URL);

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Pollinations error:", aiResponse.status, errText);
      if (!isGuest && user && originalCredits !== null) {
        await adminClient.from("profiles").update({ credits_balance: originalCredits }).eq("user_id", user.id);
      }
      throw new Error(`Cloud LLM falló: ${aiResponse.status} ${errText}`);
    }

    const text = await aiResponse.text();

    if (!text) {
      if (!isGuest && user && originalCredits !== null) {
        await adminClient.from("profiles").update({ credits_balance: originalCredits }).eq("user_id", user.id);
      }
      throw new Error("La IA no generó ningún texto válido.");
    }

    if (isGuest && guestFingerprint) {
      const nextTrials = guestTrialsUsed + 1;
      await adminClient.from("demo_usage").upsert({ fingerprint: guestFingerprint, trials_used: nextTrials, last_trial_at: new Date().toISOString() }, { onConflict: "fingerprint" });
      return new Response(JSON.stringify({ success: true, text, demo_remaining: Math.max(0, GUEST_TRIAL_LIMIT - nextTrials) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (user) {
      await adminClient.from("transactions").insert({ user_id: user.id, amount: -requiredCredits, type: "ai_chat", description: `LLM Model: ${finalModelString} - ${type}` });
    }

    return new Response(JSON.stringify({ success: true, text, cost: requiredCredits, model_used: finalModelString }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("AI Chat error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
