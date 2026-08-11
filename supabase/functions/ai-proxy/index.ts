// AI Proxy - Multi-Provider Router with Open Source by Default
// Routes: Open Source -> Freemium -> Pro (only if explicitly selected)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OR_BASE = 'https://openrouter.ai/api/v1';
const OR_REFERER = 'https://creator-ia.com';
const OR_TITLE = 'Creator IA Pro - AI Infinite Canvas';

// ── Multi-Provider Configuration ────────────────────────────────────────────
const GROQ_MODELS: Record<string, string> = {
  'llama3-8b': 'llama3-8b-8192',
  'llama3-70b': 'llama3-70b-8192',
  'mixtral-8x7b': 'mixtral-8x7b-32768',
  'gemma-7b': 'gemma-7b-it',
};

const PRO_MODELS = new Set([
  'anthropic/claude-sonnet-4',
  'anthropic/claude-opus-4',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
]);

// ── Rate Limiting ───────────────────────────────────────────────────────────
const RATE_LIMITS: Record<string, { requests: number; window: number }> = {
  'groq': { requests: 20, window: 60000 },
  'gemini': { requests: 60, window: 60000 },
  'openrouter': { requests: 20, window: 60000 },
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(provider: string, userId: string): boolean {
  const key = `${provider}:${userId}`;
  const now = Date.now();
  const limits = RATE_LIMITS[provider] || RATE_LIMITS.openrouter;

  const entry = rateLimitMap.get(key);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + limits.window });
    return true;
  }
  if (entry.count >= limits.requests) return false;
  entry.count++;
  return true;
}

// ── Circuit Breaker ─────────────────────────────────────────────────────────
interface CircuitState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

const circuitMap = new Map<string, CircuitState>();

function getCircuitState(key: string): CircuitState {
  if (!circuitMap.has(key)) {
    circuitMap.set(key, { failures: 0, lastFailure: 0, state: 'closed' });
  }
  return circuitMap.get(key)!;
}

function recordSuccess(key: string): void {
  const state = circuitMap.get(key);
  if (state) {
    state.failures = 0;
    state.state = 'closed';
  }
}

function recordFailure(key: string): void {
  const state = getCircuitState(key);
  state.failures++;
  state.lastFailure = Date.now();
  if (state.failures >= 5) {
    state.state = 'open';
  }
}

function isCircuitOpen(key: string): boolean {
  const state = getCircuitState(key);
  if (state.state === 'open') {
    if (Date.now() - state.lastFailure > 60000) {
      state.state = 'half-open';
      return false;
    }
    return true;
  }
  return false;
}

// ── Provider Call Functions ──────────────────────────────────────────────────

async function callGroq(body: any, apiKey: string): Promise<Response> {
  const groqModel = GROQ_MODELS[body.model] || body.model;

  return fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: groqModel,
      messages: body.messages,
      temperature: body.temperature ?? 0.7,
      max_tokens: body.max_tokens ?? 4096,
      stream: body.stream ?? false,
    }),
  });
}

async function callOpenRouter(body: any, apiKey: string): Promise<Response> {
  return fetch(`${OR_BASE}/chat/completions`, {
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

async function callGemini(body: any, apiKey: string): Promise<Response> {
  const modelId = body.model || 'models/gemini-1.5-flash';
  const endpoint = body.stream ? 'streamGenerateContent' : 'generateContent';

  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/${modelId}:${endpoint}?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: body.messages.map((m: any) => ({
          role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          temperature: body.temperature ?? 0.7,
          maxOutputTokens: body.max_tokens ?? 2048,
        },
      }),
    }
  );
}

// ── Image Generation (Replicate primary, OpenRouter/Gemini fallback) ─────────

// The frontend's IMAGE_MODEL_MAP ids are Replicate model slugs.
const REPLICATE_MODEL_ALIASES: Record<string, string> = {
  // Replicate publishes SD 3.5 with a dot, the frontend map uses dashes
  'stability-ai/stable-diffusion-3-5-large': 'stability-ai/stable-diffusion-3.5-large',
};

// Only flux-1.1-pro accepts a reference image (image_prompt) among our models
const REPLICATE_IMAGE_INPUT_MODELS = new Set(['black-forest-labs/flux-1.1-pro']);

// Subset of aspect ratios supported by flux, ideogram-v2 AND sd-3.5-large
function toAspectRatio(width: number, height: number): string {
  const candidates: Array<[string, number]> = [
    ['1:1', 1], ['16:9', 16 / 9], ['9:16', 9 / 16], ['3:2', 3 / 2], ['2:3', 2 / 3],
  ];
  const ratio = width / height;
  let best = '1:1';
  let bestDiff = Infinity;
  for (const [name, value] of candidates) {
    const diff = Math.abs(value - ratio);
    if (diff < bestDiff) { bestDiff = diff; best = name; }
  }
  return best;
}

async function generateReplicateImage(
  model: string,
  prompt: string,
  aspectRatio: string,
  imageUrl: string | undefined,
  token: string,
): Promise<string> {
  let finalModel = REPLICATE_MODEL_ALIASES[model] ?? model;
  if (imageUrl && !REPLICATE_IMAGE_INPUT_MODELS.has(finalModel)) {
    finalModel = 'black-forest-labs/flux-1.1-pro';
  }

  const input: Record<string, unknown> = { prompt, aspect_ratio: aspectRatio };
  if (imageUrl) input.image_prompt = imageUrl;

  const createRes = await fetch(`https://api.replicate.com/v1/models/${finalModel}/predictions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait=60',
    },
    body: JSON.stringify({ input }),
  });

  if (!createRes.ok) {
    const detail = await createRes.text();
    throw new Error(`${createRes.status} ${detail.slice(0, 200)}`);
  }

  let prediction = await createRes.json();

  // If the sync wait expired before the model finished, keep polling
  for (let i = 0; i < 45 && (prediction.status === 'starting' || prediction.status === 'processing'); i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(prediction.urls?.get, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!pollRes.ok) continue;
    prediction = await pollRes.json();
  }

  if (prediction.status !== 'succeeded') {
    throw new Error(String(prediction.error || `predicción en estado ${prediction.status}`));
  }
  const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (typeof output !== 'string' || !output) throw new Error('sin URL de imagen en la respuesta');
  return output;
}

async function generateOpenRouterImage(
  prompt: string,
  imageUrl: string | undefined,
  apiKey: string,
): Promise<string> {
  const content = imageUrl
    ? [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: imageUrl } }]
    : prompt;

  const res = await fetch(`${OR_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': OR_REFERER,
      'X-Title': OR_TITLE,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-image',
      messages: [{ role: 'user', content }],
      modalities: ['image', 'text'],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${res.status} ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  const image = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (typeof image !== 'string' || !image) {
    throw new Error(String(data.error?.message || 'el modelo no devolvió imagen'));
  }
  return image;
}

// ── Response Transformers ────────────────────────────────────────────────────

function transformGroqResponse(data: any): any {
  return {
    id: data.id,
    object: 'chat.completion',
    created: data.created,
    model: data.model,
    choices: data.choices?.map((c: any) => ({
      index: c.index,
      message: {
        role: c.message?.role || 'assistant',
        content: c.message?.content || '',
      },
      finish_reason: c.finish_reason,
    })) || [],
    usage: data.usage,
    _provider: 'groq',
    _tier: 'open-source',
  };
}

function transformGeminiResponse(data: any): any {
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return {
    id: `gemini-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'gemini-1.5-flash',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: text,
      },
      finish_reason: 'stop',
    }],
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: data.usageMetadata?.totalTokenCount || 0,
    },
    _provider: 'gemini',
    _tier: 'freemium',
  };
}

// ── Main Handler ─────────────────────────────────────────────────────────────

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const startTime = Date.now();

  try {
    const rawPayload = await req.json();

    // ── Image generation: { provider: 'openrouter-image', body: {...} } ───────
    // ai-service.handleImageGen posts { prompt, model, width, height, image_url? }
    // where model is a Replicate slug (flux, ideogram, sd3.5). Errors return 200
    // so the client surfaces data.error instead of a generic FunctionsHttpError.
    if (
      rawPayload && typeof rawPayload === 'object' &&
      rawPayload.provider === 'openrouter-image' &&
      rawPayload.body && typeof rawPayload.body === 'object'
    ) {
      const imgBody = rawPayload.body as Record<string, unknown>;
      const prompt = typeof imgBody.prompt === 'string' ? imgBody.prompt.trim() : '';
      if (!prompt) return json({ error: 'Falta el prompt para generar la imagen.' }, 200);

      const requestedModel = typeof imgBody.model === 'string' && imgBody.model
        ? imgBody.model
        : 'black-forest-labs/flux-schnell';
      const imageUrl = typeof imgBody.image_url === 'string' && imgBody.image_url
        ? imgBody.image_url
        : undefined;
      const aspectRatio = toAspectRatio(Number(imgBody.width) || 1024, Number(imgBody.height) || 1024);

      const imageErrors: string[] = [];

      const replicateToken = Deno.env.get('REPLICATE_API_TOKEN');
      if (replicateToken) {
        try {
          const url = await generateReplicateImage(requestedModel, prompt, aspectRatio, imageUrl, replicateToken);
          return json({ url, model: requestedModel });
        } catch (e) {
          imageErrors.push(`Replicate: ${e instanceof Error ? e.message : 'error'}`);
        }
      } else {
        imageErrors.push('Replicate: REPLICATE_API_TOKEN no configurada');
      }

      const orImageKey = Deno.env.get('OPENROUTER_API_KEY');
      if (orImageKey) {
        try {
          const url = await generateOpenRouterImage(prompt, imageUrl, orImageKey);
          // _fallback_reason: why Replicate didn't serve this (frontend ignores it)
          return json({ url, model: 'google/gemini-2.5-flash-image', _fallback_reason: imageErrors });
        } catch (e) {
          imageErrors.push(`OpenRouter: ${e instanceof Error ? e.message : 'error'}`);
        }
      } else {
        imageErrors.push('OpenRouter: OPENROUTER_API_KEY no configurada');
      }

      console.error('[ai-proxy] image generation failed:', imageErrors);
      return json({ error: `No se pudo generar la imagen. ${imageErrors.join(' | ')}` }, 200);
    }

    // ── Legacy envelope: { provider, path, body } ─────────────────────────────
    // Genesis chat, useStudioChatAI, useGenesisLite, useSimpleCodeGen, captioning,
    // and ai-service.callProxy all post in this shape. Route to OpenRouter and
    // pass streaming responses through verbatim so the client SSE reader works.
    if (
      rawPayload && typeof rawPayload === 'object' &&
      rawPayload.provider === 'openrouter' &&
      rawPayload.body && typeof rawPayload.body === 'object'
    ) {
      const apiKey = Deno.env.get('OPENROUTER_API_KEY');
      if (!apiKey) {
        return json({ error: 'OPENROUTER_API_KEY no está configurada en Supabase.' }, 500);
      }

      const targetPath = typeof rawPayload.path === 'string' && rawPayload.path.length > 0
        ? rawPayload.path.replace(/^\/+/, '')
        : 'chat/completions';
      const orBody = rawPayload.body as Record<string, unknown>;
      const streamMode = orBody.stream === true;

      const orRes = await fetch(`${OR_BASE}/${targetPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': OR_REFERER,
          'X-Title': OR_TITLE,
        },
        body: JSON.stringify(orBody),
      });

      if (streamMode && orRes.ok && orRes.body) {
        return new Response(orRes.body, {
          status: orRes.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
          },
        });
      }

      const ct = orRes.headers.get('content-type') ?? '';
      const raw = await orRes.text();
      if (!orRes.ok) {
        let errMsg = `OpenRouter ${orRes.status}`;
        try {
          const parsed = JSON.parse(raw);
          errMsg = (parsed?.error?.message ?? parsed?.error ?? errMsg) as string;
        } catch { /* keep default */ }
        return json({ error: errMsg }, 200);
      }
      if (ct.includes('application/json')) {
        try { return json(JSON.parse(raw)); } catch { /* fall through */ }
      }
      return new Response(raw, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': ct || 'application/json' },
      });
    }

    // ── New flat payload (tier-based router) ──────────────────────────────────
    const payload = rawPayload;
    const {
      model,
      messages,
      tier = 'open-source',
      explicitPro = false,
      stream = false,
      temperature,
      max_tokens,
    } = payload;

    // Get user auth
    const authHeader = req.headers.get('Authorization');
    let userId = 'anonymous';
    let hasCredits = false;

    if (authHeader?.startsWith('Bearer ')) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );

      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);

      if (user) {
        userId = user.id;
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('credits_balance')
          .eq('user_id', user.id)
          .single();
        hasCredits = (profile?.credits_balance ?? 0) > 0;
      }
    }

    // Route based on tier and model
    let response: Response | null = null;
    let providerUsed = '';
    let errorDetails: string[] = [];

    // TIER 1: Open Source (default)
    if (tier === 'open-source' || (!explicitPro && !PRO_MODELS.has(model))) {
      // Try Groq first (fastest)
      if (!isCircuitOpen('groq') && checkRateLimit('groq', userId)) {
        const groqKey = Deno.env.get('GROQ_API_KEY');
        if (groqKey) {
          try {
            const groqResponse = await callGroq({
              model: model || 'llama3-70b',
              messages,
              stream,
              temperature,
              max_tokens,
            }, groqKey);

            if (groqResponse.ok) {
              const data = await groqResponse.json();
              recordSuccess('groq');
              return json(transformGroqResponse(data));
            } else {
              const error = await groqResponse.text();
              errorDetails.push(`Groq: ${error.slice(0, 100)}`);
              recordFailure('groq');
            }
          } catch (e) {
            errorDetails.push(`Groq: ${e instanceof Error ? e.message : 'error'}`);
            recordFailure('groq');
          }
        }
      }

      // Fallback to Gemini (freemium but generous)
      if (!isCircuitOpen('gemini') && checkRateLimit('gemini', userId)) {
        const geminiKey = Deno.env.get('GEMINI_API_KEY');
        if (geminiKey) {
          try {
            const geminiResponse = await callGemini({
              model: 'models/gemini-1.5-flash',
              messages,
              stream,
              temperature,
              max_tokens,
            }, geminiKey);

            if (geminiResponse.ok) {
              const data = await geminiResponse.json();
              recordSuccess('gemini');
              return json(transformGeminiResponse(data));
            } else {
              const error = await geminiResponse.text();
              errorDetails.push(`Gemini: ${error.slice(0, 100)}`);
              recordFailure('gemini');
            }
          } catch (e) {
            errorDetails.push(`Gemini: ${e instanceof Error ? e.message : 'error'}`);
            recordFailure('gemini');
          }
        }
      }
    }

    // TIER 3: Pro (only if explicit and has credits)
    if (tier === 'pro' || explicitPro || PRO_MODELS.has(model)) {
      if (!hasCredits) {
        return json({
          error: 'Créditos insuficientes para modelo Pro. Por favor recarga o usa modelos Open Source.',
          code: 'insufficient_credits',
          availableTiers: ['open-source', 'freemium'],
          fallbackModels: ['llama3-70b', 'gemini-1.5-flash'],
        }, 402);
      }

      if (!isCircuitOpen('openrouter') && checkRateLimit('openrouter', userId)) {
        const orKey = Deno.env.get('OPENROUTER_API_KEY');
        if (orKey) {
          try {
            const orResponse = await callOpenRouter({
              model: model || 'anthropic/claude-sonnet-4',
              messages,
              stream,
              temperature,
              max_tokens,
            }, orKey);

            if (orResponse.ok) {
              const data = await orResponse.json();
              recordSuccess('openrouter');

              // Track credit consumption here (deduct credits)
              // TODO: Integrate with credit deduction system

              return json({
                ...data,
                _provider: 'openrouter',
                _tier: 'pro',
                _cost: 'credits-deducted',
              });
            } else {
              const error = await orResponse.text();
              errorDetails.push(`OpenRouter: ${error.slice(0, 100)}`);
              recordFailure('openrouter');
            }
          } catch (e) {
            errorDetails.push(`OpenRouter: ${e instanceof Error ? e.message : 'error'}`);
            recordFailure('openrouter');
          }
        }
      }
    }

    // All providers failed
    console.error('[ai-proxy] All providers failed:', errorDetails);
    return json({
      error: 'Todos los proveedores de IA están ocupados o no disponibles.',
      code: 'all_providers_failed',
      details: errorDetails,
      retryAfter: 30,
      suggestion: 'Intenta de nuevo en unos segundos o selecciona un modelo diferente.',
    }, 503);

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ai-proxy] Unhandled error:', msg);
    return json({ error: msg }, 500);
  }
});
