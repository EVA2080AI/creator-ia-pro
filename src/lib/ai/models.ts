// Catálogo único de modelos de IA — reemplaza las 5 copias que había en el
// proyecto (models.config.ts, studio/chat/constants.ts, ai-service.ts,
// StudioChatLite.tsx, useAIProvider.ts), cada una con costes y disponibilidad
// distintos. Importado tanto por el frontend como por /api/ai/chat.
//
// IDs verificados en vivo contra https://openrouter.ai/api/v1/models el
// 2026-08-26 (catálogo base) y otra pasada el 2026-09-29 (modelos de texto,
// código e imagen agregados a pedido del usuario — "necesito que puedas
// poner mas modelos, de texto codigo, imagen"). Los que estaban en uso y
// resultaron NO existir ya (ver docs/INVENTARIO_FUNCIONALIDADES.md G-11,
// T-17): google/gemini-2.0-flash-001, google/gemini-2.0-flash-lite-001,
// anthropic/claude-3.5-sonnet, anthropic/claude-sonnet-4-5,
// anthropic/claude-sonnet-4-6, anthropic/claude-3-opus(-20240229),
// anthropic/claude-opus-4-6, google/gemini-pro-1.5,
// google/gemini-2.5-pro-preview-03-25.

export type ModelCategory = "eco" | "pro" | "ultra";
export const CATEGORY_ORDER: ModelCategory[] = ["eco", "pro", "ultra"];
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
  /** true = genera muy despacio (medido: ~9 tokens/s → una página completa tarda varios minutos y el
   *  servidor la corta a los 54s). El selector lo avisa para que no se elija para construir sitios. */
  slow?: boolean;
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
    description: "Buen razonamiento, sin coste, pero lento (~9 tokens/s): úsalo para preguntas cortas.",
    category: "eco",
    credits: 0,
    minTier: "free",
    context: "160K tokens",
    vision: false,
    free: true,
    slow: true,
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
  {
    id: "google/gemma-4-31b-it:free",
    label: "Gemma 4 31B",
    provider: "Google",
    description: "Modelo gratuito de Google, multimodal, ideal para chat general sin coste.",
    category: "eco",
    credits: 0,
    minTier: "free",
    context: "256K tokens",
    vision: true,
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
  {
    id: "deepseek/deepseek-v3.2",
    label: "DeepSeek V3.2",
    provider: "DeepSeek",
    description: "Sucesor de V3.1, extremadamente económico y potente para texto general.",
    category: "pro",
    credits: 1,
    minTier: "creador",
    context: "160K tokens",
    vision: false,
    free: false,
  },
  {
    id: "openai/gpt-5-mini",
    label: "GPT-5 Mini",
    provider: "OpenAI",
    description: "Equilibrio ideal entre costo y calidad para chat cotidiano, con visión.",
    category: "pro",
    credits: 2,
    minTier: "creador",
    context: "400K tokens",
    vision: true,
    free: false,
  },
  {
    id: "mistralai/mistral-medium-3.1",
    label: "Mistral Medium 3.1",
    provider: "Mistral",
    description: "Modelo versátil de Mistral con buen desempeño en conversación y visión.",
    category: "pro",
    credits: 2,
    minTier: "creador",
    context: "128K tokens",
    vision: true,
    free: false,
  },
  {
    id: "mistralai/codestral-2508",
    label: "Codestral 2508",
    provider: "Mistral",
    description: "Especializado en autocompletado, corrección de errores y código de baja latencia.",
    category: "pro",
    credits: 1,
    minTier: "creador",
    context: "256K tokens",
    vision: false,
    free: false,
  },
  {
    id: "openai/gpt-5.1-codex-mini",
    label: "GPT-5.1 Codex Mini",
    provider: "OpenAI",
    description: "Versión ligera de GPT-5.1-Codex, pensada para tareas de programación rápidas.",
    category: "pro",
    credits: 2,
    minTier: "creador",
    context: "400K tokens",
    vision: true,
    free: false,
  },
  {
    id: "moonshotai/kimi-k2.7-code",
    label: "Kimi K2.7 Code",
    provider: "Moonshot AI",
    description: "Enfocado en completar tareas de programación de extremo a extremo, contexto largo.",
    category: "pro",
    credits: 2,
    minTier: "creador",
    context: "256K tokens",
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
  {
    id: "x-ai/grok-4.7",
    label: "Grok 4.7",
    provider: "xAI",
    description: "Última versión de Grok, conversación avanzada y multimodal.",
    category: "ultra",
    credits: 6,
    minTier: "pro",
    context: "500K tokens",
    vision: true,
    free: false,
  },
  {
    id: "qwen/qwen3-max",
    label: "Qwen3 Max",
    provider: "Qwen",
    description: "Modelo insignia de Alibaba, gran capacidad de razonamiento en texto.",
    category: "ultra",
    credits: 5,
    minTier: "pro",
    context: "256K tokens",
    vision: false,
    free: false,
  },
  {
    id: "qwen/qwen3-coder-plus",
    label: "Qwen3 Coder Plus",
    provider: "Qwen",
    description: "Flagship de Qwen para codificación autónoma, 1M de tokens de contexto.",
    category: "ultra",
    credits: 5,
    minTier: "pro",
    context: "1M tokens",
    vision: false,
    free: false,
  },
];

export const DEFAULT_MODEL_ID = CHAT_MODELS[0].id; // google/gemini-2.5-flash-lite — gratis, disponible en todos los planes

/** "Auto": Basalt elige el modelo según la tarea. No es un modelo del catálogo —
 *  el cliente lo resuelve a uno concreto ANTES de enviar, así el servidor nunca
 *  lo ve y la cabecera X-Model-Used muestra cuál respondió de verdad. */
export const AUTO_MODEL_ID = "auto";

// Por qué solo dos y siempre gratis: Auto no debe gastar créditos por su cuenta
// (sorpresa de cobro) ni apostar por un modelo flaco. Del benchmark 2026-10-04:
// gpt-oss-120b 12/12 en sitios (9-47 s); flash-lite 11/12 y el más rápido
// (6-14 s), con visión y 1M de contexto. DeepSeek V3.1 fuera (9 tok/s, se corta);
// Gemma 4 fuera (429 intermitentes del upstream).
const AUTO_CHAT_ID = "google/gemini-2.5-flash-lite";
const AUTO_CODE_ID = "openai/gpt-oss-120b";

// Señales de "esto es código o un sitio", en el español de los usuarios y en
// inglés técnico. Deliberadamente conservadora: ante la duda, el chat general.
const CODE_RE = /\b(c[oó]digo|programa(?:r|ci[oó]n)|app|aplicaci[oó]n|web|sitio|p[aá]gina|landing|dashboard|formulario|calculadora|componente|funci[oó]n|script|html|css|javascript|typescript|react|vite|tailwind|python|sql|api|json|regex|bug|depurar?|refactor)\b/i;

export function looksLikeCodeRequest(text: string): boolean {
  return CODE_RE.test(text);
}

/** El modelo concreto que usaría "Auto" para este mensaje. */
export function resolveAutoModel(opts: { hasImages: boolean; text: string }): ModelDef {
  // Con foto manda la visión (una captura de un error también es código, pero
  // sin ojos no hay nada que hacer); flash-lite ve y además aguanta código.
  if (opts.hasImages) return getModel(AUTO_CHAT_ID);
  if (looksLikeCodeRequest(opts.text)) return getModel(AUTO_CODE_ID);
  return getModel(AUTO_CHAT_ID);
}

export function getModel(id: string | null | undefined): ModelDef {
  return CHAT_MODELS.find((m) => m.id === id) ?? CHAT_MODELS.find((m) => m.id === DEFAULT_MODEL_ID)!;
}

export function isKnownModel(id: string): boolean {
  return CHAT_MODELS.some((m) => m.id === id);
}

// ── Modelos de imagen (ver /api/ai/image) ─────────────────────────────────────
// 2026-09-09: la cuenta de Replicate se quedó sin saldo ("Insufficient
// credit" — verificado en vivo contra la API real de Replicate con el mismo
// token que usa producción), así que Flux Schnell/1.1 Pro dejaban de
// funcionar para cualquier usuario. Se reemplaza por generación de imágenes
// vía OpenRouter (la cuenta que sí está paga), que desde 2026 tiene una API
// de imágenes real (`POST /api/v1/images`) — verificado en vivo con una
// generación real antes de conectarlo acá. Si se vuelve a cargar saldo en
// Replicate, los modelos Flux se pueden reactivar con `provider: "replicate"`
// (la rama de código sigue existiendo en api/ai/image.ts).
export interface ImageModelDef {
  id: string;
  provider: "replicate" | "openrouter";
  /** Slug del modelo en Replicate (`owner/name`) — solo si provider === "replicate". */
  replicateSlug?: string;
  /** ID del modelo en OpenRouter (`provider/model`) — solo si provider === "openrouter". */
  openrouterSlug?: string;
  label: string;
  /** Nombre de vitrina de la empresa detrás del modelo (Google, OpenAI, etc.) — para mostrar en el selector, distinto de `provider` (que es la API que lo sirve). */
  providerLabel: string;
  /** Una frase corta que distinga a este motor de los demás — el selector (ModelSelector.tsx) ya no la genera sola. */
  description: string;
  credits: number;
  minTier: PlanTier;
  supportsImagePrompt: boolean; // acepta imagen de referencia (estilo, mockup)
}

export const IMAGE_MODELS: ImageModelDef[] = [
  {
    id: "gemini-flash-image",
    provider: "openrouter",
    openrouterSlug: "google/gemini-2.5-flash-image",
    label: "Gemini Flash Image",
    providerLabel: "Google",
    description: "Rápido y disponible en el plan gratuito. Buen punto de partida para cualquier imagen.",
    credits: 3,
    minTier: "free",
    supportsImagePrompt: true,
  },
  // Los 4 siguientes se agregaron el 2026-09-29 (pedido: "revisa los
  // creadores de imagen... revisa la lista") — IDs verificados en vivo
  // contra GET /api/v1/images/models de OpenRouter (el catálogo que
  // realmente acepta POST /api/v1/images, distinto del catálogo general de
  // /api/v1/models — varios de estos ni aparecen ahí).
  {
    id: "gemini-3-pro-image",
    provider: "openrouter",
    openrouterSlug: "google/gemini-3-pro-image",
    label: "Nano Banana Pro",
    providerLabel: "Google",
    description: "El motor de imagen más avanzado de Google: edición fiel a la referencia, hasta 14 imágenes de referencia.",
    credits: 5,
    minTier: "creador",
    supportsImagePrompt: true,
  },
  {
    id: "gpt-image-1",
    provider: "openrouter",
    openrouterSlug: "openai/gpt-image-1",
    label: "GPT Image 1",
    providerLabel: "OpenAI",
    description: "Texto legible dentro de la imagen y fondos transparentes. Ideal para piezas con tipografía.",
    credits: 5,
    minTier: "creador",
    supportsImagePrompt: true,
  },
  {
    id: "flux-2-pro",
    provider: "openrouter",
    openrouterSlug: "black-forest-labs/flux.2-pro",
    label: "FLUX.2 Pro",
    providerLabel: "Black Forest Labs",
    description: "Calidad visual de frontera y consistencia de estilo/personaje entre generaciones.",
    credits: 4,
    minTier: "creador",
    supportsImagePrompt: true,
  },
  {
    id: "seedream-4.5",
    provider: "openrouter",
    openrouterSlug: "bytedance-seed/seedream-4.5",
    label: "Seedream 4.5",
    providerLabel: "ByteDance",
    description: "Edición muy consistente y buena preservación de detalles del sujeto entre variaciones.",
    credits: 4,
    minTier: "creador",
    supportsImagePrompt: true,
  },
];

export const DEFAULT_IMAGE_MODEL_ID = IMAGE_MODELS[0].id;

export function getImageModel(id: string | null | undefined): ImageModelDef {
  return IMAGE_MODELS.find((m) => m.id === id) ?? IMAGE_MODELS[0];
}
