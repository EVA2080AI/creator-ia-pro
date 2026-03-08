import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IMAGE_MODEL = "gemini-2.0-flash-preview-image-generation";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleApiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!googleApiKey) throw new Error("GOOGLE_GEMINI_API_KEY is not configured");

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { node_id } = await req.json();
    if (!node_id) {
      return new Response(JSON.stringify({ error: "node_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: node, error: nodeErr } = await supabaseAdmin
      .from("canvas_nodes")
      .select("*")
      .eq("id", node_id)
      .eq("user_id", userId)
      .single();

    if (nodeErr || !node) {
      return new Response(JSON.stringify({ error: "Node not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cost = node.type === "image" ? 1 : 20;

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("credits_balance")
      .eq("user_id", userId)
      .single();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.credits_balance < cost) {
      return new Response(
        JSON.stringify({ error: `Créditos insuficientes. Necesitas ${cost}, tienes ${profile.credits_balance}` }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct credits
    await supabaseAdmin
      .from("profiles")
      .update({ credits_balance: profile.credits_balance - cost })
      .eq("user_id", userId);

    await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      node_id: node_id,
      type: "debit",
      amount: cost,
      description: `${node.type} generation: ${node.prompt.slice(0, 50)}`,
    });

    await supabaseAdmin
      .from("canvas_nodes")
      .update({ status: "loading", error_message: null })
      .eq("id", node_id);

    if (node.type === "image") {
      try {
        const aiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${googleApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `Generate a high-quality image: ${node.prompt}` }],
              }],
              generationConfig: {
                responseModalities: ["TEXT", "IMAGE"],
              },
            }),
          }
        );

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error("Google Gemini error:", aiResponse.status, errText);

          // Rollback credits
          await supabaseAdmin
            .from("profiles")
            .update({ credits_balance: profile.credits_balance })
            .eq("user_id", userId);

          await supabaseAdmin.from("transactions").insert({
            user_id: userId,
            node_id: node_id,
            type: "credit",
            amount: cost,
            description: `Rollback: AI generation failed`,
          });

          const errorMsg =
            aiResponse.status === 429
              ? "Límite de solicitudes excedido. Intenta en un momento."
              : `Generación de IA falló (${aiResponse.status})`;

          await supabaseAdmin
            .from("canvas_nodes")
            .update({ status: "error", error_message: errorMsg })
            .eq("id", node_id);

          return new Response(JSON.stringify({ error: errorMsg }), {
            status: aiResponse.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const result = await aiResponse.json();
        let imageUrl: string | null = null;

        // Extract image from Gemini response
        const candidates = result.candidates;
        if (candidates?.[0]?.content?.parts) {
          for (const part of candidates[0].content.parts) {
            if (part.inlineData?.mimeType?.startsWith("image/")) {
              imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              break;
            }
          }
        }

        if (!imageUrl) {
          console.error("No image in Gemini response:", JSON.stringify(result).slice(0, 500));
          
          // Rollback
          await supabaseAdmin
            .from("profiles")
            .update({ credits_balance: profile.credits_balance })
            .eq("user_id", userId);

          await supabaseAdmin.from("transactions").insert({
            user_id: userId,
            node_id: node_id,
            type: "credit",
            amount: cost,
            description: `Rollback: No image generated`,
          });

          await supabaseAdmin
            .from("canvas_nodes")
            .update({ status: "error", error_message: "No se pudo generar la imagen. Intenta con otro prompt." })
            .eq("id", node_id);

          return new Response(
            JSON.stringify({ error: "No image generated. Try a different prompt." }),
            { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await supabaseAdmin
          .from("canvas_nodes")
          .update({ status: "ready", asset_url: imageUrl, error_message: null })
          .eq("id", node_id);

        await supabaseAdmin.from("saved_assets").insert({
          user_id: userId,
          node_id: node_id,
          asset_url: imageUrl,
          prompt: node.prompt,
          type: "image",
          tags: [],
        });

        return new Response(
          JSON.stringify({ success: true, asset_url: imageUrl }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (aiErr) {
        console.error("AI call error:", aiErr);

        await supabaseAdmin
          .from("profiles")
          .update({ credits_balance: profile.credits_balance })
          .eq("user_id", userId);

        await supabaseAdmin.from("transactions").insert({
          user_id: userId,
          node_id: node_id,
          type: "credit",
          amount: cost,
          description: `Rollback: ${(aiErr as Error).message}`,
        });

        await supabaseAdmin
          .from("canvas_nodes")
          .update({ status: "error", error_message: "Generación fallida. Créditos reembolsados." })
          .eq("id", node_id);

        return new Response(JSON.stringify({ error: "AI generation failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Video type - not yet supported
    await supabaseAdmin
      .from("canvas_nodes")
      .update({ status: "error", error_message: "Generación de video próximamente" })
      .eq("id", node_id);

    await supabaseAdmin
      .from("profiles")
      .update({ credits_balance: profile.credits_balance })
      .eq("user_id", userId);

    await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      node_id: node_id,
      type: "credit",
      amount: cost,
      description: `Rollback: video not yet supported`,
    });

    return new Response(
      JSON.stringify({ success: false, message: "Video generation not yet available" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-image error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
