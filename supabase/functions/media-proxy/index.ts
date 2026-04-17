// Deno Edge Function — types provided by supabase/functions/tsconfig.json

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Extract user_id from Supabase JWT (proxy layer — no full crypto verification) */
function extractUserIdFromJwt(authHeader: string | null): string | null {
  try {
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const [, payload] = token.split('.');
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded?.sub ?? null;
  } catch {
    return null;
  }
}

// ── Per-user rate limiting: 10 req/min ───────────────────────────────────────
const RATE_LIMIT_MEDIA = 10;
const RATE_WINDOW_MS = 60_000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MEDIA) return false;
  entry.count++;
  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ── Auth check — require valid JWT ─────────────────────────────────────────
  const userId = extractUserIdFromJwt(req.headers.get("authorization"));
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Rate limit ─────────────────────────────────────────────────────────────
  if (!checkRateLimit(userId)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Máximo 10 peticiones por minuto.", code: "rate_limit" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const falApiKey = Deno.env.get("FAL_KEY");
    if (!falApiKey) {
      throw new Error("FAL_KEY is not configured in Supabase Secrets.");
    }

    const { tool, image_url, mask_url, prompt } = await req.json();
    if (!tool) {
      throw new Error("Falta el parámetro tool.");
    }

    let modelSlug = "";
    let modelVersion = "";
    let input: Record<string, string | number | boolean | undefined> = {};

    // ── FAL.AI VIDEO MODEL HANDLERS ─────────────────────────────────────────────

    /** Fal.ai Video Generation */
    async function generateFalVideo(model: string, input: Record<string, any>): Promise<{ url: string; model: string }> {
      const falApiKey = Deno.env.get("FAL_KEY");
      if (!falApiKey) throw new Error("FAL_KEY not configured.");

      // Map internal model IDs to Fal.ai endpoints
      const FAL_ENDPOINTS: Record<string, string> = {
        'wan-2.5': 'fal-ai/wan/v2.5/text-to-video',
        'wan-i2v': 'fal-ai/wan/v2.5/image-to-video',
        'pika-2.2': 'fal-ai/pika/v2.2/text-to-video',
        'pika-i2v': 'fal-ai/pika/v2.2/image-to-video',
        'luma': 'fal-ai/luma-dream-machine',
        'kling': 'fal-ai/kling/v2.5/text-to-video',
      };

      const endpoint = FAL_ENDPOINTS[model] || FAL_ENDPOINTS['wan-2.5'];

      const res = await fetch(`https://queue.fal.run/${endpoint}`, {
        method: "POST",
        headers: {
          "Authorization": `Key ${falApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...input,
          webhook_url: undefined, // We'll poll instead
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Fal.ai error: ${res.status} - ${errorText}`);
      }

      const { request_id } = await res.json();

      // Poll for completion (max 5 minutes)
      const statusUrl = `https://queue.fal.run/${endpoint}/requests/${request_id}/status`;

      for (let i = 0; i < 150; i++) {
        await new Promise(r => setTimeout(r, 2000));

        const statusRes = await fetch(statusUrl, {
          headers: { "Authorization": `Key ${falApiKey}` }
        });

        if (!statusRes.ok) continue;

        const statusData = await statusRes.json();

        if (statusData.status === "COMPLETED") {
          // Get result
          const resultRes = await fetch(`https://queue.fal.run/${endpoint}/requests/${request_id}`, {
            headers: { "Authorization": `Key ${falApiKey}` }
          });

          if (resultRes.ok) {
            const result = await resultRes.json();
            const videoUrl = result.video?.url || result.output?.video?.url || result.output?.url;
            if (videoUrl) {
              return { url: videoUrl, model };
            }
          }
          throw new Error("Video generation completed but no URL found");
        } else if (statusData.status === "FAILED") {
          throw new Error(`Generation failed: ${statusData.error || 'Unknown error'}`);
        }
      }

      throw new Error("Video generation timed out after 5 minutes.");
    }

    /** Replicate Video Models (SVD - Budget option) */
    async function generateReplicateVideo(model: string, input: Record<string, any>): Promise<string> {
      const replicateApiToken = Deno.env.get("REPLICATE_API_TOKEN");
      if (!replicateApiToken) throw new Error("REPLICATE_API_TOKEN not configured.");

      const res = await fetch(
        `https://api.replicate.com/v1/models/${model}/predictions`,
        {
          method: "POST",
          headers: {
            "Authorization": `Token ${replicateApiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ input }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Replicate error: ${res.status} - ${errorText}`);
      }

      const prediction = await res.json();
      const pollUrl = prediction.urls.get;

      // Poll until completion (max 5 minutes)
      for (let i = 0; i < 150; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const checkRes = await fetch(pollUrl, {
          headers: { "Authorization": `Token ${replicateApiToken}` }
        });
        const checkData = await checkRes.json();

        if (checkData.status === "succeeded") {
          const output = checkData.output;
          return Array.isArray(output) ? output[0] : output;
        } else if (checkData.status === "failed") {
          throw new Error(`Replicate prediction failed: ${checkData.error}`);
        }
      }

      throw new Error("Replicate video generation timed out.");
    }

    // Mapeo a modelos de Fal.ai / Replicate
    switch (tool) {
      case "generate":
        // Flux Schnell via Fal.ai
        const falKey = Deno.env.get("FAL_KEY");
        const imageRes = await fetch("https://queue.fal.run/fal-ai/flux/schnell", {
          method: "POST",
          headers: {
            "Authorization": `Key ${falKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: prompt || "A professional creative design",
            seed: Math.floor(Math.random() * 1000000),
          }),
        });

        if (!imageRes.ok) throw new Error("Failed to generate image");
        const imageData = await imageRes.json();
        const imageUrl = imageData.images?.[0]?.url;
        if (imageUrl) {
          return new Response(JSON.stringify({ url: imageUrl, model: "flux-schnell" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        throw new Error("No image URL in response");

      case "background":
        if (!image_url) throw new Error("Falta image_url");
        // Remove BG via Fal.ai
        const bgRes = await fetch("https://queue.fal.run/fal-ai/bria/background-remove", {
          method: "POST",
          headers: {
            "Authorization": `Key ${falApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image_url }),
        });

        if (!bgRes.ok) throw new Error("Background removal failed");
        const bgData = await bgRes.json();
        return new Response(JSON.stringify({ url: bgData.image?.url, model: "bria-bg-remove" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      case "upscale":
        // Real-ESRGAN via Fal.ai
        const upscaleRes = await fetch("https://queue.fal.run/fal-ai/real-esrgan", {
          method: "POST",
          headers: {
            "Authorization": `Key ${falApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image_url, scale: 4 }),
        });

        if (!upscaleRes.ok) throw new Error("Upscale failed");
        const upscaleData = await upscaleRes.json();
        return new Response(JSON.stringify({ url: upscaleData.image?.url, model: "real-esrgan" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      case "video":
        // Video generation with Fal.ai
        const videoModel = (prompt as any)?.model || "wan-2.5";
        const videoPrompt = (prompt as any)?.prompt || "A cinematic scene";
        const aspectRatio = (prompt as any)?.aspectRatio || "16:9";
        const duration = (prompt as any)?.duration || 5;

        // Budget tier: SVD (Replicate)
        if (videoModel === "svd") {
          const videoUrl = await generateReplicateVideo("stability-ai/stable-video-diffusion", {
            image: image_url,
            motion_bucket_id: 127,
            frames_per_second: 6,
          });
          return new Response(JSON.stringify({ url: videoUrl, model: "svd" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Premium tier: Fal.ai models
        const falInput: any = {
          prompt: videoPrompt,
          aspect_ratio: aspectRatio,
          duration: duration,
          ...(image_url && { image_url }),
        };

        const falResult = await generateFalVideo(videoModel, falInput);
        return new Response(JSON.stringify(falResult), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      case "variation":
      case "style":
      case "product":
        throw new Error(`La herramienta "${tool}" debe llamarse a través de ai-proxy con imagen de entrada.`);

      case "enhance":
        // Codeformer via Fal.ai
        const enhanceRes = await fetch("https://queue.fal.run/fal-ai/codeformer", {
          method: "POST",
          headers: {
            "Authorization": `Key ${falApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image_url, upscale: 2 }),
        });

        if (!enhanceRes.ok) throw new Error("Enhancement failed");
        const enhanceData = await enhanceRes.json();
        return new Response(JSON.stringify({ url: enhanceData.image?.url, model: "codeformer" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      case "eraser":
        throw new Error("La herramienta borrar requiere una máscara de borrado (próximamente).");

      default:
        throw new Error(`Tool "${tool}" no está soportada por el proxy de medios.`);
    }

  } catch (error) {
    const err = error as Error;
    console.error("Media Proxy Failed:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});

export {};
