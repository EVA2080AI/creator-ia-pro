const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PROMPT_ONLY_TOOLS = ['logo', 'social', 'generate'];
const GUEST_TRIAL_LIMIT = 3;
const IMAGE_MODEL = 'google/gemini-2.5-flash-image';
const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

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

    // --- Guest trial logic ---
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

    // --- Credit logic ---
    const creditCost: Record<string, number> = {
      enhance: 2, upscale: 3, eraser: 2, background: 1, restore: 3, logo: 2, social: 2, generate: 1,
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

    // --- Build messages for OpenAI-compatible gateway ---
    const systemPrompt = getSystemPrompt(tool);
    const userPrompt = prompt || getDefaultPrompt(tool);
    const userContent: any[] = [{ type: 'text', text: userPrompt }];

    if (image) {
      const base64Match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (base64Match) {
        userContent.push({
          type: 'image_url',
          image_url: { url: image },
        });
      }
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ];

    // --- Call Lovable AI Gateway ---
    const aiResponse = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        messages,
      }),
    });

    if (!aiResponse.ok) {
      await rollbackCredits(adminClient, user?.id, originalCredits);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Límite de solicitudes excedido. Intenta en unos minutos.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos del servicio agotados. Contacta al administrador.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const errText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errText);
      throw new Error(`AI processing failed (${aiResponse.status})`);
    }

    const aiData = await aiResponse.json();
    const responseContent = aiData.choices?.[0]?.message?.content;

    if (!responseContent) {
      await rollbackCredits(adminClient, user?.id, originalCredits);
      throw new Error('No response from AI');
    }

    // Extract image from response - could be inline base64 or markdown image
    let resultImage = extractImageFromResponse(responseContent);

    if (!resultImage) {
      // If no image found, return the text response (for text-based tools)
      await rollbackCredits(adminClient, user?.id, originalCredits);
      throw new Error('No se pudo generar la imagen. Intenta con un prompt diferente.');
    }

    // --- Guest trial tracking ---
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

    // --- Logged-in user tracking ---
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
        prompt: userPrompt,
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

function extractImageFromResponse(content: any): string | null {
  // If content is a string, check for base64 image data or markdown image
  if (typeof content === 'string') {
    // Check for base64 data URI
    const base64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
    if (base64Match) return base64Match[0];

    // Check for markdown image with URL
    const mdMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
    if (mdMatch) return mdMatch[1];

    return null;
  }

  // If content is an array (multimodal response)
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === 'image_url' && part.image_url?.url) {
        return part.image_url.url;
      }
      if (part.type === 'image' && part.image?.url) {
        return part.image.url;
      }
      // Check inline data
      if (part.type === 'text') {
        const extracted = extractImageFromResponse(part.text);
        if (extracted) return extracted;
      }
    }
  }

  return null;
}

async function rollbackCredits(adminClient: ReturnType<typeof createClient>, userId?: string, originalCredits?: number | null) {
  if (userId && typeof originalCredits === 'number') {
    await adminClient.from('profiles').update({ credits_balance: originalCredits }).eq('user_id', userId);
  }
}

function getSystemPrompt(tool: string): string {
  switch (tool) {
    case 'enhance':
      return 'You are an image enhancement AI. Enhance the provided image: improve quality, lighting, sharpness and vibrance while keeping the original composition intact. Return the enhanced version of the image.';
    case 'upscale':
      return 'You are an image upscaling AI. Upscale the provided image to higher resolution with enhanced details and sharpness.';
    case 'eraser':
      return 'You are an image editing AI. Remove unwanted objects and blemishes from the provided image, filling the background naturally.';
    case 'background':
      return 'You are a background removal AI. Remove the background completely from the provided image, keeping only the main subject with clean edges on a white background.';
    case 'restore':
      return 'You are a photo restoration AI. Restore the provided photo: fix damage, scratches, improve colors and make it look new and vibrant.';
    case 'logo':
      return 'You are a professional logo designer AI. Create clean, modern, memorable logo designs. Output a professional vector-style logo on a clean white background.';
    case 'social':
      return 'You are a social media content designer AI. Create professional, eye-catching social media post images with bold typography and vibrant colors.';
    case 'generate':
      return 'You are an image generation AI. Generate high-quality, professional images based on the user description.';
    default:
      return 'You are a helpful AI image assistant.';
  }
}

function getDefaultPrompt(tool: string): string {
  switch (tool) {
    case 'enhance': return 'Enhance this image with better quality, lighting and sharpness.';
    case 'upscale': return 'Upscale this image to higher resolution with more detail.';
    case 'eraser': return 'Remove unwanted objects and clean up this image.';
    case 'background': return 'Remove the background, keep only the main subject on white.';
    case 'restore': return 'Restore this photo, fix damage and improve colors.';
    case 'logo': return 'Create a professional, clean, modern logo design.';
    case 'social': return 'Create a professional social media post image.';
    case 'generate': return 'Generate a high-quality, professional image.';
    default: return 'Process this image.';
  }
}

function buildGuestFingerprint(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'no-ip';
  const userAgent = req.headers.get('user-agent') || 'no-ua';
  return `${forwarded}::${userAgent}`;
}
