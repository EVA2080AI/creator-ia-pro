import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { provider, path: urlPath } = body;

    if (!provider) return json({ error: 'Missing provider' }, 400);

    // ── OpenRouter (text/chat) ────────────────────────────────────────────────
    if (provider === 'openrouter') {
      const apiKey = Deno.env.get('OPENROUTER_API_KEY') || Deno.env.get('VITE_OPENROUTER_API_KEY');
      if (!apiKey) return json({ error: 'OPENROUTER_API_KEY not configured', code: 'MISSING_API_KEY' }, 503);

      const reqBody = body.body;
      const streamMode = reqBody?.stream === true;
      const fetchUrl = `https://openrouter.ai/api/v1/${urlPath}`;

      const res = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://creator-ia.com',
          'X-Title': 'Creator IA Pro',
        },
        body: JSON.stringify(reqBody),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[OpenRouter] ${res.status}:`, errText.slice(0, 300));
        // If HTML returned (wrong endpoint), return a proper error
        if (errText.trim().startsWith('<')) {
          return json({ error: `OpenRouter endpoint not available: ${urlPath}` }, 502);
        }
        return new Response(errText, {
          status: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (streamMode && res.body) {
        return new Response(res.body, {
          status: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
        });
      }
      const data = await res.text();
      return new Response(data, { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Gemini (text) ─────────────────────────────────────────────────────────
    if (provider === 'gemini') {
      const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('VITE_GEMINI_API_KEY');
      if (!apiKey) return json({ error: 'GEMINI_API_KEY not configured', code: 'MISSING_API_KEY' }, 503);

      const fetchUrl = `https://generativelanguage.googleapis.com/v1beta/${urlPath}?key=${apiKey}`;
      const res = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body.body),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[Gemini] ${res.status}:`, errText.slice(0, 200));
        return new Response(errText, { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const data = await res.text();
      return new Response(data, { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Replicate (image generation) ─────────────────────────────────────────
    if (provider === 'replicate') {
      const apiKey = Deno.env.get('REPLICATE_API_TOKEN');
      if (!apiKey) return json({ error: 'REPLICATE_API_TOKEN not configured', code: 'MISSING_API_KEY' }, 503);

      const { prompt, width = 1024, height = 1024 } = body.body || {};
      if (!prompt) return json({ error: 'prompt is required' }, 400);

      // Create prediction (sync wait mode)
      const createRes = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait',
        },
        body: JSON.stringify({
          input: { prompt, width, height, num_outputs: 1, num_inference_steps: 4, output_format: 'webp' },
        }),
      });

      const prediction = await createRes.json();
      if (!createRes.ok) {
        console.error('[Replicate] Create error:', JSON.stringify(prediction).slice(0, 200));
        return json({ error: prediction?.detail || 'Replicate error' }, 502);
      }

      // If already completed (sync wait)
      if (prediction.status === 'succeeded' && prediction.output?.[0]) {
        const imageUrl = prediction.output[0];
        // Fetch and convert to base64 to avoid CORS on client
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) return json({ url: imageUrl }); // Return URL as fallback
        const buffer = await imgRes.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        const mime = imgRes.headers.get('content-type') || 'image/webp';
        return json({ url: `data:${mime};base64,${base64}` });
      }

      // Poll until done (max 55s)
      const predId = prediction.id;
      const deadline = Date.now() + 55_000;
      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 2000));
        const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const poll = await pollRes.json();
        if (poll.status === 'succeeded' && poll.output?.[0]) {
          const imageUrl = poll.output[0];
          const imgRes = await fetch(imageUrl);
          if (!imgRes.ok) return json({ url: imageUrl });
          const buffer = await imgRes.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          const mime = imgRes.headers.get('content-type') || 'image/webp';
          return json({ url: `data:${mime};base64,${base64}` });
        }
        if (poll.status === 'failed' || poll.status === 'canceled') {
          return json({ error: `Replicate prediction ${poll.status}: ${poll.error || 'unknown'}` }, 502);
        }
      }
      return json({ error: 'Replicate timed out' }, 504);
    }

    // ── Pollinations (fallback, no auth — server-side fetch) ──────────────────
    if (provider === 'pollinations') {
      const { prompt, seed, width = 1024, height = 1024 } = body.body || {};
      if (!prompt) return json({ error: 'prompt is required' }, 400);

      const encoded = encodeURIComponent(prompt);
      // Try old domain first (may still work for some requests), then new
      const urls = [
        `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed || Math.floor(Math.random()*999999)}&nologo=true&model=flux`,
      ];

      for (const url of urls) {
        try {
          const imgRes = await fetch(url, { signal: AbortSignal.timeout(25_000) });
          if (!imgRes.ok) continue;
          const blob = await imgRes.blob();
          if (!blob.type.startsWith('image/')) continue;
          const buffer = await blob.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          return json({ url: `data:${blob.type};base64,${base64}` });
        } catch { continue; }
      }
      return json({ error: 'Pollinations unavailable' }, 502);
    }

    return json({ error: `Provider not supported: ${provider}` }, 400);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ai-proxy] Unhandled error:', msg);
    return json({ error: msg }, 500);
  }
});
