// Basalt conversacional — asistente tipo Gemini en /a/basalt. Único punto de
// entrada del producto: pedidos de construir apps/páginas/dashboards se
// responden con código EN EL MISMO CHAT (ver sección 5 del SYSTEM_PROMPT),
// sin redirigir a ningún motor/IDE aparte — pedido directo del usuario,
// 2026-09-29: "no quiero que esté embebido, quítalo, vamos a usar solo
// Basalt" (revirtiendo un intento anterior de embeber Chat.tsx acá mismo).
//
// Vive en el cliente (no en la tabla `assistant`) para no depender de un seed
// en la base: la persona, las tarjetas de bienvenida y la memoria se definen
// aquí. El historial y la memoria se guardan en la base de datos (ver
// /api/basalt/*), no en localStorage.
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

5. CONSTRUIR APPS, PÁGINAS WEB Y DASHBOARDS
Cuando te pidan construir una app, página web, landing, dashboard o similar, hazlo tú mismo en el chat: entrega el código completo y listo para copiar en uno o varios bloques de código markdown (\`\`\`tsx, \`\`\`html, etc.), con nombre de archivo en un comentario en la primera línea si son varios. Prioriza React + Tailwind si no te dicen lo contrario; para algo simple, un solo archivo HTML autocontenido también sirve. No hay una herramienta aparte para esto — todo pasa por acá, igual que el resto de lo que haces.

6. EL PROGRAMA QUE DICTA EL USUARIO
El usuario dicta un programa de IA para ejecutivos y profesionales de negocio, con este cronograma:
- Viernes 16 de octubre (6:00–10:00 p. m., 4 h): Módulo 1 · Trabajar con IA como profesional de negocios.
- Sábado 17 de octubre (8:00 a. m.–2:00 p. m., 6 h): Módulo 2 · IA para investigar, analizar y construir estrategia (5 h) + apertura del Módulo 3 (1 h).
- Lunes 19 de octubre (6:00–10:00 p. m., 4 h): Módulo 3 · IA para datos, evaluación y toma de decisiones.
- Miércoles 21 de octubre (6:00–10:00 p. m., 4 h): Módulo 4 · IA para la decisión ejecutiva, cierre del agente y Boardroom Challenge.
Cuando el usuario te pida ayuda relacionada con "el programa", "el curso" o "el taller" (piezas gráficas, publicaciones, invitaciones, recordatorios, agenda, parrilla de contenido, correos a inscritos, etc.), usa este cronograma como referencia exacta — no inventes otros módulos, fechas ni horarios.

ESTILO
- Eres Basalt, de Creator IA. Nunca digas que te creó Google, OpenAI, Anthropic u otra empresa, ni menciones el nombre del modelo que te da vida — eres Basalt, punto.
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

// Antes esto era localStorage puro (basalt:convs:<userId> / basalt:memory:
// <userId>) — sin backup ni sync entre dispositivos, un usuario perdía todo
// al limpiar el navegador o cambiar de dispositivo (caso real: "hice un
// estudio de mercado y nunca encontré dónde quedó", 2026-09-29). Ahora pega
// contra /api/basalt/*, ver db/schema/basalt.ts. El userId ya no se usa para
// armar ninguna key — el servidor identifica al usuario por su sesión — pero
// se mantiene como parámetro para no tocar cada call site, y como guarda
// rápida para no disparar el fetch antes de tener sesión.
async function apiJson<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; data?: T }> {
  try {
    const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...init });
    if (!res.ok) return { ok: false };
    const json = await res.json();
    return json.ok ? { ok: true, data: json } : { ok: false };
  } catch {
    return { ok: false };
  }
}

// Migración de una sola vez: sube lo que haya en el localStorage viejo
// (basalt:convs:<userId> / basalt:memory:<userId>, de antes de esta
// migración a base de datos) al servidor, para no dejar a usuarios que ya
// tenían historial viendo la lista vacía de golpe. No borra el localStorage
// viejo (queda inerte, de respaldo) — solo marca que ya se intentó, para no
// repetirlo en cada carga.
export async function migrateLegacyLocalStorage(userId: string): Promise<void> {
  if (!userId) return;
  const flagKey = `basalt:migrated:${userId}`;
  try {
    if (localStorage.getItem(flagKey)) return;
    const rawConvs = localStorage.getItem(`basalt:convs:${userId}`);
    const rawMemory = localStorage.getItem(`basalt:memory:${userId}`);
    localStorage.setItem(flagKey, "1");
    if (rawConvs) {
      const convs = JSON.parse(rawConvs) as StoredConversation[];
      for (const conv of convs) await saveConversation(userId, conv);
    }
    if (rawMemory) {
      const facts = JSON.parse(rawMemory) as string[];
      if (facts.length) await saveMemory(userId, facts);
    }
  } catch {
    /* localStorage bloqueado o datos corruptos — no hay nada que migrar */
  }
}

export async function loadConversations(userId: string): Promise<StoredConversation[]> {
  if (!userId) return [];
  const res = await apiJson<{ conversations: StoredConversation[] }>("/api/basalt/conversations");
  return res.ok ? res.data!.conversations : [];
}

export async function saveConversation(userId: string, conv: StoredConversation) {
  if (!userId) return;
  // Las imágenes generadas llegan como data: URI pesadas — no se guardan en
  // el historial para no reventar el tamaño de la fila.
  const slim: StoredConversation = {
    ...conv,
    messages: conv.messages.map((m) => ({
      ...m,
      images: m.images?.map((img) => ({ ...img, url: img.url?.startsWith("data:") ? undefined : img.url })),
    })),
  };
  await apiJson("/api/basalt/conversations", { method: "POST", body: JSON.stringify(slim) });
}

export async function deleteConversation(userId: string, id: string) {
  if (!userId) return;
  await apiJson(`/api/basalt/conversations/${id}`, { method: "DELETE" });
}

export async function loadMemory(userId: string): Promise<string[]> {
  if (!userId) return [];
  const res = await apiJson<{ facts: string[] }>("/api/basalt/memory");
  return res.ok ? res.data!.facts : [];
}

export async function saveMemory(userId: string, facts: string[]) {
  if (!userId) return;
  await apiJson("/api/basalt/memory", { method: "PUT", body: JSON.stringify({ facts: facts.slice(-60) }) });
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

export function buildSystemPrompt(memory: string[]) {
  if (!memory.length) return SYSTEM_PROMPT;
  return `${SYSTEM_PROMPT}\n\nLO QUE RECUERDAS DEL USUARIO:\n${memory.map((m) => `- ${m}`).join("\n")}`;
}
