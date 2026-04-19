// Groq Proxy - Ultra-fast Open Source Models
// https://groq.com/ - Provides free tier with generous limits

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Groq model mappings
const GROQ_MODELS: Record<string, string> = {
  // Llama 3 models
  "llama3-8b": "llama3-8b-8192",
  "llama3-70b": "llama3-70b-8192",
  "llama-3.1-8b": "llama-3.1-8b-instant",
  "llama-3.1-70b": "llama-3.1-70b-versatile",
  "llama-3.2-1b": "llama-3.2-1b-preview",
  "llama-3.2-3b": "llama-3.2-3b-preview",
  "llama-3.2-11b": "llama-3.2-11b-vision-preview",
  "llama-3.2-90b": "llama-3.2-90b-vision-preview",
  // Mixtral
  "mixtral-8x7b": "mixtral-8x7b-32768",
  // Gemma
  "gemma-7b": "gemma-7b-it",
  "gemma2-9b": "gemma2-9b-it",
};

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqRequest {
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  top_p?: number;
  stop?: string | string[] | null;
}

// Rate limiting: 20 requests/minute per IP
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const clientId = req.headers.get("x-client-info") || "anonymous";

  try {
    // Check rate limit
    if (!checkRateLimit(clientId)) {
      return json({
        error: "Rate limit exceeded. Groq free tier: 20 req/min.",
        code: "rate_limit",
        retryAfter: 60
      }, 429);
    }

    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) {
      return json({ error: "GROQ_API_KEY not configured" }, 503);
    }

    const payload = await req.json();
    const {
      model,
      messages,
      temperature = 0.7,
      max_tokens = 4096,
      stream = false,
      top_p = 1,
      stop = null
    } = payload;

    // Map model name to Groq model ID
    const groqModel = GROQ_MODELS[model] || model;

    if (!Object.values(GROQ_MODELS).includes(groqModel) && !model.includes("groq")) {
      return json({ error: `Model ${model} not available on Groq` }, 400);
    }

    const groqRequest: GroqRequest = {
      model: groqModel,
      messages,
      temperature,
      max_tokens,
      stream,
      top_p,
      stop,
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(groqRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API error:", errorData);
      return json({
        error: errorData.error?.message || `Groq API error: ${response.status}`,
        provider: "groq"
      }, 502);
    }

    // Handle streaming
    if (stream && response.body) {
      return new Response(response.body, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Handle regular response
    const data = await response.json();

    // Transform to OpenAI-compatible format
    return json({
      id: data.id,
      object: "chat.completion",
      created: data.created,
      model: data.model,
      choices: data.choices.map((choice: any) => ({
        index: choice.index,
        message: {
          role: choice.message.role,
          content: choice.message.content,
        },
        finish_reason: choice.finish_reason,
      })),
      usage: data.usage,
      provider: "groq",
      tier: "open-source",
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[groq-proxy] Error:", msg);
    return json({ error: msg, provider: "groq" }, 500);
  }
});
