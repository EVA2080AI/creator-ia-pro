const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const GUEST_TRIAL_LIMIT = 3;

// Mapeo exhaustivo de modelos que envía el Frontend a los reales del Gateway
const MODEL_MAPPING: Record<string, string> = {
  // ─── TEXT / CHAT ────────────────────────────────────────────────
  "gemini-3.1-pro-high":  "google/gemini-pro-1.5",
  "gemini-3.1-pro-low":   "google/gemini-pro-1.5",
  "gemini-3-flash":       "google/gemini-flash-1.5",
  "deepseek-chat":        "deepseek/deepseek-chat",
  "claude-3.5-sonnet":    "anthropic/claude-3-5-sonnet-20241022",
  "claude-3-opus":        "anthropic/claude-3-opus-20240229",
  "gpt-oss-120b":         "openai/gpt-4o-mini",
  // ─── IMAGE / NANO BANANA ────────────────────────────────────────
  "nano-banana-25":       "google/gemini-2.0-flash-exp",
  "nano-banana-2":        "google/gemini-flash-1.5",
  "nano-banana-pro":      "google/gemini-pro-1.5",
};

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

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const isGuest = !user;

    // Recibimos dynamic model y cost del frontend (Creator IA Pro)
    const bodyArgs = await req.json();
    const type = bodyArgs.type;
    const prompt = bodyArgs.prompt;
    const requestedModel = bodyArgs.model || "gemini-3-flash";
    const requiredCredits = typeof bodyArgs.cost === 'number' ? bodyArgs.cost : 1;

    // Determinamos qué modelo apuntar
    const finalModelString = MODEL_MAPPING[requestedModel] || "google/gemini-3-flash-preview";

    if (!type || !prompt) throw new Error('Missing type or prompt');

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

    let originalCredits: number | null = null;

    if (!isGuest && user) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('credits_balance')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.credits_balance < requiredCredits) {
        throw new Error(`Créditos insuficientes. Necesitas ${requiredCredits}.`);
      }

      originalCredits = profile.credits_balance;

      await adminClient
        .from('profiles')
        .update({ credits_balance: profile.credits_balance - requiredCredits })
        .eq('user_id', user.id);
    }

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

    const aiResponse = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: finalModelString,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (!isGuest && user && originalCredits !== null) {
        await adminClient.from('profiles').update({ credits_balance: originalCredits }).eq('user_id', user.id);
      }

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
      throw new Error('AI processing failed');
    }

    const aiData = await aiResponse.json();
    const text = aiData.choices?.[0]?.message?.content;

    if (!text) {
      if (!isGuest && user && originalCredits !== null) {
        await adminClient.from('profiles').update({ credits_balance: originalCredits }).eq('user_id', user.id);
      }
      throw new Error('No text generated');
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

      return new Response(JSON.stringify({ success: true, text, demo_remaining: Math.max(0, GUEST_TRIAL_LIMIT - nextTrials) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (user) {
      await adminClient.from('transactions').insert({
        user_id: user.id,
        amount: -requiredCredits,
        type: 'ai_chat',
        description: `Modelo: ${requestedModel} - ${type}: ${prompt.substring(0, 30)}...`,
      });
    }

    return new Response(JSON.stringify({ success: true, text, cost: requiredCredits, model_used: finalModelString }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI Chat error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildGuestFingerprint(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'no-ip';
  const userAgent = req.headers.get('user-agent') || 'no-ua';
  return `${forwarded}::${userAgent}`;
}
