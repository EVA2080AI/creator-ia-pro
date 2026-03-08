const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PROMPT_ONLY_TOOLS = ['logo', 'social', 'generate'];
const GUEST_TRIAL_LIMIT = 3;
const PREFERRED_MODELS = [
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-image-preview',
  'gemini-2.0-flash-preview-image-generation',
  'gemini-2.0-flash-exp-image-generation',
  'gemini-2.0-flash',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const googleApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!googleApiKey) throw new Error('GOOGLE_GEMINI_API_KEY is not configured');

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await userClient.auth.getUser();

    const isGuest = !user;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { tool, image, prompt } = await req.json();
    if (!tool) throw new Error('Missing tool');
    if (!PROMPT_ONLY_TOOLS.includes(tool) && !image) throw new Error('Missing image');

    let guestFingerprint: string | null = null;
    let guestTrialsUsed = 0;

    if (isGuest) {
      guestFingerprint = buildGuestFingerprint(req);
      const { data: usageRow } = await adminClient
        .from('demo_usage')
        .select('trials_used')
        .eq('fingerprint', guestFingerprint)
        .maybeSingle();

      guestTrialsUsed = usageRow?.trials_used ?? 0;
      if (guestTrialsUsed >= GUEST_TRIAL_LIMIT) {
        return new Response(
          JSON.stringify({
            error: 'Límite de pruebas gratuitas alcanzado. Regístrate para seguir usando la IA.',
            demo_limit_reached: true,
            demo_remaining: 0,
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const creditCost: Record<string, number> = {
      enhance: 2,
      upscale: 3,
      eraser: 2,
      background: 1,
      restore: 3,
      logo: 2,
      social: 2,
      generate: 1,
    };
    const cost = creditCost[tool] || 2;

    let originalCredits: number | null = null;

    if (!isGuest && user) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('credits_balance')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.credits_balance < cost) {
        throw new Error(`Créditos insuficientes. Necesitas ${cost}, tienes ${profile?.credits_balance || 0}`);
      }

      originalCredits = profile.credits_balance;

      await adminClient
        .from('profiles')
        .update({ credits_balance: profile.credits_balance - cost })
        .eq('user_id', user.id);
    }

    const editPrompt = prompt || getDefaultPrompt(tool);
    const parts = buildParts(editPrompt, image);

    const generationResult = await callGeminiWithModelFallback(googleApiKey, parts);

    if (!generationResult.ok) {
      await rollbackCredits(adminClient, user?.id, originalCredits);
      return generationResult.response;
    }

    const resultImage = generationResult.resultUrl;

    if (isGuest && guestFingerprint) {
      const nextTrials = guestTrialsUsed + 1;
      await adminClient.from('demo_usage').upsert(
        {
          fingerprint: guestFingerprint,
          trials_used: nextTrials,
          last_trial_at: new Date().toISOString(),
        },
        { onConflict: 'fingerprint' }
      );

      return new Response(
        JSON.stringify({
          success: true,
          result_url: resultImage,
          demo_remaining: Math.max(0, GUEST_TRIAL_LIMIT - nextTrials),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (user) {
      await adminClient.from('transactions').insert({
        user_id: user.id,
        amount: -cost,
        type: 'tool_usage',
        description: `Tool: ${tool}`,
      });

      await adminClient.from('saved_assets').insert({
        user_id: user.id,
        asset_url: resultImage,
        prompt: editPrompt,
        type: 'image',
      });
    }

    return new Response(JSON.stringify({ success: true, result_url: resultImage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Tool error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildParts(prompt: string, image?: string) {
  const parts: any[] = [{ text: prompt }];

  if (image) {
    const base64Match = image.match(/^data:([^;]+);base64,(.+)$/);
    if (base64Match) {
      parts.push({
        inlineData: {
          mimeType: base64Match[1],
          data: base64Match[2],
        },
      });
    }
  }

  return parts;
}

async function callGeminiWithModelFallback(apiKey: string, parts: any[]) {
  const availableModels = await fetchAvailableModels(apiKey);
  const preferred = PREFERRED_MODELS.filter((m) => availableModels.has(m));
  const modelCandidates = preferred.length > 0 ? preferred : PREFERRED_MODELS;

  let lastNon404Status = 0;
  let lastNon404Text = '';

  for (const model of modelCandidates) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        }),
      }
    );

    const text = await response.text();

    if (response.status === 404) {
      console.warn(`Gemini model not found: ${model}`);
      continue;
    }

    if (response.status === 429) {
      return {
        ok: false,
        response: new Response(JSON.stringify({ error: 'Límite de solicitudes excedido. Intenta en unos minutos.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }),
      };
    }

    if (!response.ok) {
      lastNon404Status = response.status;
      lastNon404Text = text;
      continue;
    }

    const parsed = safeJsonParse(text);
    const resultUrl = extractGeminiImageData(parsed);

    if (resultUrl) {
      return { ok: true, resultUrl };
    }

    lastNon404Status = 422;
    lastNon404Text = 'Model responded without image output';
  }

  if (lastNon404Status > 0) {
    console.error('Gemini fallback error:', lastNon404Status, lastNon404Text);
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: `AI processing failed (${lastNon404Status})` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }),
    };
  }

  return {
    ok: false,
    response: new Response(
      JSON.stringify({ error: 'No hay modelos de imagen disponibles ahora mismo. Intenta más tarde.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    ),
  };
}

async function fetchAvailableModels(apiKey: string): Promise<Set<string>> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) return new Set();

    const payload = await response.json();
    const models = payload?.models || [];
    const names = models
      .filter((m: any) => m?.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => String(m?.name || '').replace(/^models\//, ''));

    return new Set(names);
  } catch {
    return new Set();
  }
}

function extractGeminiImageData(payload: any): string | null {
  const candidates = payload?.candidates;
  if (!candidates?.[0]?.content?.parts) return null;

  for (const part of candidates[0].content.parts) {
    if (part?.inlineData?.mimeType?.startsWith('image/')) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  return null;
}

function safeJsonParse(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

async function rollbackCredits(adminClient: ReturnType<typeof createClient>, userId?: string, originalCredits?: number | null) {
  if (userId && typeof originalCredits === 'number') {
    await adminClient.from('profiles').update({ credits_balance: originalCredits }).eq('user_id', userId);
  }
}

function getDefaultPrompt(tool: string): string {
  switch (tool) {
    case 'enhance':
      return 'Enhance this image: improve quality, lighting, sharpness and vibrance while keeping the original composition intact. Return the enhanced version of this exact image.';
    case 'upscale':
      return 'Upscale this image to higher resolution with enhanced details and sharpness. Keep the exact same content but with more detail and clarity.';
    case 'eraser':
      return 'Remove unwanted objects and blemishes from this image, fill background naturally. Return the cleaned image.';
    case 'background':
      return 'Remove the background completely, keep only the main subject with clean edges on a white background.';
    case 'restore':
      return 'Restore this photo: fix damage, scratches, improve colors and make it look new and vibrant. Keep the original content.';
    case 'logo':
      return 'Create a professional, clean, modern logo design. Minimal, memorable, vector-style. Use clean typography and a cohesive color palette. Output on a clean white background.';
    case 'social':
      return 'Create a professional social media post image optimized for engagement. Bold typography, vibrant colors, clear visual hierarchy. Eye-catching for Instagram/Facebook/LinkedIn.';
    case 'generate':
      return 'Generate a high-quality, professional image based on the description.';
    default:
      return 'Enhance this image';
  }
}

function buildGuestFingerprint(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'no-ip';
  const userAgent = req.headers.get('user-agent') || 'no-ua';
  return `${forwarded}::${userAgent}`;
}
