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
    const { provider, path, body } = await req.json();

    if (!provider || !path || !body) {
      return json({ error: 'Missing provider, path or body' }, 400);
    }

    // ── OpenRouter ────────────────────────────────────────────────────────────
    if (provider === 'openrouter') {
      const apiKey =
        Deno.env.get('OPENROUTER_API_KEY') ||
        Deno.env.get('VITE_OPENROUTER_API_KEY');

      if (!apiKey) {
        console.error('[ai-proxy] OPENROUTER_API_KEY not set in Supabase secrets');
        return json({
          error: 'OpenRouter API key not configured. Set OPENROUTER_API_KEY in Supabase project secrets.',
          code: 'MISSING_API_KEY',
        }, 503);
      }

      const fetchUrl = `https://openrouter.ai/api/v1/${path}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://creator-ia.com',
        'X-Title': 'Creator IA Pro',
      };

      const streamMode = body?.stream === true;
      const res = await fetch(fetchUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[OpenRouter] Error ${res.status}:`, errText.slice(0, 200));
        return new Response(errText, {
          status: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (streamMode && res.body) {
        return new Response(res.body, {
          status: res.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
          },
        });
      }

      const data = await res.text();
      return new Response(data, {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Gemini ────────────────────────────────────────────────────────────────
    if (provider === 'gemini') {
      const apiKey =
        Deno.env.get('GEMINI_API_KEY') ||
        Deno.env.get('VITE_GEMINI_API_KEY');

      if (!apiKey) {
        console.error('[ai-proxy] GEMINI_API_KEY not set in Supabase secrets');
        return json({
          error: 'Gemini API key not configured. Set GEMINI_API_KEY in Supabase project secrets.',
          code: 'MISSING_API_KEY',
        }, 503);
      }

      const fetchUrl = `https://generativelanguage.googleapis.com/v1beta/${path}?key=${apiKey}`;
      const res = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[Gemini] Error ${res.status}:`, errText.slice(0, 200));
        return new Response(errText, {
          status: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await res.text();
      return new Response(data, {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Pollinations (no API key, server-side to avoid CORS) ──────────────────
    if (provider === 'pollinations') {
      const { prompt, seed, width, height } = body;
      const encoded = encodeURIComponent(prompt);
      const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width || 1024}&height=${height || 1024}&seed=${seed || 0}&nologo=true&enhance=true&model=flux`;

      const imgRes = await fetch(url);
      if (!imgRes.ok) return json({ error: `Pollinations error: ${imgRes.status}` }, 502);

      const blob = await imgRes.blob();
      if (blob.type.startsWith('text/')) return json({ error: 'Pollinations returned HTML, retry' }, 502);

      const buffer = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      const mime = blob.type.startsWith('image/') ? blob.type : 'image/png';
      return json({ url: `data:${mime};base64,${base64}` });
    }

    return json({ error: `Provider not supported: ${provider}` }, 400);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ai-proxy] Unhandled error:', msg);
    return json({ error: msg }, 500);
  }
});
