import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  /* Capturamos request raw para recuperar en caso de error sin consumir el json() dos veces */
  let rawBody = "";
  try {
    rawBody = await req.text();
  } catch (e) {}

  let node_id = null;

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      throw new Error("No autorizado");
    }

    const bodyArgs = JSON.parse(rawBody);
    node_id = bodyArgs.node_id;
    if (!node_id) throw new Error("Falta node_id");

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: node, error: nodeError } = await adminClient
      .from("canvas_nodes")
      .select("*")
      .eq("id", node_id)
      .single();

    if (nodeError || !node) throw new Error("Nodo no encontrado");

    const prompt = node.prompt;
    const systemPrompt = `Eres un diseñador UX/UI experto. Devuelve ÚNICAMENTE un JSON válido estructurado con los componentes UI solicitados usando Tailwind CSS.
Estructura Obligatoria Ejemplo:
{
  "type": "container",
  "classes": "flex flex-col bg-white p-6 rounded-2xl shadow-xl w-80 gap-4 border border-gray-100",
  "children": [
    { "type": "text", "content": "Iniciar Sesión", "classes": "text-2xl font-bold text-gray-900" },
    { "type": "input", "placeholder": "Email", "classes": "border p-3 rounded-lg w-full bg-gray-50 text-sm outline-none" },
    { "type": "button", "content": "Entrar", "classes": "bg-indigo-600 hover:bg-indigo-700 transition duration-300 text-white p-3 rounded-lg w-full font-semibold shadow-md cursor-pointer" }
  ]
}
Tipos permitidos: container, text, input, button, image_placeholder. Sin NINGUNA palabra antes ni después, SÓLO EL JSON.`;

    const POLLINATIONS_URL = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?system=${encodeURIComponent(systemPrompt)}&model=openai&seed=${Math.floor(Math.random()*1000000)}`;
    const aiResponse = await fetch(POLLINATIONS_URL);
    
    if (!aiResponse.ok) throw new Error("La IA no respondió a la generación de UI");
    
    let text = await aiResponse.text();
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    let parsedJson;
    try {
      parsedJson = JSON.parse(text);
    } catch(e) {
      throw new Error("La IA no generó JSON válido. Intenta con un prompt más específico.");
    }

    const { error: updateError } = await adminClient
      .from("canvas_nodes")
      .update({
        status: "ready",
        data_payload: { uiTree: parsedJson }
      })
      .eq("id", node_id);

    if (updateError) throw new Error("No se pudo guardar la UI generada");

    return new Response(JSON.stringify({ success: true, uiTree: parsedJson }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Generate UI error:", error.message);
    if (node_id) {
       const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
       await adminClient.from("canvas_nodes").update({ status: "error", error_message: error.message }).eq("id", node_id);
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
