const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { tool, image, prompt } = await req.json();
    if (!tool || !image) throw new Error('Missing tool or image');

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check credits
    const { data: profile } = await adminClient
      .from('profiles')
      .select('credits_balance')
      .eq('user_id', user.id)
      .single();

    const creditCost: Record<string, number> = {
      enhance: 2, upscale: 3, eraser: 2, background: 1, restore: 3,
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

    // Use Lovable AI to process image
    const editPrompt = prompt || getDefaultPrompt(tool);
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: editPrompt },
              { type: 'image_url', image_url: { url: image } },
            ],
          },
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!aiResponse.ok) {
      // Rollback credits
      await adminClient
        .from('profiles')
        .update({ credits_balance: profile.credits_balance })
        .eq('user_id', user.id);
      throw new Error('AI processing failed');
    }

    const aiData = await aiResponse.json();
    const resultImage = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

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
      return 'Remove the background completely, keep only the main subject with clean edges on a white background';
    case 'restore':
      return 'Restore this photo: fix damage, scratches, improve colors and make it look new and vibrant';
    default:
      return 'Enhance this image';
  }
}
