// Hugging Face Inference Proxy
// Free tier: 1,000 requests/month
// https://huggingface.co/inference-api

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Popular open source models on Hugging Face
const HF_MODELS: Record<string, string> = {
  // Mistral
  "mistral-7b": "mistralai/Mistral-7B-Instruct-v0.2",
  "mistral-7b-v3": "mistralai/Mistral-7B-Instruct-v0.3",
  "mixtral-8x22b": "mistralai/Mixtral-8x22B-Instruct-v0.1",
  // Llama 2
  "llama2-7b": "meta-llama/Llama-2-7b-chat-hf",
  "llama2-13b": "meta-llama/Llama-2-13b-chat-hf",
  "llama2-70b": "meta-llama/Llama-2-70b-chat-hf",
  // Code models
  "codellama-7b": "codellama/CodeLlama-7b-Instruct-hf",
  "codellama-13b": "codellama/CodeLlama-13b-Instruct-hf",
  "codellama-34b": "codellama/CodeLlama-34b-Instruct-hf",
  "deepseek-coder": "deepseek-ai/deepseek-coder-6.7b-instruct",
  // Small/fast models
  "phi-3": "microsoft/Phi-3-mini-4k-instruct",
  "gemma-2b": "google/gemma-2b-it",
  "gemma-7b": "google/gemma-7b-it",
  "qwen2-7b": "Qwen/Qwen2-7B-Instruct",
  "qwen2-72b": "Qwen/Qwen2-72B-Instruct",
};

// Rate limiting: 30 requests/minute (conservative for free tier)
const RATE_LIMIT = 30;
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

// Format messages for different model types
function formatMessages(messages: any[], model: string): string {
  // Check if it's a chat/instruct model
  if (model.includes("Instruct") || model.includes("chat") || model.includes("it")) {
    // Use chat template
    let formatted = "";
    for (const msg of messages) {
      if (msg.role === "system") {
        formatted += `<s>[INST] <<SYS>>\n${msg.content}\n<</SYS>>\n\n`;
      } else if (msg.role === "user") {
        if (formatted.includes("[INST]")) {
          formatted += `${msg.content} [/INST]`;
        } else {
          formatted += `<s>[INST] ${msg.content} [/INST]`;
        }
      } else if (msg.role === "assistant") {
        formatted += ` ${msg.content} </s>`;
      }
    }
    return formatted;
  }

  // Fallback: simple concatenation
  return messages.map(m => m.content).join("\n\n");
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
        error: "Rate limit exceeded. HF free tier: 30 req/min.",
        code: "rate_limit",
        retryAfter: 60
      }, 429);
    }

    const apiKey = Deno.env.get("HUGGINGFACE_API_KEY");
    if (!apiKey) {
      return json({ error: "HUGGINGFACE_API_KEY not configured" }, 503);
    }

    const payload = await req.json();
    const {
      model,
      messages,
      temperature = 0.7,
      max_tokens = 2048,
      stream = false,
      top_p = 0.95,
      top_k = 40,
    } = payload;

    const hfModel = HF_MODELS[model] || model;

    // Validate model
    if (!Object.values(HF_MODELS).includes(hfModel)) {
      return json({
        error: `Model ${model} not in HF whitelist. Available: ${Object.keys(HF_MODELS).join(", ")}`,
        provider: "huggingface"
      }, 400);
    }

    // Format messages for the model
    const prompt = formatMessages(messages, hfModel);

    // HF Inference API endpoint
    const apiUrl = `https://api-inference.huggingface.co/models/${hfModel}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          temperature,
          max_new_tokens: max_tokens,
          top_p,
          top_k,
          return_full_text: false,
        },
        stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HF API error:", response.status, errorText);

      // Handle model loading
      if (response.status === 503 && errorText.includes("currently loading")) {
        return json({
          error: "Model is loading. Try again in ~20 seconds.",
          provider: "huggingface",
          code: "model_loading"
        }, 503);
      }

      return json({
        error: `HF API error: ${response.status}`,
        details: errorText.slice(0, 200),
        provider: "huggingface"
      }, 502);
    }

    const data = await response.json();

    // Transform to OpenAI-compatible format
    // HF returns [{ generated_text: "..." }] or just the text
    let content = "";
    if (Array.isArray(data) && data[0]?.generated_text) {
      content = data[0].generated_text;
    } else if (typeof data === "string") {
      content = data;
    } else if (data.generated_text) {
      content = data.generated_text;
    }

    return json({
      id: `hf-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: hfModel,
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: content.trim(),
        },
        finish_reason: "stop",
      }],
      usage: {
        prompt_tokens: prompt.length / 4, // Rough estimate
        completion_tokens: content.length / 4,
        total_tokens: (prompt.length + content.length) / 4,
      },
      provider: "huggingface",
      tier: "open-source",
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[huggingface-proxy] Error:", msg);
    return json({ error: msg, provider: "huggingface" }, 500);
  }
});
