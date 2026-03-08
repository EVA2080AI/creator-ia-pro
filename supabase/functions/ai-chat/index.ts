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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY is not configured');

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check credits
    const { data: profile } = await adminClient
      .from('profiles')
      .select('credits_balance')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.credits_balance < 1) {
      throw new Error('Créditos insuficientes');
    }

    const { type, prompt } = await req.json();
    if (!type || !prompt) throw new Error('Missing type or prompt');

    const systemPrompts: Record<string, string> = {
      copywriter: `Eres un experto copywriter de marketing digital. Genera textos persuasivos, creativos y optimizados para conversión. 
Responde en español. Formatea bien el texto con secciones claras. 
Incluye: titular principal, subtítulo, cuerpo del texto, y call-to-action.
Si te piden contenido para redes sociales, incluye sugerencias de hashtags.`,
      blog: `Eres un escritor de blogs SEO profesional. Genera artículos completos, bien estructurados con H1, H2, H3, párrafos, listas y conclusiones.
Responde en español. Incluye meta description sugerida al inicio.`,
      social: `Eres un experto en marketing de redes sociales. Genera contenido optimizado para la plataforma indicada.
Incluye: texto del post, hashtags sugeridos, mejor hora de publicación, y tips para engagement.
Responde en español.`,
      general: `Eres un asistente de marketing de IA avanzado. Ayudas a crear contenido profesional de alta calidad.
Responde en español de forma clara y estructurada.`,
    };

    const systemPrompt = systemPrompts[type] || systemPrompts.general;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Límite de solicitudes excedido. Intenta en unos minutos.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Sin créditos de IA disponibles.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI processing failed');
    }

    const aiData = await aiResponse.json();
    const text = aiData.choices?.[0]?.message?.content;

    if (!text) throw new Error('No text generated');

    // Deduct credit
    await adminClient
      .from('profiles')
      .update({ credits_balance: profile.credits_balance - 1 })
      .eq('user_id', user.id);

    // Record transaction
    await adminClient.from('transactions').insert({
      user_id: user.id,
      amount: -1,
      type: 'ai_chat',
      description: `AI ${type}: ${prompt.substring(0, 50)}...`,
    });

    return new Response(
      JSON.stringify({ success: true, text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Chat error:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
