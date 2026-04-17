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
    const replicateApiToken = Deno.env.get("REPLICATE_API_TOKEN");
    if (!replicateApiToken) {
      throw new Error("REPLICATE_API_TOKEN is not configured in Supabase Secrets.");
    }

    const { tool, image_url, mask_url, prompt } = await req.json();
    if (!tool) {
      throw new Error("Falta el parámetro tool.");
    }

    let modelSlug = "";
    let modelVersion = "";
    let input: Record<string, string | number | boolean | undefined> = {};

    // ── VIDEO MODEL HANDLERS ─────────────────────────────────────────────────────

    /** Google Veo 3 Video Generation */
    async function generateVeo3Video(prompt: string, imageUrl?: string): Promise<string> {
      const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
      if (!geminiApiKey) throw new Error("GEMINI_API_KEY not configured for Veo-3.");

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/veo-3-generate-preview:generateVideo?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt || "A cinematic scene",
            image: imageUrl ? { mimeType: "image/jpeg", bytes: imageUrl } : undefined,
            aspectRatio: "16:9",
            durationSeconds: 8,
            personGeneration: "DONT_ALLOW",
            enhancePrompt: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[Veo-3] API Error:", errorData);
        throw new Error(`Veo-3 API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const operationName = data.name;

      if (!operationName) {
        throw new Error("Veo-3 did not return an operation name.");
      }

      // Poll for video generation completion
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds between polls

        const pollRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${geminiApiKey}`
        );
        const pollData = await pollRes.json();

        if (pollData.done) {
          if (pollData.error) {
            throw new Error(`Veo-3 generation failed: ${pollData.error.message}`);
          }
          const videoData = pollData.response?.video?.videoData;
          if (videoData) {
            return `data:video/mp4;base64,${videoData}`;
          }
          throw new Error("Veo-3 returned no video data.");
        }
      }

      throw new Error("Veo-3 generation timed out after 5 minutes.");
    }

    /** Replicate Video Models (SVD, etc.) */
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

    // Mapeo industrial a modelos de Replicate
    switch (tool) {
      case "generate":
        // Flux Schnell (black-forest-labs/flux-schnell)
        modelSlug = "black-forest-labs/flux-schnell";
        input = { prompt: prompt || "A professional creative design" };
        break;
      case "background":
        if (!image_url) throw new Error("Falta image_url");
        // Remove BG HQ (lucataco/remove-bg)
        modelVersion = "95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1";
        input = { image: image_url };
        break;
      case "upscale":
        // Real-ESRGAN (nightmareai/real-esrgan)
        modelVersion = "42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b";
        input = { image: image_url, scale: 4, face_enhance: true };
        break;
      case "restore":
        // GFPGAN - Face restoration
        modelVersion = "9283608cb6b01c6f1f415392fe19cdab3cd62fcdd959bc2d449dae9fead8408a";
        input = { img: image_url, scale: 2, version: "v1.4" };
        break;
      case "enhance":
        // Codeformer - General enhancement
        modelVersion = "7de2ea26c61f15beb8d1a3ba5b583f721d09e519e48f7ee6f1a8c9918fb59dd3";
        input = { image: image_url, face_upsample: true, background_enhance: true, upsample: 2 };
        break;
      case "video":
        // Video generation with model selection
        const videoModel = (prompt as any)?.model || "svd";
        const videoPrompt = (prompt as any)?.prompt || prompt || "A cinematic scene";

        if (videoModel === "veo-3") {
          // Veo-3 uses Gemini API
          const videoUrl = await generateVeo3Video(videoPrompt, image_url);
          return new Response(JSON.stringify({ url: videoUrl, model: "veo-3" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else if (videoModel === "luma") {
          // Luma Dream Machine
          const videoUrl = await generateReplicateVideo("luma-ai/dream-machine", {
            prompt: videoPrompt,
            image_url: image_url,
          });
          return new Response(JSON.stringify({ url: videoUrl, model: "luma" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else if (videoModel === "pika") {
          // Pika Labs
          const videoUrl = await generateReplicateVideo("pikalabs/pika", {
            prompt: videoPrompt,
            image: image_url,
            motion_scale: 1.0,
          });
          return new Response(JSON.stringify({ url: videoUrl, model: "pika" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else {
          // Default: Stable Video Diffusion
          modelSlug = "stability-ai/stable-video-diffusion";
          input = {
            motion_bucket_id: 127,
            frames_per_second: 6,
            sizing_strategy: "maintain_aspect_ratio"
          };
          if (image_url) input.input_image = image_url;
          const videoUrl = await generateReplicateVideo(modelSlug, input);
          return new Response(JSON.stringify({ url: videoUrl, model: "svd" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        break;
      case "variation":
      case "style":
      case "product":
        // These are handled client-side via ai-proxy (img2img with GPT-5 Image Mini)
        throw new Error(`La herramienta "${tool}" debe llamarse a través de ai-proxy con imagen de entrada.`);
      case "eraser":
        throw new Error("La herramienta borrar requiere una máscara de borrado (próximamente).");
      default:
        throw new Error(`Tool "${tool}" no está soportada por el proxy de medios.`);
    }

    console.log(`[Media Proxy] Llamando a Replicate para herramienta: ${tool}`);

    // Call Replicate API to start prediction
    const apiUrl = modelSlug 
      ? `https://api.replicate.com/v1/models/${modelSlug}/predictions`
      : `https://api.replicate.com/v1/predictions`;

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Token ${replicateApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(modelSlug ? { input } : { version: modelVersion, input }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Replicate Error:", errorText);
      throw new Error(`Replicate error: ${res.status} - ${errorText}`);
    }

    const prediction = await res.json();
    const pollUrl = prediction.urls.get;

    // Poll until completion (max 60 seconds)
    let resultUrl = null;
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const checkRes = await fetch(pollUrl, {
            headers: { "Authorization": `Token ${replicateApiToken}` }
        });
        const checkData = await checkRes.json();
        
        if (checkData.status === "succeeded") {
            resultUrl = checkData.output;
            break;
        } else if (checkData.status === "failed") {
            console.error("Replicate Prediction Failed:", checkData.error);
            throw new Error("Fallo en la predicción industrial de imagen.");
        }
    }

    if (!resultUrl) {
      throw new Error("Timeout: La IA tardó demasiado en procesar la imagen.");
    }

    const finalImageUrl = Array.isArray(resultUrl) ? resultUrl[0] : resultUrl;

    return new Response(JSON.stringify({ url: finalImageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

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
