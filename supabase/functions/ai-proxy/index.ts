import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { provider, path, body } = await req.json();

    if (!provider || !path || !body) {
      throw new Error("Missing provider, path or body");
    }

    let fetchUrl = "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    
    if (provider === "openrouter") {
      const apiKey = Deno.env.get("OPENROUTER_API_KEY") || Deno.env.get("VITE_OPENROUTER_API_KEY");
      if (!apiKey) throw new Error("OPENROUTER_API_KEY no configurada en los secretos de Supabase");
      
      fetchUrl = `https://openrouter.ai/api/v1/${path}`;
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["HTTP-Referer"] = "https://creator-ia.com";
      headers["X-Title"] = "Creator IA Pro";
      
    } else if (provider === "gemini") {
      const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("VITE_GEMINI_API_KEY");
      if (!apiKey) throw new Error("GEMINI_API_KEY no configurada en los secretos de Supabase");
      
      fetchUrl = `https://generativelanguage.googleapis.com/v1beta/${path}?key=${apiKey}`;
    } else {
      throw new Error(`Provider no soportado: ${provider}`);
    }

    const res = await fetch(fetchUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    const data = await res.text();
    
    if (!res.ok) {
        console.error(`Error from ${provider}:`, res.status, data);
    }
    
    return new Response(data, {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
    
  } catch (error: any) {
    console.error("Proxy Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
