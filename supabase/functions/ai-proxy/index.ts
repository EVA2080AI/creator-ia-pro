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
    } else if (provider === "pollinations") {
      // No API key needed — proxy the image fetch server-side to avoid CORS
      const { prompt, seed, width, height } = body;
      const encoded = encodeURIComponent(prompt);
      const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width || 1024}&height=${height || 1024}&seed=${seed || 0}&nologo=true&enhance=true&model=flux`;
      const imgRes = await fetch(url);
      if (!imgRes.ok) throw new Error(`Pollinations error: ${imgRes.status}`);
      const blob = await imgRes.blob();
      if (blob.type.startsWith("text/")) throw new Error("Pollinations devolvió HTML, reintenta");
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      const mime = blob.type.startsWith("image/") ? blob.type : "image/png";
      return new Response(JSON.stringify({ url: `data:${mime};base64,${base64}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      throw new Error(`Provider no soportado: ${provider}`);
    }

    const streamMode = body?.stream === true;

    const res = await fetch(fetchUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Error from ${provider}:`, res.status, errText);
      return new Response(errText, { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Pipe stream directly for SSE (text/event-stream)
    if (streamMode && res.body) {
      return new Response(res.body, {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error: any) {
    console.error("Proxy Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
