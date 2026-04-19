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

// ── Circuit Breaker Pattern ───────────────────────────────────────────────────
interface CircuitState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_TIMEOUT_MS = 60_000;
const circuitMap = new Map<string, CircuitState>();

function getCircuitState(model: string): CircuitState {
  if (!circuitMap.has(model)) {
    circuitMap.set(model, { failures: 0, lastFailure: 0, state: 'closed' });
  }
  return circuitMap.get(model)!;
}

function recordSuccess(model: string): void {
  const state = circuitMap.get(model);
  if (state) {
    state.failures = 0;
    state.state = 'closed';
  }
}

function recordFailure(model: string): boolean {
  const state = getCircuitState(model);
  state.failures++;
  state.lastFailure = Date.now();

  if (state.failures >= CIRCUIT_THRESHOLD) {
    state.state = 'open';
    console.warn(`[CircuitBreaker] ${model} is now OPEN`);
    return false;
  }
  return true;
}

function isCircuitOpen(model: string): boolean {
  const state = getCircuitState(model);

  if (state.state === 'open') {
    if (Date.now() - state.lastFailure > CIRCUIT_TIMEOUT_MS) {
      state.state = 'half-open';
      console.log(`[CircuitBreaker] ${model} moved to HALF-OPEN`);
      return false;
    }
    return true;
  }
  return false;
}

// ── Response Caching (simple in-memory) ───────────────────────────────────────
interface CacheEntry {
  data: unknown;
  timestamp: number;
  hits: number;
}

const CACHE_TTL_MS = 30_000;
const MAX_CACHE_SIZE = 100;
const responseCache = new Map<string, CacheEntry>();

function getCacheKey(provider: string, body: unknown): string {
  return `${provider}:${JSON.stringify(body)}`;
}

function getCachedResponse(key: string): unknown | null {
  const entry = responseCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    entry.hits++;
    return entry.data;
  }
  return null;
}

function setCachedResponse(key: string, data: unknown): void {
  if (responseCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = responseCache.keys().next().value;
    responseCache.delete(oldestKey);
  }
  responseCache.set(key, { data, timestamp: Date.now(), hits: 0 });
}

// ── Metrics Collection ────────────────────────────────────────────────────────
interface RequestMetrics {
  total: number;
  success: number;
  errors: number;
  avgLatency: number;
  latencies: number[];
}

const metrics: RequestMetrics = {
  total: 0,
  success: 0,
  errors: 0,
  avgLatency: 0,
  latencies: [],
};

function recordMetrics(success: boolean, latencyMs: number): void {
  metrics.total++;
  if (success) metrics.success++;
  else metrics.errors++;

  metrics.latencies.push(latencyMs);
  if (metrics.latencies.length > 100) {
    metrics.latencies.shift();
  }
  metrics.avgLatency = metrics.latencies.reduce((a, b) => a + b, 0) / metrics.latencies.length;
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
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

const BROKEN_MODEL_FIX: Record<string, string> = {
  'google/gemini-2.5-flash-image':            'google/gemini-2.0-flash-exp:free',
  'google/gemini-3.1-flash-image-preview':    'google/gemini-2.0-flash-exp:free',
  'openai/gpt-5-image-mini':                  'openai/dall-e-3',
  'openai/gpt-5-image':                       'openai/dall-e-3',
  'black-forest-labs/flux-schnell':           'google/gemini-2.0-flash-exp:free',
  'black-forest-labs/flux-1.1-pro':           'openai/dall-e-3',
};

const IMAGE_FALLBACK_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'openai/dall-e-3',
  'openai/dall-e-2',
];

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

  const startTime = Date.now();
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const { user } = await verifyUserAndCredits(req, supabaseAdmin);
    const payload = await req.json();
    const { provider, path: urlPath, body: reqBody } = payload;

    if (!provider) return json({ error: 'Missing provider' }, 400);

    // Check cache for non-streaming requests
    const cacheKey = getCacheKey(provider, reqBody);
    if (reqBody?.stream !== true && provider !== 'openrouter-image') {
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        console.log('[Cache] HIT for', provider);
        return json({ ...cached as object, _cached: true });
      }
    }

    if (provider === 'openrouter' || provider === 'openrouter-image') {
      if (!checkRateLimit(user.id)) {
        console.warn('[ai-proxy] Rate limit exceeded for user: ' + user.id);
        return json({ error: 'Demasiadas solicitudes. Espera un momento antes de continuar.', code: 'rate_limit' }, 200);
      }
    }

    if (provider === 'openrouter') {
      if (!urlPath) return json({ error: 'Missing path for openrouter provider' }, 400);

      const model = reqBody?.model as string | undefined;
      if (model && !/^[a-z0-9@._\-\/]{3,80}$/i.test(model)) {
        return json({ error: `Invalid model ID: ${model}` }, 400);
      }

      // Check circuit breaker
      if (model && isCircuitOpen(model)) {
        return json({ error: `Model ${model} is temporarily unavailable. Try again later.`, code: 'circuit_open' }, 200);
      }

      const streamMode = reqBody?.stream === true;
      const res = await openrouterFetch(urlPath, reqBody, streamMode);

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
        recordMetrics(true, Date.now() - startTime);
        if (model) recordSuccess(model);

        // Cache successful response
        setCachedResponse(cacheKey, data);

        return json(data);
      } catch (orErr: unknown) {
        const msg = orErr instanceof Error ? orErr.message : String(orErr);
        console.error('[ai-proxy] OpenRouter text error:', msg);
        if (model) recordFailure(model);
        recordMetrics(false, Date.now() - startTime);
        return json({ error: msg }, 200);
      }
    }

    if (provider === 'openrouter-image') {
      const { prompt, model, width = 1024, height = 1024, image_url } = reqBody || {};
      if (!prompt) return json({ error: 'prompt is required' }, 400);

      const apiKey = Deno.env.get('OPENROUTER_API_KEY');
      if (!apiKey) return json({ error: 'OPENROUTER_API_KEY not configured.' }, 200);

      const normalizedModel = model ? (BROKEN_MODEL_FIX[model] ?? model) : null;

      // Filter out models with open circuits
      const availableModels = IMAGE_FALLBACK_MODELS.filter(m => !isCircuitOpen(m));
      const tryModels = normalizedModel
        ? [normalizedModel, ...availableModels.filter(m => m !== normalizedModel)]
        : availableModels;

      const errors: string[] = [];

      for (const imageModel of tryModels) {
        try {
          console.log('[Image] Trying: ' + imageModel);

          if (isCircuitOpen(imageModel)) {
            console.warn(`[CircuitBreaker] Skipping ${imageModel} (circuit open)`);
            errors.push(`${imageModel}: circuit open`);
            continue;
          }

          if (MODALITIES_IMAGE_MODELS.has(imageModel)) {
            const userContent = image_url
              ? [
                  { type: 'image_url', image_url: { url: image_url } },
                  { type: 'text', text: prompt },
                ]
              : prompt;

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
                recordSuccess(imageModel);
                const msg = data?.choices?.[0]?.message ?? {};
                const content = msg.content;

                if (Array.isArray(content)) {
                  const imgItem = content.find((c: any) => c.type === 'image_url');
                  if (imgItem?.image_url?.url) {
                    recordMetrics(true, Date.now() - startTime);
                    return json({ url: imgItem.image_url.url, model: imageModel });
                  }
                  const inlineItem = content.find((c: any) => c.type === 'image' || c.inline_data);
                  if (inlineItem?.inline_data?.data) {
                    const mime = inlineItem.inline_data.mime_type ?? 'image/png';
                    recordMetrics(true, Date.now() - startTime);
                    return json({ url: 'data:' + mime + ';base64,' + inlineItem.inline_data.data, model: imageModel });
                  }
                }
                if (typeof content === 'string' && content.startsWith('data:image')) {
                  recordMetrics(true, Date.now() - startTime);
                  return json({ url: content, model: imageModel });
                }
                if (Array.isArray(msg.images) && msg.images.length > 0) {
                  const img = msg.images[0];
                  const url = img?.image_url?.url ?? img?.url ?? img;
                  if (typeof url === 'string' && url.length > 10) {
                    recordMetrics(true, Date.now() - startTime);
                    return json({ url, model: imageModel });
                  }
                }
                if (msg.content_parts) {
                  const img = msg.content_parts.find((p: any) => p.type === 'image');
                  if (img?.image_url) {
                    recordMetrics(true, Date.now() - startTime);
                    return json({ url: img.image_url, model: imageModel });
                  }
                  if (img?.inline_data?.data) {
                    const mime = img.inline_data.mime_type ?? 'image/png';
                    recordMetrics(true, Date.now() - startTime);
                    return json({ url: 'data:' + mime + ';base64,' + img.inline_data.data, model: imageModel });
                  }
                }
                console.warn(`[Image] ${imageModel} modalities — no image found in:`, JSON.stringify(data).slice(0, 400));
              } else {
                const errMsg = data?.error?.message ?? data?.error ?? `HTTP ${res.status}`;
                console.warn(`[Image] ${imageModel} error:`, errMsg);
                recordFailure(imageModel);
                errors.push(imageModel + ': ' + errMsg);
                continue;
              }
            } else {
              const preview = await res.text().catch(() => '');
              console.warn('[Image] ' + imageModel + ' HTML response (' + res.status + '):', preview.slice(0, 100));
              recordFailure(imageModel);
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
            recordFailure(imageModel);
            continue;
          }

          const data = await res.json().catch(() => ({})) as any;

          if (!res.ok) {
            const msg = data?.error?.message || data?.error || `HTTP ${res.status}`;
            console.warn(`[Image] ${imageModel} → ${res.status}: ${msg}`);
            recordFailure(imageModel);
            errors.push(imageModel + ': ' + msg);
            continue;
          }

          recordSuccess(imageModel);
          const item = data?.data?.[0];
          if (item?.b64_json) {
            recordMetrics(true, Date.now() - startTime);
            return json({ url: 'data:image/png;base64,' + item.b64_json, model: imageModel });
          }
          if (item?.url) {
            recordMetrics(true, Date.now() - startTime);
            return json({ url: item.url, model: imageModel });
          }

          if (data?.url) {
            recordMetrics(true, Date.now() - startTime);
            return json({ url: data.url, model: imageModel });
          }

          console.warn(`[Image] ${imageModel} → no image in response:`, JSON.stringify(data).slice(0, 200));
          errors.push(`${imageModel}: no image data`);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          console.warn(`[Image] ${imageModel} threw: ${msg}`);
          recordFailure(imageModel);
          errors.push(`${imageModel}: ${msg}`);
        }
      }

      try {
        console.log('[Image] All OR models failed. Fast-failing to Pollinations.ai fallback.');
        const encPrompt = encodeURIComponent(prompt || 'cool image');
        const seed = Math.floor(Math.random() * 1000000);
        const pollinationsUrl = 'https://image.pollinations.ai/prompt/' + encPrompt + '?width=' + width + '&height=' + height + '&nologo=true&enhance=false&model=flux&seed=' + seed;

        recordMetrics(true, Date.now() - startTime);
        return json({ url: pollinationsUrl, model: 'pollinations/flux' });
      } catch (fallbackErr) {
        recordMetrics(false, Date.now() - startTime);
        return json({ error: `Generación fallida: ${errors.slice(0, 2).join(' | ')}` }, 200);
      }
    }

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
      recordMetrics(true, Date.now() - startTime);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return json({ error: `Unknown provider: ${provider}` }, 400);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ai-proxy] Unhandled error:', msg);
    recordMetrics(false, Date.now() - startTime);
    return json({ error: msg }, 200);
  }
});
