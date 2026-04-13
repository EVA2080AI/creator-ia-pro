
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    // Obtener la API key del entorno.
    const apiKey = Deno.env.get('TAVILY_API_KEY');

    if (!apiKey) {
        // Fallback robusto si no hay API clave configurada:
        return new Response(JSON.stringify({
           results: [
              { title: "Búsqueda no configurada", content: "El administrador debe configurar la variable TAVILY_API_KEY en Supabase para que Génesis pueda buscar en internet. Por ahora, debes proporcionar la información tú mismo.", url: "https://tavily.com" }
           ]
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        include_images: false,
        max_results: 5
      }),
    });

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
