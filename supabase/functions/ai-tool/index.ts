const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PROMPT_ONLY_TOOLS = ['logo', 'social', 'generate'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No auth header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const googleApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!googleApiKey) throw new Error('GOOGLE_GEMINI_API_KEY is not configured');

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { tool, image, prompt } = await req.json();
    if (!tool) throw new Error('Missing tool');
    
    if (!PROMPT_ONLY_TOOLS.includes(tool) && !image) throw new Error('Missing image');

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile } = await adminClient
      .from('profiles')
      .select('credits_balance')
      .eq('user_id', user.id)
      .single();

    const creditCost: Record<string, number> = {
      enhance: 2, upscale: 3, eraser: 2, background: 1, restore: 3,
      logo: 2, social: 2, generate: 1,
    };
    const cost = creditCost[tool] || 2;

    if (!profile || profile.credits_balance < cost) {
      throw new Error(`Créditos insuficientes. Necesitas ${cost}, tienes ${profile?.credits_balance || 0}`);
    }

    // Deduct credits first
    await adminClient
      .from('profiles')
      .update({ credits_balance: profile.credits_balance - cost })
      .eq('user_id', user.id);

    const editPrompt = prompt || getDefaultPrompt(tool);
    const isPromptOnly = PROMPT_ONLY_TOOLS.includes(tool);
    
    // Build parts for Google Gemini API
    const parts: any[] = [{ text: editPrompt }];
    if (!isPromptOnly && image) {
      // If image is a base64 data URL, extract the data
      const base64Match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (base64Match) {
        parts.push({
          inlineData: {
            mimeType: base64Match[1],
            data: base64Match[2],
          },
        });
      } else {
        // It's a URL, include as text reference
        parts.push({ text: `Image URL: ${image}` });
      }
    }

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`,
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

    if (!aiResponse.ok) {
      // Rollback credits
      await adminClient
        .from('profiles')
        .update({ credits_balance: profile.credits_balance })
        .eq('user_id', user.id);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Límite de solicitudes excedido. Intenta en unos minutos.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI processing failed');
    }

    const aiData = await aiResponse.json();
    
    // Extract image from Gemini response
    let resultImage: string | null = null;
    const candidates = aiData.candidates;
    if (candidates?.[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          resultImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!resultImage) {
      await adminClient
        .from('profiles')
        .update({ credits_balance: profile.credits_balance })
        .eq('user_id', user.id);
      throw new Error('No image generated');
    }

    // Record transaction
    await adminClient.from('transactions').insert({
      user_id: user.id,
      amount: -cost,
      type: 'tool_usage',
      description: `Tool: ${tool}`,
    });

    // Save to assets
    await adminClient.from('saved_assets').insert({
      user_id: user.id,
      asset_url: resultImage,
      prompt: editPrompt,
      type: 'image',
    });

    return new Response(
      JSON.stringify({ success: true, result_url: resultImage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Tool error:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getDefaultPrompt(tool: string): string {
  switch (tool) {
    case 'enhance':
      return 'Enhance this image: improve quality, lighting, sharpness and vibrance while keeping the original composition intact';
    case 'upscale':
      return 'Upscale this image to higher resolution with enhanced details and sharpness';
    case 'eraser':
      return 'Remove unwanted objects and blemishes from this image, fill background naturally';
    case 'background':
      return 'Remove the background completely, keep only the main subject with clean edges on a transparent/white background';
    case 'restore':
      return 'Restore this photo: fix damage, scratches, improve colors and make it look new and vibrant';
    case 'logo':
      return 'Create a professional, clean, modern logo design. The logo should be vector-style, minimal, memorable, and work well at any size. Use clean typography and a cohesive color palette. Output on a clean white background.';
    case 'social':
      return 'Create a professional social media post image optimized for engagement. Use bold typography, vibrant colors, and a clear visual hierarchy. The design should be eye-catching and suitable for Instagram, Facebook, or LinkedIn.';
    default:
      return 'Enhance this image';
  }
}
