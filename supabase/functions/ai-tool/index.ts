const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const IMAGE_MODEL = 'google/gemini-2.5-flash-image';
const FALLBACK_IMAGE_MODEL = 'google/gemini-3-pro-image-preview';
const PROMPT_ONLY_TOOLS = ['logo', 'social', 'generate'];
const GUEST_TRIAL_LIMIT = 3;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY is not configured');

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
    const gatewayPayload = buildGatewayPayload(editPrompt, image);

    const primaryAttempt = await callGateway(lovableApiKey, IMAGE_MODEL, gatewayPayload);
    let gatewayJson = primaryAttempt.json;

    if (!primaryAttempt.ok && primaryAttempt.status === 404) {
      const fallbackAttempt = await callGateway(lovableApiKey, FALLBACK_IMAGE_MODEL, gatewayPayload);
      gatewayJson = fallbackAttempt.json;

      if (!fallbackAttempt.ok) {
        await rollbackCredits(adminClient, user?.id, originalCredits);
        return mapGatewayErrorResponse(fallbackAttempt.status, fallbackAttempt.text);
      }
    } else if (!primaryAttempt.ok) {
      await rollbackCredits(adminClient, user?.id, originalCredits);
      return mapGatewayErrorResponse(primaryAttempt.status, primaryAttempt.text);
    }

    const resultImage = extractImageDataUrl(gatewayJson);

    if (!resultImage) {
      await rollbackCredits(adminClient, user?.id, originalCredits);
      throw new Error('La IA respondió sin imagen. Intenta con otro prompt o imagen.');
    }

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

function buildGatewayPayload(prompt: string, image?: string) {
  const userContent: any[] = [{ type: 'text', text: prompt }];
  if (image) {
    userContent.push({ type: 'image_url', image_url: { url: image } });
  }

  return {
    messages: [
      {
        role: 'system',
        content:
          'You are an advanced image generation and editing assistant. Always return an image output matching the user request. No markdown wrappers.',
      },
      { role: 'user', content: userContent },
    ],
    stream: false,
  };
}

async function callGateway(lovableApiKey: string, model: string, payload: Record<string, unknown>) {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, ...payload }),
  });

  const text = await response.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { ok: response.ok, status: response.status, text, json };
}

function extractImageDataUrl(payload: any): string | null {
  const msg = payload?.choices?.[0]?.message;
  if (!msg) return null;

  const directB64 = msg?.images?.[0]?.b64_json;
  if (directB64) return `data:image/png;base64,${directB64}`;

  const content = msg?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part?.b64_json) return `data:image/png;base64,${part.b64_json}`;
      if (part?.image_base64) return `data:image/png;base64,${part.image_base64}`;
      const dataUrl = part?.image_url?.url || part?.url;
      if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) return dataUrl;
    }
  }

  if (typeof content === 'string') {
    const match = content.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\n\r]+/);
    if (match?.[0]) return match[0].replace(/\s/g, '');
  }

  return null;
}

function mapGatewayErrorResponse(status: number, errText: string) {
  if (status === 429) {
    return new Response(JSON.stringify({ error: 'Límite de solicitudes excedido. Intenta en unos minutos.' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (status === 402) {
    return new Response(JSON.stringify({ error: 'Sin saldo de IA disponible. Añade créditos de uso para continuar.' }), {
      status: 402,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (status === 404) {
    return new Response(JSON.stringify({ error: 'Modelo de IA no disponible temporalmente. Intenta de nuevo en unos minutos.' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.error('AI Tool gateway error:', status, errText);
  return new Response(JSON.stringify({ error: `AI processing failed (${status})` }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function rollbackCredits(adminClient: ReturnType<typeof createClient>, userId?: string, originalCredits?: number | null) {
  if (userId && typeof originalCredits === 'number') {
    await adminClient.from('profiles').update({ credits_balance: originalCredits }).eq('user_id', userId);
  }
}

function getDefaultPrompt(tool: string): string {
  switch (tool) {
    case 'enhance':
      return 'Enhance this image: improve quality, lighting, sharpness and vibrance while keeping the original composition intact. Return only the enhanced image.';
    case 'upscale':
      return 'Upscale this image to higher resolution with enhanced details and sharpness. Keep the exact same composition. Return only the upscaled image.';
    case 'eraser':
      return 'Remove unwanted objects and blemishes from this image, then fill the background naturally. Return only the edited image.';
    case 'background':
      return 'Remove the background completely and keep only the main subject with clean edges on a transparent or white background. Return only the image.';
    case 'restore':
      return 'Restore this photo by fixing damage, scratches, and colors while preserving identity. Return only the restored image.';
    case 'logo':
      return 'Create a professional, clean, modern logo. Minimal, memorable, vector-style feel, with clear typography. Return only the logo image on a clean background.';
    case 'social':
      return 'Create a professional social media post image optimized for engagement, with strong hierarchy and readable text. Return only the final image.';
    case 'generate':
      return 'Generate a high-quality, professional image from this description. Return only the image.';
    default:
      return 'Enhance this image and return only the image.';
  }
}

function buildGuestFingerprint(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'no-ip';
  const userAgent = req.headers.get('user-agent') || 'no-ua';
  return `${forwarded}::${userAgent}`;
}
