import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, currentFiles } = await req.json();

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const filesContext = Object.entries(currentFiles || {})
      .map(([name, f]: [string, any]) => `--- ${name} ---\n${f.content}`)
      .join("\n\n");

    const systemPrompt = `Eres BuilderAI, un agente de desarrollo web experto integrado en Creator IA Pro. Creas aplicaciones React completas y funcionales.

## CAPACIDADES
- Frontend: React 18, TypeScript, Tailwind CSS, shadcn/ui
- Estado: useState, useEffect, useCallback, Context API
- Formularios: validación, manejo de errores
- Diseño: responsive, dark mode, animaciones CSS

## REGLAS DE GENERACIÓN

### Formato de respuesta
SIEMPRE responde con un bloque JSON válido envuelto en \`\`\`json ... \`\`\`:
{
  "files": {
    "filename.tsx": { "language": "tsx", "content": "código completo aquí" }
  },
  "explanation": "Breve explicación en español de lo que creaste"
}

### Calidad
1. Código COMPLETO y FUNCIONAL — nunca uses "..." o placeholders
2. TypeScript con tipos apropiados
3. Componentes modulares
4. Manejo de errores con try/catch
5. Estados de loading para operaciones async

### Diseño
1. Tailwind CSS para todos los estilos
2. Responsive (mobile-first)
3. Colores: usa clases de Tailwind estándar
4. No uses librerias externas que no sean React + Tailwind

### Estructura
- App.tsx: componente principal
- Otros archivos: componentes separados si el proyecto es grande

## ARCHIVOS ACTUALES
${filesContext || "(Proyecto vacío — crea desde cero)"}

## INSTRUCCIONES ADICIONALES
- Responde siempre en español para las explicaciones
- El código puede estar en inglés (nombres de variables, funciones)
- Genera código que sea visualmente atractivo y funcional`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://creator-ia.com",
        "X-Title": "Creator IA Pro - Studio",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4-6",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenRouter error:", response.status, text);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Error al generar código" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("studio-generate error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
