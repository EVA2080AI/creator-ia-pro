import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OR_BASE   = 'https://openrouter.ai/api/v1';
const OR_REFERER = 'https://creator-ia.com';
const OR_TITLE   = 'Creator IA Pro - AI Infinite Canvas';

// ── Per-user rate limiting (20 req/min for openrouter + openrouter-image) ─────
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

/** Extract user_id from Supabase JWT without full verification (proxy layer only) */
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

// Image model fallback chain (in order)
const IMAGE_FALLBACK_MODELS = [
  'black-forest-labs/flux-1-schnell',
  'black-forest-labs/flux-1-pro',
  'stability-ai/sdxl',
];

// Models that use chat/completions with modalities instead of /images/generations
const MODALITIES_IMAGE_MODELS = new Set([
  'google/gemini-2.0-flash-exp:free',
  'google/gemini-2.0-flash-exp-image-generation',
  'recraft-ai/recraft-v3',
]);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Validate response is JSON, not an HTML error page */
async function parseJsonOrThrow(res: Response, label: string): Promise<unknown> {
  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('text/html') || ct.includes('text/plain')) {
    const preview = await res.text();
    console.error(`[${label}] Non-JSON response (${res.status}):`, preview.slice(0, 200));
    throw new Error(`${label} returned non-JSON (HTTP ${res.status}). Endpoint may be unavailable.`);
  }
  const data = await res.json();
  if (!res.ok) {
    const msg = (data as any)?.error?.message || (data as any)?.error || `HTTP ${res.status}`;
    console.error(`[${label}] API error:`, JSON.stringify(data).slice(0, 300));
    throw new Error(msg);
  }
  return data;
}

async function openrouterFetch(path: string, body: unknown, stream = false): Promise<Response> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured in Supabase secrets.');

  return fetch(`${OR_BASE}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': OR_REFERER,
      'X-Title': OR_TITLE,
    },
    body: JSON.stringify(body),
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json();
    const { provider, path: urlPath, body: reqBody } = payload;

    if (!provider) return json({ error: 'Missing provider' }, 400);

    // ── Rate limit check for costly providers ─────────────────────────────────
    if (provider === 'openrouter' || provider === 'openrouter-image') {
      const userId = extractUserIdFromJwt(req.headers.get('authorization'));
      const key = userId ?? req.headers.get('x-forwarded-for') ?? 'anonymous';
      if (!checkRateLimit(key)) {
        console.warn(`[ai-proxy] Rate limit exceeded for key: ${key}`);
        return json({ error: 'Demasiadas solicitudes. Espera un momento antes de continuar.' }, 429);
      }
    }

    // ── OpenRouter — Chat / Text ──────────────────────────────────────────────
    if (provider === 'openrouter') {
      if (!urlPath) return json({ error: 'Missing path for openrouter provider' }, 400);

      const streamMode = reqBody?.stream === true;
      const res = await openrouterFetch(urlPath, reqBody, streamMode);

      // Stream passthrough for chat
      if (streamMode && res.ok && res.body) {
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

      const data = await parseJsonOrThrow(res, 'OpenRouter');
      return json(data);
    }

    // ── OpenRouter — Image Generation ─────────────────────────────────────────
    if (provider === 'openrouter-image') {
      const { prompt, model, width = 1024, height = 1024 } = reqBody || {};
      if (!prompt) return json({ error: 'prompt is required' }, 400);

      const apiKey = Deno.env.get('OPENROUTER_API_KEY');
      if (!apiKey) return json({ error: 'OPENROUTER_API_KEY not configured.' }, 200);

      // Build model fallback list: requested model first, then defaults
      const tryModels = model
        ? [model, ...IMAGE_FALLBACK_MODELS.filter(m => m !== model)]
        : IMAGE_FALLBACK_MODELS;

      const errors: string[] = [];

      for (const imageModel of tryModels) {
        try {
          console.log(`[Image] Trying: ${imageModel}`);

          // Use chat/completions with modalities for supported models
          if (MODALITIES_IMAGE_MODELS.has(imageModel)) {
            const res = await openrouterFetch('chat/completions', {
              model: imageModel,
              messages: [{ role: 'user', content: prompt }],
              modalities: ['image', 'text'],
            });
            const ct = res.headers.get('content-type') ?? '';
            if (!ct.includes('text/html')) {
              const data = await res.json().catch(() => ({})) as any;
              if (res.ok) {
                const content = data?.choices?.[0]?.message?.content;
                if (Array.isArray(content)) {
                  const imgItem = content.find((c: any) => c.type === 'image_url');
                  if (imgItem?.image_url?.url) return json({ url: imgItem.image_url.url, model: imageModel });
                }
                // Inline base64
                if (data?.choices?.[0]?.message?.content_parts) {
                  const parts = data.choices[0].message.content_parts;
                  const img = parts.find((p: any) => p.type === 'image');
                  if (img?.image_url) return json({ url: img.image_url, model: imageModel });
                }
              }
            }
            errors.push(`${imageModel}: modalities response had no image`);
            continue;
          }

          const res = await fetch(`${OR_BASE}/images/generations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': OR_REFERER,
              'X-Title': OR_TITLE,
            },
            body: JSON.stringify({
              model: imageModel,
              prompt,
              n: 1,
              size: `${width}x${height}`,
              response_format: 'url',
            }),
          });

          const ct = res.headers.get('content-type') ?? '';

          if (ct.includes('text/html')) {
            errors.push(`${imageModel}: HTML response (${res.status})`);
            continue;
          }

          const data = await res.json().catch(() => ({})) as any;

          if (!res.ok) {
            const msg = data?.error?.message || data?.error || `HTTP ${res.status}`;
            console.warn(`[Image] ${imageModel} → ${res.status}: ${msg}`);
            errors.push(`${imageModel}: ${msg}`);
            continue;
          }

          // Standard OpenAI image response
          const item = data?.data?.[0];
          if (item?.b64_json) return json({ url: `data:image/png;base64,${item.b64_json}`, model: imageModel });
          if (item?.url)      return json({ url: item.url, model: imageModel });

          // Some providers return url at top level
          if (data?.url) return json({ url: data.url, model: imageModel });

          console.warn(`[Image] ${imageModel} → no image in response:`, JSON.stringify(data).slice(0, 200));
          errors.push(`${imageModel}: no image data`);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          console.warn(`[Image] ${imageModel} threw: ${msg}`);
          errors.push(`${imageModel}: ${msg}`);
        }
      }

      // Return 200 so the client receives the error message (not a thrown exception)
      return json({ error: `Generación fallida: ${errors.slice(0, 2).join(' | ')}` }, 200);
    }

    // ── Gemini (fallback for chat) ────────────────────────────────────────────
    if (provider === 'gemini') {
      const apiKey = Deno.env.get('GEMINI_API_KEY');
      if (!apiKey) return json({ error: 'GEMINI_API_KEY not configured in Supabase secrets.' }, 503);

      const fetchUrl = `https://generativelanguage.googleapis.com/v1beta/${urlPath}?key=${apiKey}`;
      const res = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      });

      const ct = res.headers.get('content-type') ?? '';
      if (!res.ok) {
        const errText = await res.text();
        console.error(`[Gemini] ${res.status}:`, errText.slice(0, 200));
        return json({ error: errText.slice(0, 200) }, res.status);
      }
      const data = ct.includes('application/json') ? await res.json() : await res.text();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return json({ error: `Unknown provider: ${provider}` }, 400);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ai-proxy] Unhandled error:', msg);
    return json({ error: msg }, 500);
  }
});
