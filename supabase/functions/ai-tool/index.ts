import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Replicate from "https://esm.sh/replicate@0.29.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROMPT_ONLY_TOOLS = ["logo", "social", "generate"];
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
    const replicateToken = Deno.env.get("REPLICATE_API_TOKEN");
    
    if (!replicateToken) throw new Error("REPLICATE_API_TOKEN is not configured en el dashboard de Supabase");
    
    const replicate = new Replicate({ auth: replicateToken });

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await userClient.auth.getUser();
    const isGuest = !user;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { tool, image, prompt } = await req.json();
    if (!tool) throw new Error("Missing tool");
    if (!PROMPT_ONLY_TOOLS.includes(tool) && !image) throw new Error("Sube una imagen primero");

    // Guest trial logic
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
        return new Response(
          JSON.stringify({
            error: "Límite de pruebas gratuitas alcanzado. Regístrate para seguir usando la IA.",
            demo_limit_reached: true,
            demo_remaining: 0,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Credits logic
    const creditCost: Record<string, number> = {
      enhance: 2, upscale: 3, eraser: 2, background: 1, restore: 3, logo: 2, social: 2, generate: 1,
    };
    const cost = creditCost[tool] || 2;
    let originalCredits: number | null = null;

    if (!isGuest && user) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("credits_balance")
        .eq("user_id", user.id)
        .single();

      if (!profile || profile.credits_balance < cost) {
        throw new Error(`Créditos insuficientes. Necesitas ${cost}, tienes ${profile?.credits_balance || 0}`);
      }
      originalCredits = profile.credits_balance;

      await adminClient
        .from("profiles")
        .update({ credits_balance: profile.credits_balance - cost })
        .eq("user_id", user.id);
    }

    let resultImage: string | null = null;
    const editPrompt = prompt || "Amazing quality output";

    try {
      if (PROMPT_ONLY_TOOLS.includes(tool)) {
        // TEXT-TO-IMAGE: USAMOS POLLINATIONS.AI (100% GRATIS)
        let finalPrompt = editPrompt;
        if (tool === "logo") finalPrompt = "Professional minimalist vector logo design of " + editPrompt;
        if (tool === "social") finalPrompt = "Eye-catching vibrant social media post background 4k " + editPrompt;
        
        // Pollinations.ai genera una imagen al paso (no requiere API key)
        resultImage = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&nologo=true`;
        
      } else {
        // IMAGE-TO-IMAGE: REQUIERE REPLICATE
        if (!replicateToken || replicateToken === 'dummy') {
          throw new Error("Esta herramienta requiere una API Key de Replicate con facturación activa. La generación desde texto sí es gratuita.");
        }
        
        if (tool === "upscale") {
          const output = await replicate.run("nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b", { input: { image: image, scale: 4 } });
          resultImage = Array.isArray(output) ? String(output[0]) : String(output);
        } 
        else if (tool === "enhance" || tool === "restore") {
          const output = await replicate.run("nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b", { input: { image: image, face_enhance: true, scale: 2 } });
          resultImage = Array.isArray(output) ? String(output[0]) : String(output);
        }
        else if (tool === "background") {
          const output = await replicate.run("cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003", { input: { image: image } });
          resultImage = Array.isArray(output) ? String(output[0]) : String(output);
        }
        else if (tool === "eraser") {
          const output = await replicate.run("timbrooks/instruct-pix2pix:30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f", { input: { image: image, prompt: editPrompt } });
          resultImage = Array.isArray(output) ? String(output[0]) : String(output);
        } else {
          throw new Error("Herramienta gráfica no soportada.");
        }
      }

      if (!resultImage || resultImage === "undefined") {
        throw new Error("La IA no devolvió ninguna imagen. Intenta de nuevo.");
      }
    } catch (e: any) {
      if (user && originalCredits !== null) {
        await adminClient.from("profiles").update({ credits_balance: originalCredits }).eq("user_id", user.id);
      }
      console.error("Replicate API Error:", e.message);
      throw new Error("Fallo en la API de Imagen: " + e.message);
    }

    if (isGuest && guestFingerprint) {
      const nextTrials = guestTrialsUsed + 1;
      await adminClient.from("demo_usage").upsert(
        { fingerprint: guestFingerprint, trials_used: nextTrials, last_trial_at: new Date().toISOString() },
        { onConflict: "fingerprint" }
      );
      return new Response(
        JSON.stringify({ success: true, result_url: resultImage, demo_remaining: Math.max(0, GUEST_TRIAL_LIMIT - nextTrials) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (user && resultImage) {
      await adminClient.from("transactions").insert({
        user_id: user.id, amount: -cost, type: "tool_usage", description: `Tool: ${tool}`,
      });
      await adminClient.from("saved_assets").insert({
        user_id: user.id, asset_url: resultImage, prompt: prompt || "", type: "image",
      });
    }

    return new Response(JSON.stringify({ success: true, result_url: resultImage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
