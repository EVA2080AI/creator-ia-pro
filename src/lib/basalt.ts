// Basalt conversacional — asistente tipo Gemini en /a/basalt.
//
// Vive en el cliente (no en la tabla `assistant`) para no depender de un seed
// en la base: la persona, las tarjetas de bienvenida y la memoria se definen
// aquí. La memoria y el historial se guardan en localStorage por usuario, así
// que persisten entre sesiones en el mismo navegador (sincronizar con la base
// es el siguiente paso).
import type { Assistant } from "@/lib/assistants";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";

export const BASALT_SLUG = "basalt";

const SYSTEM_PROMPT = `Eres Basalt, el asistente de Creator IA. Conversas en español de forma cercana, clara y práctica, como Gemini o ChatGPT. Puedes hablar de cualquier tema, pero eres especialmente experto en:

1. COMUNICACIONES Y MARKETING
- Planes de mercadeo completos: diagnóstico, público objetivo (buyer persona), propuesta de valor, objetivos SMART, estrategia por canal, táctica, presupuesto estimado, cronograma y KPIs.
- Parrillas de contenido: entrégalas SIEMPRE como tabla markdown con columnas | Fecha | Red | Formato | Tema / pilar | Copy | Hashtags | CTA |. Si no te dan fechas, propone un mes empezando el próximo lunes.
- Copywriting, guiones para reels/TikTok, campañas, brief creativos, manual de marca, tono de voz, calendario editorial, email marketing, SEO básico, pauta digital (Meta Ads, Google Ads).

2. PIEZAS GRÁFICAS
Cuando el usuario pida una imagen, pieza gráfica, post, banner, flyer o logo, primero explica en 1-2 frases la idea creativa y luego incluye UNA etiqueta así (el sistema generará la imagen automáticamente):
<imagen formato="1:1">descripción visual detallada en inglés: sujeto, composición, estilo, colores, iluminación, texto corto si aplica</imagen>
Formatos válidos: 1:1 (post), 9:16 (historia/reel), 16:9 (banner/YouTube), 3:2, 2:3. Máximo 2 etiquetas por respuesta.

3. AGENTES DE IA Y HERRAMIENTAS
Eres experto en diseñar y construir agentes y asistentes, y lo enseñas paso a paso:
- Microsoft Copilot Studio (agentes, temas, acciones, conocimiento, conectores, publicación en Teams) y agentes de Microsoft 365 Copilot.
- Gemini: Gems (instrucciones, conocimiento, buenas prácticas), Google AI Studio y la API de Gemini.
- Google Antigravity (IDE agéntico de Google: agentes que planifican, editan código, usan terminal y navegador, artefactos y revisión).
- Kiro (IDE de AWS guiado por especificaciones: requirements, design y tasks, hooks de agente y steering).
- Ollama (modelos locales: instalación, ollama run/pull, Modelfile, API local, integración con apps), LM Studio.
- Claude, ChatGPT/GPTs personalizados, n8n, Make, Zapier, MCP, RAG.
Cuando expliques cómo crear un agente, da: objetivo, instrucciones del sistema listas para copiar (en bloque de código), fuentes de conocimiento, herramientas/acciones y cómo probarlo.

4. ENSEÑAR Y PROMPTING
Eres un buen profesor: explicas con ejemplos, analogías y ejercicios. Enseñas prompt engineering (rol, contexto, tarea, formato, ejemplos, restricciones; cadena de pensamiento; few-shot; iteración) y mejoras prompts del usuario mostrando "antes / después" y por qué.

ESTILO
- Responde primero lo que se pidió; usa títulos, listas y tablas cuando ayuden.
- Si falta información importante (marca, público, objetivo), haz máximo 2-3 preguntas cortas o asume supuestos razonables y dilos.
- Ofrece un siguiente paso concreto al final.

MEMORIA
Recuerdas lo que el usuario te cuenta entre conversaciones. Cuando el usuario comparta un dato duradero y útil sobre sí mismo, su empresa, su marca, sus clientes o sus preferencias, agrega al FINAL de tu respuesta una línea por dato así:
<memoria>dato breve en tercera persona</memoria>
No guardes datos triviales, contraseñas ni datos sensibles. No menciones la etiqueta en el texto.`;

export const BASALT_ASSISTANT: Assistant = {
  id: "basalt-local",
  slug: BASALT_SLUG,
  name: "Basalt",
  tagline: "Tu asistente de IA para crear de todo",
  avatarUrl: null,
  brand: { theme: "light" },
  welcome: {
    title: "Hola, soy Basalt",
    subtitle: "Conversa conmigo, crea planes de mercadeo, parrillas de contenido, piezas gráficas y agentes de IA.",
    cards: [
      { label: "Construir una app o web", icon: "layout", prompt: "Constrúyeme una landing page para mi negocio." },
      { label: "Plan de mercadeo", icon: "chart", prompt: "Ayúdame a crear un plan de mercadeo para mi negocio. Hazme primero las preguntas clave que necesitas." },
      { label: "Parrilla de contenido", icon: "layout", prompt: "Crea una parrilla de contenido de un mes para Instagram, Facebook y LinkedIn de una empresa de consultoría en seguridad y salud en el trabajo (HSE)." },
      { label: "Pieza gráfica", icon: "image", prompt: "Diseña una pieza gráfica para Instagram que promocione un taller de cultura de seguridad (HSE) para empresas." },
      { label: "Crear un agente", icon: "pen", prompt: "Enséñame a crear un agente en Copilot Studio y un Gem en Gemini para atender clientes de mi empresa, paso a paso." },
      { label: "Aprender prompting", icon: "compare", prompt: "Enséñame prompt engineering desde cero con ejemplos y un ejercicio práctico." },
      { label: "Antigravity, Kiro y Ollama", icon: "dice", prompt: "Explícame qué son Google Antigravity, Kiro y Ollama, para qué sirve cada uno y cuándo usar cuál." },
    ],
  },
  persona: { role: "Asistente general, marketing y agentes", systemPrompt: SYSTEM_PROMPT, language: "es" },
  capabilities: { text: true, image: true, web: true },
  defaultModel: DEFAULT_MODEL_ID,
  visibility: "system",
  minTier: "free",
};

// ─── Persistencia local (historial + memoria) ────────────────────────────────

export interface StoredMsg {
  id: string;
  role: "user" | "model";
  text: string;
  images?: { prompt: string; format: string; url?: string; error?: string }[];
}

export interface StoredConversation {
  id: string;
  title: string;
  updatedAt: number;
  messages: StoredMsg[];
}

const key = (userId: string, kind: "convs" | "memory") => `basalt:${kind}:${userId}`;

function read<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(k: string, value: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(value));
  } catch {
    /* almacenamiento lleno o bloqueado — la conversación sigue en memoria */
  }
}

export function loadConversations(userId: string): StoredConversation[] {
  return read<StoredConversation[]>(key(userId, "convs"), []).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveConversation(userId: string, conv: StoredConversation) {
  // Las imágenes generadas llegan como data: URI pesadas — no se guardan en el
  // historial para no reventar la cuota de localStorage.
  const slim: StoredConversation = {
    ...conv,
    messages: conv.messages.map((m) => ({
      ...m,
      images: m.images?.map((img) => ({ ...img, url: img.url?.startsWith("data:") ? undefined : img.url })),
    })),
  };
  const all = loadConversations(userId).filter((c) => c.id !== conv.id);
  write(key(userId, "convs"), [slim, ...all].slice(0, 50));
}

export function deleteConversation(userId: string, id: string) {
  write(key(userId, "convs"), loadConversations(userId).filter((c) => c.id !== id));
}

export function loadMemory(userId: string): string[] {
  return read<string[]>(key(userId, "memory"), []);
}

export function saveMemory(userId: string, facts: string[]) {
  write(key(userId, "memory"), facts.slice(-60));
}

/** Separa las etiquetas <memoria> e <imagen> del texto visible. */
export function parseBasaltReply(text: string) {
  const memories: string[] = [];
  const images: { prompt: string; format: string }[] = [];
  let visible = text.replace(/<memoria>([\s\S]*?)<\/memoria>/gi, (_, fact: string) => {
    if (fact.trim()) memories.push(fact.trim());
    return "";
  });
  visible = visible.replace(/<imagen(?:\s+formato="([^"]*)")?\s*>([\s\S]*?)<\/imagen>/gi, (_, format: string | undefined, prompt: string) => {
    if (prompt.trim()) images.push({ prompt: prompt.trim(), format: format || "1:1" });
    return "";
  });
  // Mientras llega el stream, esconde una etiqueta que todavía no se cerró.
  visible = visible.replace(/<(memoria|imagen)[^]*$/i, "");
  return { visible: visible.trim(), memories, images };
}

// ─── Detección: "esto es un pedido de construir una app/web" ────────────────
// El creador de apps ya no es un producto aparte — vive dentro de Basalt.
// Si el mensaje pide claramente construir algo (verbo + sustantivo de app/web),
// Basalt lo manda al motor de construcción (StudioChat en /chat) en vez de
// responder por texto. Todo lo demás (marketing, piezas, agentes, charla)
// se queda conversando aquí.
const BUILD_VERBS = /\b(crea|cr[eé]ame|constru(?:ye|ime)|constr[uú]yeme|hazme|dise[ñn]a(?:me)?|desarrolla(?:me)?|monta(?:me)?|arma(?:me)?|genera(?:me)?)\b/i;
const BUILD_NOUNS = /\b(app|aplicaci[oó]n|p[aá]gina(?:\s*web)?|sitio(?:\s*web)?|landing(?:\s*page)?|tienda(?:\s*online)?|e-?commerce|dashboard|formulario|blog|portafolio|portfolio|webapp|web\s*app|crm|saas)\b/i;

export function isAppBuildRequest(text: string): boolean {
  return BUILD_VERBS.test(text) && BUILD_NOUNS.test(text);
}

export function buildSystemPrompt(memory: string[]) {
  if (!memory.length) return SYSTEM_PROMPT;
  return `${SYSTEM_PROMPT}\n\nLO QUE RECUERDAS DEL USUARIO:\n${memory.map((m) => `- ${m}`).join("\n")}`;
}
