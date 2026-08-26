// Catálogo único de modelos de IA — reemplaza las 5 copias que había en el
// proyecto (models.config.ts, studio/chat/constants.ts, ai-service.ts,
// StudioChatLite.tsx, useAIProvider.ts), cada una con costes y disponibilidad
// distintos. Importado tanto por el frontend como por /api/ai/chat.
//
// IDs verificados en vivo contra https://openrouter.ai/api/v1/models el
// 2026-08-26. Los que estaban en uso y resultaron NO existir ya (ver
// docs/INVENTARIO_FUNCIONALIDADES.md G-11, T-17): google/gemini-2.0-flash-001,
// google/gemini-2.0-flash-lite-001, anthropic/claude-3.5-sonnet,
// anthropic/claude-sonnet-4-5, anthropic/claude-sonnet-4-6,
// anthropic/claude-3-opus(-20240229), anthropic/claude-opus-4-6,
// google/gemini-pro-1.5, google/gemini-2.5-pro-preview-03-25.

export type ModelCategory = "eco" | "pro" | "ultra";
export type PlanTier = "free" | "creador" | "pro" | "agencia" | "pyme";

export interface ModelDef {
  /** ID exacto de OpenRouter (`provider/model`). */
  id: string;
  label: string;
  provider: string;
  description: string;
  category: ModelCategory;
  /** Créditos por mensaje (tarifa plana; ver `estimateCredits` para tokens largos). */
  credits: number;
  minTier: PlanTier;
  context: string;
  vision: boolean;
  /** true = no cuesta créditos (útil para el asistente de bienvenida / plan free). */
  free: boolean;
}

export const CATEGORY_META: Record<ModelCategory, { label: string; color: string; bolts: number }> = {
  eco: { label: "Eco", color: "#22C55E", bolts: 1 },
  pro: { label: "Pro", color: "#A855F7", bolts: 3 },
  ultra: { label: "Ultra", color: "#F59E0B", bolts: 5 },
};

export const TIER_ORDER: PlanTier[] = ["free", "creador", "pro", "agencia", "pyme"];

const TIER_ALIASES: Record<string, PlanTier> = { pymes: "pyme", starter: "creador", creator: "pro", agency: "agencia" };

export function normalizeTier(tier: string | null | undefined): PlanTier {
  const t = (tier || "free").toLowerCase();
  return TIER_ALIASES[t] || (TIER_ORDER.includes(t as PlanTier) ? (t as PlanTier) : "free");
}

export function canAccessModel(userTier: string | null | undefined, minTier: PlanTier): boolean {
  return TIER_ORDER.indexOf(normalizeTier(userTier)) >= TIER_ORDER.indexOf(minTier);
}

export const CHAT_MODELS: ModelDef[] = [
  // ── Eco — gratis, plan free ─────────────────────────────────────────────
  {
    id: "google/gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash Lite",
    provider: "Google",
    description: "Ultra rápido y sin coste. Ideal para respuestas cortas y ediciones puntuales.",
    category: "eco",
    credits: 0,
    minTier: "free",
    context: "1M tokens",
    vision: true,
    free: true,
  },
  {
    id: "deepseek/deepseek-chat-v3.1",
    label: "DeepSeek V3.1",
    provider: "DeepSeek",
    description: "Balance ideal costo/calidad. Buen código, sin coste en el plan gratuito.",
    category: "eco",
    credits: 0,
    minTier: "free",
    context: "160K tokens",
    vision: false,
    free: true,
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    label: "Llama 3.3 70B",
    provider: "Meta",
    description: "Open source de alto rendimiento, sin coste.",
    category: "eco",
    credits: 0,
    minTier: "free",
    context: "128K tokens",
    vision: false,
    free: true,
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    provider: "OpenAI",
    description: "Open weight de OpenAI. Rápido y económico para tareas generales.",
    category: "eco",
    credits: 0,
    minTier: "free",
    context: "128K tokens",
    vision: false,
    free: true,
  },
  // ── Pro — requiere plan Creador+ ────────────────────────────────────────
  {
    id: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "Google",
    description: "Rápido, multimodal, contexto de 1M tokens. Buen equilibrio para código y chat.",
    category: "pro",
    credits: 1,
    minTier: "creador",
    context: "1M tokens",
    vision: true,
    free: false,
  },
  {
    id: "anthropic/claude-haiku-4.5",
    label: "Claude Haiku 4.5",
    provider: "Anthropic",
    description: "Claude compacto y ágil. Redacción y código con buena relación velocidad/calidad.",
    category: "pro",
    credits: 2,
    minTier: "creador",
    context: "200K tokens",
    vision: true,
    free: false,
  },
  {
    id: "qwen/qwen3-coder",
    label: "Qwen3 Coder",
    provider: "Qwen",
    description: "Especializado en generación de código, contexto largo.",
    category: "pro",
    credits: 2,
    minTier: "creador",
    context: "262K tokens",
    vision: false,
    free: false,
  },
  {
    id: "openai/gpt-4.1-mini",
    label: "GPT-4.1 Mini",
    provider: "OpenAI",
    description: "Visión + código a precio contenido. Buen todoterreno.",
    category: "pro",
    credits: 2,
    minTier: "creador",
    context: "1M tokens",
    vision: true,
    free: false,
  },
  // ── Ultra — máximo razonamiento, requiere Pro+ ──────────────────────────
  {
    id: "anthropic/claude-sonnet-4.5",
    label: "Claude Sonnet 4.5",
    provider: "Anthropic",
    description: "El más sólido para arquitectura de código compleja y refactors grandes.",
    category: "ultra",
    credits: 5,
    minTier: "pro",
    context: "1M tokens",
    vision: true,
    free: false,
  },
  {
    id: "anthropic/claude-opus-4.5",
    label: "Claude Opus 4.5",
    provider: "Anthropic",
    description: "Máximo razonamiento de Anthropic. Para los problemas más difíciles.",
    category: "ultra",
    credits: 10,
    minTier: "agencia",
    context: "200K tokens",
    vision: true,
    free: false,
  },
  {
    id: "x-ai/grok-4.5",
    label: "Grok 4.5",
    provider: "xAI",
    description: "Razonamiento de última generación con contexto extenso.",
    category: "ultra",
    credits: 6,
    minTier: "pro",
    context: "500K tokens",
    vision: true,
    free: false,
  },
];

export const DEFAULT_MODEL_ID = CHAT_MODELS[0].id; // google/gemini-2.5-flash-lite — gratis, disponible en todos los planes

export function getModel(id: string | null | undefined): ModelDef {
  return CHAT_MODELS.find((m) => m.id === id) ?? CHAT_MODELS.find((m) => m.id === DEFAULT_MODEL_ID)!;
}

export function isKnownModel(id: string): boolean {
  return CHAT_MODELS.some((m) => m.id === id);
}

// ── Modelos de imagen (Replicate; ver /api/ai/image) ─────────────────────────
export interface ImageModelDef {
  id: string;
  replicateSlug: string;
  label: string;
  credits: number;
  minTier: PlanTier;
  supportsImagePrompt: boolean; // acepta imagen de referencia (estilo, mockup)
}

export const IMAGE_MODELS: ImageModelDef[] = [
  {
    id: "flux-schnell",
    replicateSlug: "black-forest-labs/flux-schnell",
    label: "Flux Schnell",
    credits: 2,
    minTier: "free",
    supportsImagePrompt: false,
  },
  {
    id: "flux-1.1-pro",
    replicateSlug: "black-forest-labs/flux-1.1-pro",
    label: "Flux 1.1 Pro",
    credits: 4,
    minTier: "creador",
    supportsImagePrompt: true,
  },
];

export const DEFAULT_IMAGE_MODEL_ID = IMAGE_MODELS[0].id;

export function getImageModel(id: string | null | undefined): ImageModelDef {
  return IMAGE_MODELS.find((m) => m.id === id) ?? IMAGE_MODELS[0];
}
