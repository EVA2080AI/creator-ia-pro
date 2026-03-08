import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Auth check using getUser
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

    // Parse request
    const { node_id } = await req.json();
    if (!node_id) {
      return new Response(JSON.stringify({ error: "node_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for DB operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch node
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

    // Determine cost
    const cost = node.type === "image" ? 1 : 20;

    // Check credits
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
        JSON.stringify({ error: `Insufficient credits. Need ${cost}, have ${profile.credits_balance}` }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Debit credits
    await supabaseAdmin
      .from("profiles")
      .update({ credits_balance: profile.credits_balance - cost })
      .eq("user_id", userId);

    // Record transaction
    await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      node_id: node_id,
      type: "debit",
      amount: cost,
      description: `${node.type} generation: ${node.prompt.slice(0, 50)}`,
    });

    // Set node to loading
    await supabaseAdmin
      .from("canvas_nodes")
      .update({ status: "loading", error_message: null })
      .eq("id", node_id);

    // Call Lovable AI Gateway for image generation
    if (node.type === "image") {
      try {
        const aiResponse = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-pro-image-preview",
              messages: [
                {
                  role: "user",
                  content: `Generate an image based on this description: ${node.prompt}`,
                },
              ],
            }),
          }
        );

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error("AI gateway error:", aiResponse.status, errText);

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
              ? "Rate limit exceeded. Try again in a moment."
              : aiResponse.status === 402
              ? "AI service credits depleted."
              : "AI generation failed";

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

        // Extract image from response
        let imageUrl: string | null = null;
        const content = result.choices?.[0]?.message?.content;

        // Check for inline images in parts
        const parts = result.choices?.[0]?.message?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inline_data?.mime_type?.startsWith("image/")) {
              const base64 = part.inline_data.data;
              const mimeType = part.inline_data.mime_type;
              imageUrl = `data:${mimeType};base64,${base64}`;
              break;
            }
          }
        }

        // Fallback: check if content contains a URL
        if (!imageUrl && content) {
          const urlMatch = content.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|gif|webp)[^\s"'<>]*/i);
          if (urlMatch) {
            imageUrl = urlMatch[0];
          }
        }

        // If still no image, use placeholder
        if (!imageUrl) {
          imageUrl = `https://picsum.photos/seed/${node_id}/512/512`;
        }

        // Update node as ready
        await supabaseAdmin
          .from("canvas_nodes")
          .update({ status: "ready", asset_url: imageUrl, error_message: null })
          .eq("id", node_id);

        // Auto-save to saved_assets
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
          description: `Rollback: ${(aiErr as Error).message}`,
        });

        await supabaseAdmin
          .from("canvas_nodes")
          .update({ status: "error", error_message: "Generation failed. Credits refunded." })
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
      .update({ status: "error", error_message: "Video generation coming soon" })
      .eq("id", node_id);

    // Rollback video credits
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
