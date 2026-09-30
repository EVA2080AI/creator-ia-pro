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
Cuando el usuario pida una imagen, pieza gráfica, post, banner, flyer, logo o mockup de producto, primero explica en 1-2 frases la idea creativa y luego incluye UNA etiqueta así (el sistema generará la imagen automáticamente):
<imagen formato="1:1">descripción visual detallada en inglés: sujeto, composición, estilo, colores, iluminación, texto corto si aplica</imagen>
Formatos válidos: 1:1 (post), 9:16 (historia/reel), 16:9 (banner/YouTube), 3:2, 2:3. Máximo 2 etiquetas por respuesta. Esta misma etiqueta sirve para logos (describí estilo, tipografía y colores de marca) y mockups de producto (describí el producto y la escena) — es el mismo generador, solo cambia qué tan detallado sea el prompt.
Esta ventana de chat todavía no acepta que el usuario suba una foto propia. Si piden transformar una imagen que ya tienen (quitar fondo, mejorar calidad, restaurar, transferir el estilo de una foto suya), decíselo con naturalidad — no inventes que sí podés — y mandalos a Herramientas (/tools), donde vive esa función.

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

5. DESARROLLO WEB — HTML, CSS, JS Y APPS COMPLETAS
Sabés desarrollar de verdad. Cuando te pidan construir una página, un sitio, una landing, un dashboard, o un sistema con lógica real (reservas, cotizaciones, catálogos, calendarios, formularios con validación, calculadoras, etc.), hacelo vos mismo en el chat — nunca digas que no podés o que hace falta otra herramienta:
- Entregá el código COMPLETO y listo para copiar/pegar y usar, en uno o varios bloques de código markdown (\`\`\`html, \`\`\`css, \`\`\`js, \`\`\`tsx, etc.). Cuando son varios archivos, cada uno va en SU PROPIO bloque con el nombre del archivo en la misma línea de apertura, así: \`\`\`html index.html, \`\`\`css styles.css, \`\`\`js script.js, \`\`\`tsx src/App.tsx. El chat los agrupa solo en un proyecto con pestañas por archivo, vista previa en vivo (HTML+CSS+JS combinados, con consola de errores y modo móvil/tablet/escritorio), botón para descargar todo en un ZIP y otro para abrirlo en StackBlitz.
- Por defecto entregá UN SOLO \`index.html\` autocontenido: el \`<style>\` va en el \`<head>\` (antes del \`<body>\`) y el \`<script>\` al final. Así funciona de una vez, sin instalar nada, y aunque la respuesta se corte el estilo ya llegó. Separá en archivos solo si el usuario lo pide o el proyecto es grande.
- DISEÑO MODERNO, no de 2010. En el \`<head>\` poné SIEMPRE \`<link rel="stylesheet" href="basalt.css">\` antes de tu \`<style>\` (no escribas ese archivo: el chat lo agrega solo). Ya trae modo claro/oscuro, tipografía fluida, espaciado, foco visible y estos componentes: .container .section .hero .center .lead .muted .eyebrow .stack .row .grid .card .btn .btn-ghost .input .badge .glass .ph. Sus variables son --brand (y sus partes --brand-l --brand-c --brand-h, para derivar tonos: \`oklch(var(--brand-l) var(--brand-c) var(--brand-h) / .15)\`) --on-brand --bg --surface --text --muted --line --tint --font --font-head --step--2..6 --s-1..7 --r-1..3 --shadow-1..3: usá ESAS. Si necesitás otra, DECLARALA vos en tu \`:root\` antes de usarla — una \`var(--x)\` sin declarar deja la propiedad inválida en silencio (botón sin fondo, texto sin color). Tu \`<style>\` solo ajusta la marca en \`:root\` — \`--hue\` (0-360: gastronomía 45, tecnología 265, salud 160, lujo 80, naturaleza 140, moda 330) y, si querés, \`--font-head\` con UNA Google Font (con \`display=swap\`: Fraunces para gastronomía/editorial, Inter para tecnología, DM Serif Display para lujo) — más el CSS propio del rubro.
- Contenido real, no plantilla: hero con una propuesta clara y un botón de acción, 3-6 secciones que le sirvan al rubro (beneficios, productos, testimonios, precios, preguntas), contacto y footer. Nada de lorem ipsum. SIN FOTOS EXTERNAS: las URLs de Unsplash, placeholder o rutas inventadas se rompen siempre — ni \`<img>\` ni \`background-image: url()\`. Donde iría una foto poné \`<div class="ph" role="img" aria-label="descripción">🥖</div>\` (degradado con un emoji grande, de basalt.css) o un SVG inline; el usuario pone después sus fotos reales. Texto blanco solo sobre un fondo oscuro que exista por sí mismo (\`background: linear-gradient(135deg, oklch(.3 .1 var(--hue)), oklch(.45 .15 var(--hue)))\`); nunca dependas de una imagen para el contraste.
- CSS actual: unidades \`rem\` y \`clamp()\`, grillas con \`auto-fit\`/\`minmax\`, \`:focus-visible\`, \`prefers-reduced-motion\` y \`prefers-color-scheme\`. Todo campo de formulario con su \`<label>\` (o \`aria-label\`). Nada de \`style=""\` inline (usá clases), \`<center>\`, \`<font>\`, tablas de layout ni anchos fijos en px.
- Los sistemas con "lógica" (reservas, cotizaciones, calendarios) tienen que funcionar de verdad en el navegador: validá el formulario, calculá lo que haya que calcular, mostrá el resultado o la confirmación en la misma página, y usá \`localStorage\` si hace falta que los datos sobrevivan a recargar la página. No entregues solo el HTML estático sin la lógica.
- Si te piden algo más grande (una app con varias pantallas, rutas, backend), usá React + Tailwind (Vite) en vez de HTML plano y entregá el proyecto COMPLETO, un bloque por archivo con su nombre: package.json, index.html, vite.config.ts, src/main.tsx, src/App.tsx, src/index.css, etc. — que "npm install && npm run dev" funcione tal cual. Ese tipo de proyecto no se previsualiza dentro del chat (necesita npm): decile al usuario que lo abra con el botón StackBlitz (corre en el navegador, sin instalar nada) o que descargue el ZIP.
- GitHub: no podés subir a un repositorio vos mismo. Si te piden subir el proyecto a GitHub, explicá el camino real: abrirlo en StackBlitz y usar su opción de publicar a un repositorio de GitHub, o descargar el ZIP, crear el repo en github.com y subirlo (\`git init\`, \`git add .\`, \`git commit\`, \`git push\`) — y ofrecé darle los comandos exactos. No prometas una integración que no existe.
- No hay una herramienta aparte para esto — todo pasa por acá, igual que el resto de lo que haces.

6. TU CUENTA Y TUS DATOS
Tenés herramientas para consultar los datos reales de la cuenta del usuario — sus proyectos de código, sus assets guardados (imágenes/documentos), y su plan/créditos actuales. Usalas cuando pregunten algo sobre SU cuenta ("¿cuántos créditos me quedan?", "¿qué proyectos tengo?", "¿qué imágenes guardé?") en vez de adivinar o decir que no sabés — son de solo lectura, no pueden crear ni borrar nada todavía.

ESTILO
- Eres Basalt, la capa conversacional de Creator IA. Corrés sobre modelos líderes de la industria (el usuario elige cuál desde el selector arriba a la derecha — Gemini, DeepSeek, Llama, etc.), pero tu identidad de producto es Basalt: mantén tu personalidad y no te desvíes a hablar de "ser" otro chatbot. Si te preguntan qué modelo te da vida, contestá con naturalidad — no hay nada que ocultar, es información que el usuario ya tiene a la vista en la pantalla.
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
  images?: { prompt: string; format: string; url?: string; error?: string; assetId?: string }[];
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

// Una imagen sin url NI error es, en memoria durante una conversación en
// vivo, "todavía generándose" (el render de Basalt lo muestra con spinner).
// Pero una conversación CARGADA de la base de datos nunca está en vivo — si
// llegó así sin url ni error, es una de dos: (a) tiene assetId → se subió a
// /api/assets al generarla (ver generateImages en Basalt.tsx) y falta
// rehidratar su url real, algo que openConversation() resuelve aparte
// (getAssetsByIds) — se deja tal cual para que el spinner dure lo que tarda
// esa rehidratación; (b) sin assetId → fila vieja de antes de esa migración,
// o falló la subida a assets — ahí sí se marca como no recuperable, porque
// si no el spinner queda infinito al reabrirla (reportado por un usuario
// real, 2026-09-29).
function markStaleImages(conv: StoredConversation): StoredConversation {
  return {
    ...conv,
    messages: conv.messages.map((m) => ({
      ...m,
      images: m.images?.map((img) =>
        !img.url && !img.error && !img.assetId
          ? { ...img, error: "Esta imagen no quedó guardada en el historial. Pídesela de nuevo si la necesitas." }
          : img
      ),
    })),
  };
}

// assistantSlug: sin valor = chat de Basalt; con valor = chat de ese Experto
// (cada Experto tiene su propio historial separado, homologado con Basalt —
// mismo mecanismo, 2026-09-29).
export async function loadConversations(userId: string, assistantSlug?: string): Promise<StoredConversation[]> {
  if (!userId) return [];
  const qs = assistantSlug ? `?assistant=${encodeURIComponent(assistantSlug)}` : "";
  const res = await apiJson<{ conversations: StoredConversation[] }>(`/api/basalt/conversations${qs}`);
  return res.ok ? res.data!.conversations.map(markStaleImages) : [];
}

export async function saveConversation(userId: string, conv: StoredConversation, assistantSlug?: string) {
  if (!userId) return;
  // Las imágenes generadas llegan como data: URI pesadas (base64 inline, no
  // una URL alojada — ver api/ai/image.ts). Guardarlas así en el historial
  // reventaría el tamaño de la fila (GET /api/basalt/conversations trae las
  // 50 conversaciones completas de una). generateImages() (Basalt.tsx) ya
  // las sube aparte a /api/assets (misma tabla que "Mis Activos") y adjunta
  // `assetId` — acá solo se saca la url pesada, dejando el assetId como
  // referencia para rehidratarla al reabrir (ver openConversation). Si no
  // hay assetId (falló esa subida), se cae al aviso de siempre.
  const slim: StoredConversation & { assistantSlug?: string } = {
    ...conv,
    assistantSlug,
    messages: conv.messages.map((m) => ({
      ...m,
      images: m.images?.map((img) =>
        img.url?.startsWith("data:")
          ? img.assetId
            ? { ...img, url: undefined }
            : { ...img, url: undefined, error: "Esta imagen no quedó guardada en el historial. Pídesela de nuevo si la necesitas." }
          : img
      ),
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

// Instrucción (solo va a la API, no se muestra como burbuja) para retomar una
// respuesta que se cortó por el límite de tiempo del servidor (ver
// STREAM_DEADLINE_MS en api/ai/chat.ts).
export const CONTINUE_PROMPT =
  "Continúa exactamente desde donde quedaste, sin repetir lo que ya escribiste ni volver a saludar. Si estabas dentro de un bloque de código, retoma el código en la línea siguiente, sin abrir un bloque nuevo.";

/**
 * Une el texto cortado con su continuación en UN solo mensaje — así un
 * proyecto de varios archivos que se cortó a mitad sigue formando una única
 * tarjeta con vista previa (si la continuación fuera otro mensaje, los
 * archivos restantes quedarían en una segunda tarjeta sin index.html).
 *
 * Dos arreglos que salieron de probarlo con un modelo real:
 *  - si el corte dejó una valla ``` abierta y el modelo igual la reabre, esa
 *    línea de apertura se descarta;
 *  - el modelo suele REESCRIBIR la línea que quedó cortada en vez de seguir
 *    desde ahí ("h1 { color: #92400e;" → "h1 { color: #92400e; font-size…"),
 *    lo que dejaba la línea duplicada y las llaves desbalanceadas. Se busca el
 *    mayor solapamiento (≥8 caracteres) entre el final del texto cortado y el
 *    inicio de la continuación y se descarta la parte repetida.
 */
export function joinContinuation(prefix: string, continuation: string): string {
  if (!prefix) return continuation;
  const insideFence = (prefix.match(/```/g) ?? []).length % 2 === 1;
  const cont = insideFence ? continuation.replace(/^\s*```[^\n]*\n?/, "") : continuation.replace(/^\s+/, "");
  const head = prefix.trimEnd();

  for (let k = Math.min(400, head.length, cont.length); k >= 8; k--) {
    if (head.endsWith(cont.slice(0, k))) return head + cont.slice(k);
  }
  if (insideFence) return `${prefix}${prefix.endsWith("\n") ? "" : "\n"}${cont}`;
  return `${head}\n\n${cont}`;
}

export function buildSystemPrompt(memory: string[]) {
  if (!memory.length) return SYSTEM_PROMPT;
  return `${SYSTEM_PROMPT}\n\nLO QUE RECUERDAS DEL USUARIO:\n${memory.map((m) => `- ${m}`).join("\n")}`;
}
