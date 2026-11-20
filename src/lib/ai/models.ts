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
  /** Potencia relativa, 1-5. Sin valor vale la de su categoría (`CATEGORY_META.bolts`:
   *  eco 1, pro 3, ultra 5). Es lo que el selector le muestra al usuario en la etiqueta
   *  de cada modelo — ver `powerTier`. */
  power?: number;
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

/** true = OpenRouter NO nos cobra por este modelo (variante `:free`). No confundir con
 *  `ModelDef.free`, que es "no le cuesta créditos al USUARIO": Flash Lite, DeepSeek, Llama y
 *  GPT-OSS son gratis para él, pero a nosotros OpenRouter sí nos los factura por token. */
export function isUpstreamFree(id: string): boolean {
  return id.endsWith(":free");
}

/** El catálogo ENTERO, incluidos los modelos que hoy están ocultos. Para ofrecer o
 *  validar un modelo se usa `CHAT_MODELS` (más abajo), no este. */
export const ALL_CHAT_MODELS: ModelDef[] = [
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
  // ── Gratis de verdad (costo $0 en OpenRouter) ───────────────────────────
  // Agregados el 2026-11-20 (pedido: "qué modelos gratuitos potentes podemos habilitar…
  // y ocultar mientras los de pago"). De los 12 `:free` que había ese día se probaron 11
  // en vivo con la forma real de la petición (stream + tools) y el benchmark de sitios
  // (scripts/css-benchmark.ts, 2-4 corridas): quedan los que respondieron SIEMPRE, hablan
  // buen español, llaman bien a `web_search` y arman un sitio completo.
  //   Nemotron 3.5 Super  10-12/12 · chat en ~5 s · ve fotos
  //   Nemotron 3 Ultra    10-11/12 · empieza a escribir un sitio a los ~5 s (los demás
  //                       razonan 15-130 s en silencio antes de la primera letra)
  //   ERNIE 5.5 Flash     11-12/12 · el más rápido en chat, pero su razonamiento es muy
  //                       variable (un sitio tardó 41 s y otro 148 s)
  //   Dots 3 Note         8-12/12  · ve fotos · OpenRouter lo retira el 2026-12-31
  // Descartados: Nemotron 3.5 Lightning (llama a web_search para una pregunta normal),
  // Nemotron 3 Nano Omni (un sitio se le fue en 32k tokens de razonamiento sin entregar
  // nada), Flint (argumentos de herramienta mal formados), Ling 3.2 Flash (429 en 8 de 8)
  // y Particle-1 (429 en 6 de 8). El orden importa: el primero es el modelo por defecto
  // cuando FREE_ONLY_MODE está activo.
  {
    id: "nvidia/nemotron-3.5-super-vl:free",
    label: "Nemotron 3.5 Super",
    provider: "NVIDIA",
    description: "Rápido, ve fotos y aguanta documentos largos. El todoterreno.",
    category: "eco",
    power: 2,
    credits: 0,
    minTier: "free",
    context: "1M tokens",
    vision: true,
    free: true,
  },
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b:free",
    label: "Nemotron 3 Ultra",
    provider: "NVIDIA",
    description: "El más grande: el que mejor redacta y razona. El indicado para sitios y código.",
    category: "eco",
    power: 3,
    credits: 0,
    minTier: "free",
    context: "1M tokens",
    vision: false,
    free: true,
  },
  {
    id: "baidu/ernie-5.5-flash-preview:free",
    label: "ERNIE 5.5 Flash",
    provider: "Baidu",
    description: "Muy ágil en chat y bueno armando sitios; a veces piensa un rato antes de escribir.",
    category: "eco",
    power: 2,
    credits: 0,
    minTier: "free",
    context: "1M tokens",
    vision: false,
    free: true,
  },
  {
    id: "dots-studio/dots-3-note-preview:free",
    label: "Dots 3 Note",
    provider: "Dots Studio",
    description: "Alternativa con visión para chat general y análisis de imágenes.",
    category: "eco",
    credits: 0,
    minTier: "free",
    context: "512K tokens",
    vision: true,
    free: true,
  },
  {
    id: "google/gemma-4-31b-it:free",
    label: "Gemma 4 31B",
    provider: "Google",
    description: "Modelo abierto de Google, multimodal, para chat general y preguntas rápidas.",
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
  // Qwen3 Max y Qwen3 Coder Plus se retiraron el 2026-10-20: siguen fichados en el
  // catálogo de OpenRouter pero con CERO endpoints activos — nadie los sirve, así que
  // la llamada fallaba. El crédito volvía (el `!sawAnyContent` de api/ai/chat.ts lo
  // reembolsa), pero el usuario Pro veía un error en dos de los seis modelos Ultra que
  // le promete su plan. Antes de añadir un modelo, comprobar que
  // GET /api/v1/models/<id>/endpoints trae al menos un proveedor: el catálogo lista
  // fichas que ya no tienen quien las atienda.
];

/**
 * Modo "solo gratuitos" — `true` desde el 2026-11-20, a pedido de Sebastián ("ocultar
 * mientras los de pago"), con la cuenta de OpenRouter en US$0,45 de saldo.
 *
 * En `true`, el producto solo ofrece Y solo acepta modelos que a nosotros no nos cuestan
 * nada (`isUpstreamFree`): desaparecen del selector los Pro/Ultra y también los cuatro
 * "Gratis" que en realidad se facturaban por token (Flash Lite, DeepSeek, Llama, GPT-OSS).
 * El servidor valida contra esta misma lista, así que un id oculto que llegue igual (un
 * navegador con la app vieja, un Experto guardado con Flash Lite) se atiende con el modelo
 * por defecto en vez de gastar saldo.
 *
 * Para devolver los de pago: recargar OpenRouter y pasar esto a `false`. No hay que tocar
 * nada más — los gratuitos nuevos se quedan como opciones extra de la sección "Gratis".
 *
 * Ojo, esto NO apaga las imágenes: todos los motores de IMAGE_MODELS cuestan plata real
 * (no existe uno gratuito en OpenRouter) y siguen cobrando créditos al usuario.
 */
export const FREE_ONLY_MODE: boolean = true;

/** Lo que se ofrecería con el modo en `freeOnly` — función aparte para poder probar los dos. */
export function visibleChatModels(freeOnly: boolean): ModelDef[] {
  return freeOnly ? ALL_CHAT_MODELS.filter((m) => isUpstreamFree(m.id)) : ALL_CHAT_MODELS;
}

/** Los modelos que HOY se pueden elegir y que el servidor acepta. */
export const CHAT_MODELS: ModelDef[] = visibleChatModels(FREE_ONLY_MODE);

// El primero de la lista visible: Nemotron 3.5 Super con el modo solo-gratuitos,
// Gemini 2.5 Flash Lite sin él. Gratis y disponible en todos los planes en ambos casos.
export const DEFAULT_MODEL_ID = CHAT_MODELS[0].id;

/** "Auto": Basalt elige el modelo según la tarea. No es un modelo del catálogo —
 *  el cliente lo resuelve a uno concreto ANTES de enviar, así el servidor nunca
 *  lo ve y la cabecera X-Model-Used muestra cuál respondió de verdad. */
export const AUTO_MODEL_ID = "auto";

// Por qué solo dos y siempre gratis: Auto no debe gastar créditos por su cuenta
// (sorpresa de cobro) ni apostar por un modelo flaco. Del benchmark 2026-10-04:
// gpt-oss-120b 12/12 en sitios (9-47 s); flash-lite 11/12 y el más rápido
// (6-14 s), con visión y 1M de contexto. DeepSeek V3.1 fuera (9 tok/s, se corta);
// Gemma 4 fuera (429 intermitentes del upstream).
//
// Con FREE_ONLY_MODE (2026-11-20) esos dos están ocultos y Auto usa el par equivalente de
// costo $0: Nemotron 3.5 Super para chat y fotos (visión, 1M) y Nemotron 3 Ultra para
// código, que es el único que empieza a escribir el sitio enseguida (~5 s) y saca 10-11/12
// de forma pareja. ERNIE queda fuera de Auto a propósito: su proveedor es Baidu (China) y
// eso lo debe elegir el usuario viendo el nombre, no pasarle sin que lo sepa.
export const AUTO_CHAT_ID = FREE_ONLY_MODE ? "nvidia/nemotron-3.5-super-vl:free" : "google/gemini-2.5-flash-lite";
export const AUTO_CODE_ID = FREE_ONLY_MODE ? "nvidia/nemotron-3-ultra-550b-a55b:free" : "openai/gpt-oss-120b";

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

// ── Potencia: lo que dice la etiqueta de cada modelo ─────────────────────────
// Pedido de Sebastián (2026-11-20): "el usuario no debe saber en los tags si es gratis,
// deben saber cuál es más potente". La etiqueta ya no dice "Gratis": dice qué tan potente
// es el modelo frente a los demás que se ven en ese momento. El costo solo aparece cuando
// existe ("2 cr"); que no haya chip de costo es lo que significa que no cuesta.
//
// Es RELATIVA al catálogo visible a propósito: con FREE_ONLY_MODE el tope es Nemotron 3
// Ultra, y al volver los de pago el tope pasa a ser la categoría Ultra sin tocar nada.
// Los valores de los gratuitos nuevos salen de las pruebas del 2026-11-20 (tamaño del
// modelo + benchmark de sitios); los de los modelos anteriores son los de su categoría y
// NO están medidos unos contra otros — afinarlos el día que se reactiven.
export type PowerTier = "top" | "mid" | "light";
export const POWER_LABEL: Record<PowerTier, string> = { top: "Más potente", mid: "Potente", light: "Ligero" };

export function modelPower(m: ModelDef): number {
  return m.power ?? CATEGORY_META[m.category].bolts;
}

/** El escalón de `m` entre los modelos de `among` (por defecto, los que hoy se ofrecen). */
export function powerTier(m: ModelDef, among: ModelDef[] = CHAT_MODELS): PowerTier {
  const all = among.map(modelPower);
  const max = Math.max(...all);
  const min = Math.min(...all);
  const p = modelPower(m);
  if (max === min) return "mid"; // todos iguales: ninguno es "el más potente"
  return p >= max ? "top" : p <= min ? "light" : "mid";
}

/** Los modelos de `list` del más potente al menos (orden estable entre iguales). */
export function byPower(list: ModelDef[]): ModelDef[] {
  return [...list].sort((a, b) => modelPower(b) - modelPower(a));
}

/** Nombre de vitrina de un modelo aunque hoy esté oculto: el chip "qué modelo respondió"
 *  de un mensaje viejo tiene que seguir diciendo "Claude Sonnet 4.5", no el nombre del
 *  modelo por defecto (que es lo que devolvería `getModel`). */
export function modelLabel(id: string | null | undefined): string {
  return ALL_CHAT_MODELS.find((m) => m.id === id)?.label ?? getModel(id).label;
}

// Los gratuitos se saturan seguido: el día que se probaron, 4 de 11 devolvían 429
// ("temporarily rate-limited upstream"), incluido Gemma 4, que estaba publicado. Cuando
// el elegido no responde, el servidor prueba estos en orden antes de mostrar un error.
// Dos de NVIDIA y uno de otra infraestructura (AtlasCloud) por si la caída es de NVIDIA.
// Solo gratuitos: un respaldo de pago cobraría saldo sin que nadie lo pidiera.
const FREE_FALLBACK_ORDER = [
  "nvidia/nemotron-3.5-super-vl:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "dots-studio/dots-3-note-preview:free",
];

/** Hasta dos gratuitos para reintentar cuando `id` falla; con fotos, solo los que ven. */
export function freeFallbacks(id: string, needsVision: boolean): string[] {
  return FREE_FALLBACK_ORDER
    .filter((alt) => alt !== id && isKnownModel(alt) && (!needsVision || getModel(alt).vision))
    .slice(0, 2);
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
