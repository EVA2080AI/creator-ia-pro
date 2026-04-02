import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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
  // Probabilistic cleanup to prevent unbounded map growth (~1% of requests)
  if (Math.random() < 0.01) {
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now >= entry.resetAt) rateLimitMap.delete(key);
    }
  }
  const entry = rateLimitMap.get(userId);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

/** 
 * Robust JWT verification and Credit Check
 * Since verify_jwt is false at the platform level, we must verify manually.
 */
async function verifyUserAndCredits(req: Request, supabaseAdmin: any) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('No se encontró token de autorización. Por favor inicia sesión.');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    console.error('[ai-proxy] Auth error:', authError);
    throw new Error('Sesión inválida o expirada. Por favor vuelve a ingresar.');
  }

  // Check credits
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('credits_balance, subscription_tier')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('No se pudo verificar el perfil del usuario.');
  }

  const balance = profile.credits_balance ?? 0;
  if (balance <= 0) {
    throw new Error('Créditos agotados. Por favor recarga tu plan para continuar.');
  }

  return { user, profile };
}

// Normalize legacy/broken model slugs → verified OpenRouter slugs
// This runs BEFORE the fallback chain so old frontend code still works.
const BROKEN_MODEL_FIX: Record<string, string> = {
  'google/gemini-2.5-flash-image':            'google/gemini-2.0-flash-exp:free',
  'google/gemini-3.1-flash-image-preview':    'google/gemini-2.0-flash-exp:free',
  'openai/gpt-5-image-mini':                  'openai/dall-e-3',
  'openai/gpt-5-image':                       'openai/dall-e-3',
  'black-forest-labs/flux-schnell':           'google/gemini-2.0-flash-exp:free', // FLUX not on /images/generations
  'black-forest-labs/flux-1.1-pro':           'openai/dall-e-3',
};

// Image model fallback chain — ONLY models verified on OpenRouter's /images/generations
// OR modalities path. Ordered cheapest first.
const IMAGE_FALLBACK_MODELS = [
  'google/gemini-2.0-flash-exp:free',   // Free via modalities
  'openai/dall-e-3',                    // Paid — very reliable
  'openai/dall-e-2',                    // Paid — cheaper fallback
];

// Models that use POST /chat/completions with modalities=['image','text']
// (NOT the /images/generations endpoint)
const MODALITIES_IMAGE_MODELS = new Set([
  'google/gemini-2.0-flash-exp:free',
  'google/gemini-2.0-flash-exp-image-generation',
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
    console.error('[' + label + '] Non-JSON response (' + res.status + '):', preview.slice(0, 200));
    throw new Error(label + ' returned non-JSON (HTTP ' + res.status + '). Endpoint may be unavailable.');
  }
  const data = await res.json();
  if (!res.ok) {
    const msg = (data as any)?.error?.message || (data as any)?.error || 'HTTP ' + res.status;
    console.error(`[${label}] API error:`, JSON.stringify(data).slice(0, 300));
    throw new Error(msg);
  }
  return data;
}

async function openrouterFetch(path: string, body: unknown, stream = false): Promise<Response> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured in Supabase secrets.');

  return fetch(OR_BASE + '/' + path, {
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

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    // 1. Mandatory Identity & Credit Verification
    const { user } = await verifyUserAndCredits(req, supabaseAdmin);

    const payload = await req.json();
    const { provider, path: urlPath, body: reqBody } = payload;

    if (!provider) return json({ error: 'Missing provider' }, 400);

    // 2. Rate limit check (now using verified user ID)
    if (provider === 'openrouter' || provider === 'openrouter-image') {
      if (!checkRateLimit(user.id)) {
        console.warn('[ai-proxy] Rate limit exceeded for user: ' + user.id);
        return json({ error: 'Demasiadas solicitudes. Espera un momento antes de continuar.', code: 'rate_limit' }, 200);
      }
    }

    // ── OpenRouter — Chat / Text ──────────────────────────────────────────────
    if (provider === 'openrouter') {
      if (!urlPath) return json({ error: 'Missing path for openrouter provider' }, 400);

      // Validate model ID format to prevent injection of arbitrary slugs
      const model = reqBody?.model as string | undefined;
      if (model && !/^[a-z0-9@._\-\/]{3,80}$/i.test(model)) {
        return json({ error: `Invalid model ID: ${model}` }, 400);
      }

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

      try {
        const data = await parseJsonOrThrow(res, 'OpenRouter');
        return json(data);
      } catch (orErr: unknown) {
        const msg = orErr instanceof Error ? orErr.message : String(orErr);
        console.error('[ai-proxy] OpenRouter text error:', msg);
        return json({ error: msg }, 200);
      }
    }

    // ── OpenRouter — Image Generation ─────────────────────────────────────────
    if (provider === 'openrouter-image') {
      const { prompt, model, width = 1024, height = 1024, image_url } = reqBody || {};
      if (!prompt) return json({ error: 'prompt is required' }, 400);

      const apiKey = Deno.env.get('OPENROUTER_API_KEY');
      if (!apiKey) return json({ error: 'OPENROUTER_API_KEY not configured.' }, 200);

      // Normalize legacy/broken slugs before building the fallback list
      const normalizedModel = model ? (BROKEN_MODEL_FIX[model] ?? model) : null;

      // Build model fallback list: normalized requested model first, then defaults
      const tryModels = normalizedModel
        ? [normalizedModel, ...IMAGE_FALLBACK_MODELS.filter(m => m !== normalizedModel)]
        : IMAGE_FALLBACK_MODELS;

      const errors: string[] = [];

      for (const imageModel of tryModels) {
        try {
          console.log('[Image] Trying: ' + imageModel);

          // Use chat/completions with modalities for supported models
          if (MODALITIES_IMAGE_MODELS.has(imageModel)) {
            // Support img2img: if image_url provided, include it in message content
            const userContent = image_url
              ? [
                  { type: 'image_url', image_url: { url: image_url } },
                  { type: 'text', text: prompt },
                ]
              : prompt;

            // 90-second per-model timeout so we can try fallback before edge function times out
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 90_000);

            const apiKey = Deno.env.get('OPENROUTER_API_KEY')!;
            const resRaw = await fetch(`${OR_BASE}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey,
                'HTTP-Referer': OR_REFERER,
                'X-Title': OR_TITLE,
              },
              body: JSON.stringify({
                model: imageModel,
                messages: [{ role: 'user', content: userContent }],
                modalities: ['image', 'text'],
              }),
              signal: controller.signal,
            }).finally(() => clearTimeout(timeoutId));
            const res = resRaw;
            const ct = res.headers.get('content-type') ?? '';
            if (!ct.includes('text/html')) {
              const data = await res.json().catch(() => ({})) as any;
              console.log('[Image] ' + imageModel + ' modalities response keys:', Object.keys(data?.choices?.[0]?.message ?? {}));
              if (res.ok) {
                const msg = data?.choices?.[0]?.message ?? {};
                const content = msg.content;

                // Format 1: content array with image_url items (standard OpenRouter/Gemini)
                if (Array.isArray(content)) {
                  const imgItem = content.find((c: any) => c.type === 'image_url');
                  if (imgItem?.image_url?.url) return json({ url: imgItem.image_url.url, model: imageModel });
                  // Some models return inline_data (base64) instead of image_url
                  const inlineItem = content.find((c: any) => c.type === 'image' || c.inline_data);
                  if (inlineItem?.inline_data?.data) {
                    const mime = inlineItem.inline_data.mime_type ?? 'image/png';
                    return json({ url: 'data:' + mime + ';base64,' + inlineItem.inline_data.data, model: imageModel });
                  }
                }
                // Format 2: content is a string with a data URI
                if (typeof content === 'string' && content.startsWith('data:image')) {
                  return json({ url: content, model: imageModel });
                }
                // Format 3: message.images array
                if (Array.isArray(msg.images) && msg.images.length > 0) {
                  const img = msg.images[0];
                  const url = img?.image_url?.url ?? img?.url ?? img;
                  if (typeof url === 'string' && url.length > 10) return json({ url, model: imageModel });
                }
                // Format 4: content_parts (legacy)
                if (msg.content_parts) {
                  const img = msg.content_parts.find((p: any) => p.type === 'image');
                  if (img?.image_url) return json({ url: img.image_url, model: imageModel });
                  if (img?.inline_data?.data) {
                    const mime = img.inline_data.mime_type ?? 'image/png';
                    return json({ url: 'data:' + mime + ';base64,' + img.inline_data.data, model: imageModel });
                  }
                }
                console.warn(`[Image] ${imageModel} modalities — no image found in:`, JSON.stringify(data).slice(0, 400));
              } else {
                const errMsg = data?.error?.message ?? data?.error ?? `HTTP ${res.status}`;
                console.warn(`[Image] ${imageModel} error:`, errMsg);
                errors.push(imageModel + ': ' + errMsg);
                continue;
              }
            } else {
              const preview = await res.text().catch(() => '');
              console.warn('[Image] ' + imageModel + ' HTML response (' + res.status + '):', preview.slice(0, 100));
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
              size: width + 'x' + height,
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
            errors.push(imageModel + ': ' + msg);
            continue;
          }

          // Standard OpenAI image response
          const item = data?.data?.[0];
          if (item?.b64_json) return json({ url: 'data:image/png;base64,' + item.b64_json, model: imageModel });
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

      // ULTIMATE FALLBACK: Pollinations.ai (100% Free, no API key required)
      // If all OpenRouter endpoints fail (common issue with billing limits), guarantee an image.
      try {
        console.log('[Image] All OR models failed. Fast-failing to Pollinations.ai fallback.');
        const encPrompt = encodeURIComponent(prompt || 'cool image');
        // Cache buster to ensure fresh generation
        const seed = Math.floor(Math.random() * 1000000);
        const pollinationsUrl = 'https://image.pollinations.ai/prompt/' + encPrompt + '?width=' + width + '&height=' + height + '&nologo=true&enhance=false&model=flux&seed=' + seed;
        
        return json({ url: pollinationsUrl, model: 'pollinations/flux' });
      } catch (fallbackErr) {
        return json({ error: `Generación fallida: ${errors.slice(0, 2).join(' | ')}` }, 200);
      }
    }

    // ── Gemini (fallback for chat) ────────────────────────────────────────────
    if (provider === 'gemini') {
      const apiKey = Deno.env.get('GEMINI_API_KEY');
      if (!apiKey) return json({ error: 'GEMINI_API_KEY not configured in Supabase secrets.' }, 503);

      const fetchUrl = 'https://generativelanguage.googleapis.com/v1beta/' + urlPath + '?key=' + apiKey;
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
    return json({ error: msg }, 200);
  }
});
