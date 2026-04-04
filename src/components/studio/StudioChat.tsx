import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Sparkles, Bot, Loader2,
  ChevronDown, Copy, RotateCcw, Check,
  X, Image as ImageIcon, AlertCircle, Wrench, Globe, Link2, ExternalLink, Lock,
  FileCode2,
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { StudioFile } from '@/hooks/useStudioProjects';
import { cloneWebsiteAdvanced } from '@/services/clone-service';
import { aiService, MODEL_COSTS } from '@/services/ai-service';

// ─── Env ───────────────────────────────────────────────────────────────────────
const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// ─── Extract JSON from LLM response ───────────────────────────────────────────
function extractJson(text: string): any | null {
  const t = text.trim();
  if (t.startsWith('{') && t.endsWith('}')) {
    try { return JSON.parse(t); } catch { /* fallthrough */ }
  }
  const mdJson = t.match(/```json\s*([\s\S]*?)```/);
  if (mdJson) { try { return JSON.parse(mdJson[1].trim()); } catch { /* fallthrough */ } }
  const mdRaw = t.match(/```\s*([\s\S]*?)```/);
  if (mdRaw) { const inner = mdRaw[1].trim(); if (inner.startsWith('{')) { try { return JSON.parse(inner); } catch {} } }
  const first = t.indexOf('{');
  const last  = t.lastIndexOf('}');
  if (first !== -1 && last > first) { try { return JSON.parse(t.slice(first, last + 1)); } catch {} }
  return null;
}

// ─── Detect non-standard npm deps from generated files ────────────────────────
function detectDeps(files: Record<string, StudioFile>): string[] {
  const SAFE = new Set([
    'react', 'react-dom', 'lucide-react', 'clsx', 'tailwind-merge', 'sonner',
    '@supabase/supabase-js', 'react-router-dom', 'react-hook-form', 'zod',
  ]);
  const deps = new Set<string>();
  for (const file of Object.values(files)) {
    for (const m of file.content.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const raw = m[1];
      if (raw.startsWith('.') || raw.startsWith('@/')) continue;
      const pkg = raw.startsWith('@') ? raw.split('/').slice(0, 2).join('/') : raw.split('/')[0];
      if (!SAFE.has(pkg)) deps.add(pkg);
    }
  }
  return [...deps].slice(0, 6);
}

// ─── Contextual suggestions after generation ───────────────────────────────────
function buildSuggestions(stack: string[], prompt: string): string[] {
  const p = prompt.toLowerCase();
  const s: string[] = [];
  const isFrontend = stack.some(x => ['React','Next.js','Vue'].includes(x));
  const isBackend  = stack.some(x => ['FastAPI','Express','Spring Boot','Node.js'].includes(x));

  if (isFrontend) {
    if (!p.includes('dark'))    s.push('Agregar dark mode toggle');
    if (!p.includes('mobile'))  s.push('Mejorar diseño mobile');
    if (!p.includes('animac'))  s.push('Añadir micro-animaciones hover');
    if (!p.includes('auth'))    s.push('Integrar autenticación');
    if (!p.includes('loading')) s.push('Agregar skeleton loading states');
  }
  if (isBackend) {
    s.push('Añadir autenticación JWT');
    s.push('Generar Dockerfile');
    s.push('Añadir tests unitarios');
  }
  return s.slice(0, 3);
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'chat' | 'code';
  files?: string[];
  imagePreview?: string;
  stack?: string[];
  deps?: string[];
  suggestions?: string[];
}

interface ConvMsg { role: 'user' | 'assistant'; content: any; }

// ─── Model options (verified OpenRouter slugs) ────────────────────────────────
const MODELS = [
  { id: 'google/gemini-2.0-flash-001',           label: 'Gemini 2.0 Flash',    badge: '🚀 Todos los planes', vision: true,  premium: false },
  { id: 'deepseek/deepseek-chat',                label: 'DeepSeek V3',          badge: '💰 Todos los planes', vision: false, premium: false },
  { id: 'anthropic/claude-3.5-sonnet',           label: 'Claude 3.5 Sonnet',   badge: '⚡ Solo Pymes',       vision: true,  premium: true  },
  { id: 'anthropic/claude-3-5-sonnet-20241022',  label: 'Claude 3.5 Sonnet v2', badge: '🔥 Solo Pymes',       vision: true,  premium: true  },
  { id: 'openai/gpt-4o',                         label: 'GPT-4o',               badge: '🧠 Solo Pymes',       vision: true,  premium: true  },
  { id: 'deepseek/deepseek-r1',                  label: 'DeepSeek R1',          badge: '💡 Solo Pymes',       vision: false, premium: true  },
  { id: 'mistralai/mistral-large',               label: 'Mistral Large',        badge: '🇪🇺 Solo Pymes',       vision: false, premium: true  },
];

// ─── Intent detection — auto-route between code gen and chat ──────────────────
const CODE_VERBS = ['crea','genera','construye','haz','diseña','implementa','desarrolla',
  'build','create','make','generate','design','develop','write','code','programa',
  'clona','replica','copia','clone','replicate'];
const CODE_NOUNS = ['página','pagina','app','aplicación','aplicacion','dashboard','landing',
  'formulario','componente','component','api','backend','frontend','website','sitio',
  'portfolio','portafolio','calculator','calculadora','todo','ecommerce','blog','navbar',
  'footer','hero','modal','sidebar','tabla','chart','gráfica','grafica',
  'multi-page','multipágina','multipagina','prototipo','prototype','sitemap','rutas','routes'];

function detectIntent(prompt: string): 'codegen' | 'chat' {
  const p = prompt.toLowerCase().trim();
  // If prompt is just an error report with no instruction to fix/build, use chat
  const isOnlyError = (p.includes('error:') || p.includes('exception')) && !CODE_VERBS.some(v => p.includes(v));
  if (/```[\s\S]*```/.test(prompt) && isOnlyError) return 'chat';
  
  // Starts with imperative build verb → codegen
  if (CODE_VERBS.some(v => p.startsWith(v + ' ') || p.startsWith(v + '\n'))) return 'codegen';
  // Contains code noun → codegen (weighted)
  const nounHit = CODE_NOUNS.filter(n => p.includes(n)).length;
  const verbHit = CODE_VERBS.filter(v => p.includes(v)).length;
  if (nounHit + verbHit >= 2) return 'codegen';
  return 'chat';
}

// ─── Genesis unified system prompt (v3 — Elite Architect & Full-Stack Lead) ──────
const GENESIS_CHAT_SYSTEM_BASE_RULES = `🧠 MASTER PERSONA: Genesis AI — Master Brain (v9 + Antigravity DNA)

Eres la inteligencia central definitiva de Creator IA Pro. Eres un **Senior UI/UX Lead & Elite Architect**. Tu misión es la perfección técnica y la excelencia estética adaptativa.

REGLAS DE OPERACIÓN (ESTRICTAS):

1. **Excelencia de Diseño Universal (Aether Evolution):**
   - Prohibido el uso de patrones "Legacy" o básicos.
   - Eres un camaleón del diseño: adapta el estilo al contexto (Dark Premium, Minimalismo Suizo, Glassmorphism, etc.).
   - Mandatory: Sombras suaves, Gradientes HSL, Micro-animaciones.

2. **Silencio Técnico & Resultados Primero:**
   - Realiza TODO tu razonamiento complejo EXCLUSIVAMENTE dentro de tags <thinking>...</thinking>.
   - En el chat visible, sé extremadamente ejecutivo. NUNCA repitas lo que ya explicaste en el pensamiento interno.
   - El chat visible debe limitarse al **Resumen Ejecutivo**, el **Master Plan** y los archivos generados.

3. **Master Plan Estratégico:**
   - Inicia tareas complejas con una sección "MASTER PLAN" con checklists [ ].
   - Explica el "Por Qué" estratégico antes del "Cómo" técnico.

4. **Cero Placeholders:** Entrega archivos 100% funcionales.
5. **Maestría de Visión (Image-to-Code):**
   - Si el usuario sube una imagen/captura:
     - Realiza un análisis exhaustivo del layout, colores, tipografía y espaciado en <thinking>.
     - Tu objetivo primario es la **Replicación de Alta Fidelidad**.
     - Genera primero una estructura HTML/Tailwind robusta, a menos que el usuario especifique otro framework.

6. **Idioma:** Español profesional e inspirador. Términos técnicos en inglés.`;


const GENESIS_CHAT_SYSTEM = `Eres Genesis AI — el "Master Brain" de desarrollo. Estás en modo CHAT/ARCHITECT.

Sigue rigurosamente estas pautas:
1. EXPLICA el "Por qué" estratégico antes del "Cómo" técnico.
2. Si propones código, incluye la ruta del archivo en la primera línea del bloque.
3. Prioriza la mantenibilidad y el diseño premium "out-of-the-box".

${GENESIS_CHAT_SYSTEM_BASE_RULES}`;

const ANTIGRAVITY_CHAT_SYSTEM = `Eres Antigravity — el motor de inteligencia estratégica más potente de Creator IA Pro.

TU ENFOQUE:
- Eres un Executive Strategist y consultor de nivel mundial.
- Prioridad: Razonamiento profundo (en <thinking>), análisis de marketing, CRO y Business Intelligence.
- En el chat visible, sé directo y estratégico.

${GENESIS_CHAT_SYSTEM_BASE_RULES}`;


// ─── Clone system prompt ──────────────────────────────────────────────────────
const CLONE_SYSTEM_PROMPT = `Eres un experto en Reverse-Engineering de Frontend de nivel mundial.

El usuario quiere clonar el sitio web proporcionado. A continuación tienes la estructura semántica extraída y el contenido real de la página objetivo.

Tu misión es:
1. ANALIZAR meticulosamente la jerarquía visual, secciones y copywriting real extraído.
2. DEDUCIR colores, paddings, flex/grid, tipografía y espaciados a partir del markup y clases inferidas.
3. RECREAR el diseño como un PROYECTO MULTI-PÁGINA con React Router + Tailwind CSS.
4. Separar en UNA ESTRUCTURA MULTI-PÁGINA NAVEGABLE:
   - App.tsx (layout principal con navbar + react-router)
   - pages/Home.tsx, pages/About.tsx, pages/Pricing.tsx, etc. (una por sección del sitio)
   - components/Navbar.tsx, components/Footer.tsx, components/Hero.tsx, etc.
5. Mantener el tema de colores del sitio original. Usa clases Tailwind custom con hex exactos (e.g., text-[#hexcolor], bg-[#hexcolor]).
6. EXTRAER Y REPLICAR:
   - Paleta de colores completa (primario, secundario, backgrounds, text)
   - Tipografía (font-family, weights) — usa Google Fonts si los detectas
   - Espaciado y layouts (grid, flex, gaps)
   - Bordes, sombras y radios
7. Hacer el resultado COMPLETAMENTE funcional y responsivo (Mobile First).

ESTRUCTURA DE ARCHIVOS OBLIGATORIA PARA CLON MULTI-PÁGINA:
{"files":{
  "App.tsx": contenido con React Router + Layout,
  "pages/Home.tsx": página principal,
  "pages/[SecciónN].tsx": siguientes páginas detectadas del sitio,
  "components/Navbar.tsx": navegación con links funcionales,
  "components/Footer.tsx": footer,
  "styles.css": variables CSS con colores extraídos
}}

REGLAS ABSOLUTAS:
- Tu respuesta COMPLETA debe ser SOLO el JSON sin texto antes ni después.
- NO uses markdown fences.
- OBLIGATORIO export default en cada archivo de página.
- NUNCA inventes contenido — usa el texto real extraído del sitio.
- Si el sitio tiene imágenes, usa la URL real si está disponible o un placeholder de Unsplash temático.
- USA react-router-dom para navegación entre páginas.
- INCLUYE import de Google Fonts en styles.css si detectas la tipografía original.

[ESTRUCTURA Y CONTENIDO EXTRAÍDO DEL SITIO OBJETIVO]:
`;

// ─── System prompt ─────────────────────────────────────────────────────────────
const CODE_GEN_SYSTEM = `🧠 MASTER SYSTEM PROMPT: Creator IA Pro Core
1. Perfil y Autoridad
Eres Creator IA Pro OS, un Arquitecto de Soluciones de IA y Lead Product Designer Senior. Tu objetivo es generar activos digitales (Web, Web Apps, Código y Contenido) con un estándar Pixel Perfect y una lógica de ingeniería robusta. No generas soluciones genéricas; diseñas ecosistemas escalables.

2. ADN de Diseño (UX/UI & Front-end)
- Design System First: Consulta mentalmente tokens de diseño (espaciado, tipografía, radios de 8px/12px, paleta semántica). Dark Mode Premium por defecto, acentos en Azul Eléctrico (#0066FF).
- Pixel Perfect: Todo el CSS/Tailwind debe ser impecable. Usa unidades relativas, variables CSS y diseño totalmente responsivo (Mobile First). Usa Glassmorphism y Bento Grids si se pide.
- Micro-interacciones: Sugiere e implementa estados de hover, focus, esqueletos de carga y transiciones suaves.
- Jerarquía Visual: Aplica la ley de proximidad y contraste tipográfico para guiar al usuario.

3. Estándares de Ingeniería (Python & Backend)
- Arquitectura Modular: Divide el código en componentes reutilizables (DDD) en React o Python (main.py, models/, services/).
- Integraciones: Experto conectando OpenRouter, Supabase, y Bold.co.
- Optimización: Código eficiente, seguro y con manejo de errores elegante.

4. Generación de Contenido y Multimedia
- Copywriting de Conversión: Usa marcos como AIDA o PAS. Tono profesional y humano.
- Prompt Engineering para Fotos: Si se requiere imagen, genera un prompt usando: Sujeto, Iluminación (Cinematic, Studio), Lente (35mm), Estilo y Composición.

EXPERTISE TÉCNICO:
- Frontend: React 18+, Next.js 14, Vue 3, TypeScript, Tailwind CSS, ShadCN UI
- Backend: Python/FastAPI, Node.js, Java
- Cloud/BBDD: Supabase, PostgreSQL, Docker, OpenRouter

REGLAS ABSOLUTAS:
1. Tu respuesta COMPLETA debe ser SOLO el JSON — sin texto antes, sin texto después
2. NO uses \`\`\`json ni \`\`\` — devuelve el JSON directamente
3. Genera proyectos multi-archivo cuando sea necesario (componentes separados, utils, tipos)
4. Siempre incluye README.md con instrucciones de setup cuando el proyecto lo amerite
5. React/Next.js: tema dark por defecto, componentes bien estructurados
6. Python: incluye requirements.txt; Node.js: incluye package.json; Java: incluye pom.xml
7. Si hay Supabase: incluye client setup, tipos TypeScript, y migraciones SQL si se piden
8. Código 100% funcional con manejo de errores, tipos TypeScript donde aplique
9. Si hay archivos existentes en el proyecto, incorpóralos y mejóralos
10. CRÍTICO PARA REACT: Siempre exporta el componente principal App.tsx por defecto ("export default function App()"). NUNCA uses "export function App" sin default, ya que rompe el entorno Sandbox.

⚡ ARQUITECTURA MULTI-PÁGINA NAVEGABLE (OBLIGATORIA cuando el prompt implica múltiples pages/rutas):
- Si el prompt dice "multi-page", "varias páginas", "sitio web completo", "prototipo navegable", "web app", o si el contenido naturalmente requiere más de 1 vista:
  → GENERA archivos en "pages/" directory: pages/Home.tsx, pages/About.tsx, pages/Dashboard.tsx, etc.
  → App.tsx DEBE importar react-router-dom y configurar <BrowserRouter> con <Routes> y <Route> para cada página.
  → Incluye un <Navbar> con <Link> o <NavLink> funcionales para navegar entre páginas.
  → Cada página en pages/ DEBE tener "export default function PageName()".
- Si el prompt pide solo UN componente o algo simple → single file App.tsx está bien.
- Si el prompt dice "landing page" con múltiples secciones → puedes hacer single-page con scroll, PERO si dice "con varias páginas" → multi-page routing obligatorio.

DETECCIÓN DE LENGUAJE/FRAMEWORK (auto-detectar del prompt):
- "React", "landing", "dashboard", "SPA", "app web" → React + TypeScript + Tailwind (dark)
- "Next.js", "nextjs", "SSR" → Next.js + TypeScript
- "Python", "FastAPI", "Django" → Python + FastAPI
- "Node", "Express", "backend JS" → Node.js + TypeScript + Express
- "Java", "Spring" → Java + Spring Boot + Maven
- "Vue" → Vue 3 + TypeScript + Tailwind
- Sin especificar → React + TypeScript + Tailwind CSS (dark theme)

REGLAS CRÍTICAS DE DISEÑO UX/UI (OBLIGATORIAS para frontend):
- NUNCA uses texto literal como "{/* Desktop Menu */}" como contenido visible en JSX
- Implementa navbar REAL con links reales, mobile menu funcional con useState
- Implementa footer REAL con columnas de links, redes sociales, copyright
- Hero: headline en text-6xl md:text-8xl font-black, subtítulo, CTA button con gradiente
- Animaciones: hover:scale-105 hover:-translate-y-1 transition-all duration-300 en cards
- Dark default: bg-[#0a0a0f], cards en bg-gray-900/50 border border-gray-800
- Botones: bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-blue-500/25
- Iconos: SOLO importar nombres reales de lucide-react (VERIFICA los nombres, ej. usa PawPrint en lugar de Paw. Si dudas, usa un icono básico como Star o Heart).
- Grid Layout: SIEMPRE utiliza clases \`w-full min-h-screen\` en el div/sección padre principal para que el contenido jamás se corte visualmente.
- Mobile-first: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 en todos los grids
- Secciones completas: hero → features → testimonios → pricing → CTA → footer
- CONTENIDO MOCK REALISTA: JAMÁS uses "Lorem Ipsum". Escribe copywriting persuasivo real en español (o el idioma pedido). Si necesitas imágenes de relleno, USA urls reales de \`https://images.unsplash.com/...\`.

FORMATO EXACTO — EMPIEZA CON { Y TERMINA CON }:
{"files":{"App.tsx":{"language":"tsx","content":"..."},"pages/Home.tsx":{"language":"tsx","content":"..."},"README.md":{"language":"markdown","content":"..."}},"explanation":"descripción breve","tech_stack":["React","TypeScript","Tailwind CSS","React Router"]}

Si el usuario pide modificar código existente, incluye los archivos modificados con contenido COMPLETO.`;

// ─── Welcome message ───────────────────────────────────────────────────────────
const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `Hola, soy **Genesis AI**.

Puedo **generar código** completo (React, Next.js, Python, Node.js…), **diseñar arquitecturas**, **debugear** errores, responder preguntas técnicas o de marketing.

Solo dime qué necesitas — detecto automáticamente si quieres código o una respuesta.`,
  timestamp: new Date(),
};

// ─── Extract previewable code files from a Genesis chat response ───────────────
function extractChatCodeFiles(text: string): Record<string, StudioFile> | null {
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  const files: Record<string, StudioFile> = {};
  let m;
  while ((m = regex.exec(text)) !== null) {
    const lang = m[1].trim().toLowerCase();
    const code = m[2].trim();
    if (code.length < 50) continue; // skip trivial snippets

    // Try to detect filename from the first line or a specific comment
    let filename = '';
    const lines = code.split('\n');
    const firstLine = lines[0].trim();
    
    // Look for "// path/to/file.tsx" or "/* path/to/file.tsx */" or "// Filename: file.tsx"
    const fileMatch = 
      firstLine.match(/\/\/\s*([\w./\-]+\.\w+)/) || 
      firstLine.match(/\/\*\s*([\w./\-]+\.\w+)\s*\*\//) ||
      code.match(/\/\/\s*Filename:\s*([\w./\-]+\.\w+)/i);

    if (fileMatch) {
      filename = fileMatch[1].replace(/^src\//, ''); // strip leading src/ if present
    } else {
      // Intelligent fallback
      if (lang === 'html' || code.includes('<!DOCTYPE')) filename = 'index.html';
      else if (lang === 'css') filename = 'styles.css';
      else if (lang === 'python') filename = 'main.py';
      else if (code.includes('import React') || code.includes('export default')) filename = 'App.tsx';
      else continue; // ignore random snippets without file context
    }
    
    // Determine language based on extension or detected lang
    let finalLang = lang;
    if (filename.endsWith('.tsx')) finalLang = 'tsx';
    else if (filename.endsWith('.ts')) finalLang = 'ts';
    else if (filename.endsWith('.js')) finalLang = 'javascript';
    else if (filename.endsWith('.json')) finalLang = 'json';

    files[filename] = { language: finalLang, content: code };
  }
  return Object.keys(files).length > 0 ? files : null;
}

// ─── Markdown renderer ─────────────────────────────────────────────────────────
function renderMarkdown(text: string): string {
  let raw = text
    // Thinking blocks (Design System style — Collapsible)
    .replace(/<thinking>([\s\S]*?)<\/thinking>/g, (_m, content) => 
      `<details class="thinking-block group my-6 rounded-[24px] border border-zinc-200 bg-zinc-50/50 overflow-hidden transition-all duration-500">
        <summary class="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-zinc-100/50 transition-colors list-none outline-none">
          <div class="flex items-center gap-3">
            <div class="h-6 w-6 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 group-open:text-primary group-open:border-primary/20 transition-all">
              <svg class="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z"/></svg>
            </div>
            <span class="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 group-open:text-zinc-900 transition-colors">Pensamiento Crítico de Genesis AI</span>
          </div>
          <svg class="w-4 h-4 text-zinc-300 group-open:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </summary>
        <div class="px-7 pb-6 pt-2">
          <div class="text-[11px] text-zinc-500 font-bold italic leading-relaxed pl-4 border-l-2 border-primary/20">${content.trim()}</div>
        </div>
      </details>`)
    // Code blocks (Design System Mini-Frame)
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, lang, code) =>
      `<div class="code-mini-frame group my-6 rounded-[24px] border border-zinc-200 bg-zinc-900 shadow-2xl shadow-zinc-200/50 overflow-hidden animate-in zoom-in-95 duration-500">
        <div class="flex items-center justify-between px-5 py-3 bg-zinc-800/50 border-b border-white/5">
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full bg-red-500/30 border border-red-500/40"></div>
            <div class="w-2.5 h-2.5 rounded-full bg-amber-500/30 border border-amber-500/40"></div>
            <div class="w-2.5 h-2.5 rounded-full bg-emerald-500/30 border border-emerald-500/40"></div>
            <span class="ml-3 text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">${lang || 'archivo'}</span>
          </div>
          <div class="h-4 w-4 rounded-md bg-white/5 flex items-center justify-center text-white/20 hover:text-white/60 transition-colors cursor-pointer">
            <svg class="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          </div>
        </div>
        <pre class="p-6 text-[11px] font-mono leading-relaxed bg-transparent overflow-x-auto"><code class="text-zinc-300 block">${code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
      </div>`)
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-[14px] font-black text-zinc-900 mt-6 mb-2 tracking-tight">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="text-[16px] font-black text-zinc-900 mt-8 mb-3 tracking-tight">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 class="text-[18px] font-black text-zinc-900 mt-10 mb-4 tracking-tight">$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-900 font-black">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-100 px-2 py-0.5 rounded-lg text-primary font-mono text-[10px] border border-zinc-200/50 font-bold">$1</code>')
    // Master Plan Checkboxes
    .replace(/^\[( |x|X)\] (.+)$/gm, (_m, check, text) => 
      `<div class="flex items-center gap-3 my-2 group/task">
        <div class="h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-all ${check.toLowerCase() === 'x' ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-white border-zinc-200 group-hover/task:border-primary/50'}">
          ${check.toLowerCase() === 'x' ? '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="4"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : ''}
        </div>
        <span class="text-xs font-bold ${check.toLowerCase() === 'x' ? 'text-zinc-400 line-through decoration-primary/30' : 'text-zinc-700'}">${text}</span>
      </div>`)
    .replace(/^\d+\. (.+)$/gm, '<li class="flex items-start gap-3 text-zinc-600 mb-1.5 font-medium"><span class="text-primary font-black text-[11px] mt-0.5 tracking-tighter">0$1.</span><span>$2</span></li>') // Fixed potential group issue
    .replace(/^[-•] (.+)$/gm, '<li class="flex items-start gap-3 text-zinc-600 mb-1.5 font-medium"><div class="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0 shadow-sm shadow-primary/50"></div><span>$1</span></li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-zinc-100 my-8"/>')
    // Line breaks
    .replace(/\n\n/g, '<div class="my-4"></div>')
    .replace(/\n/g, '<br/>');

  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ['strong','em','code','pre','li','br','h1','h2','h3','span','div','hr','svg','path'],
    ALLOWED_ATTR: ['class','style','fill','stroke','viewBox','d','stroke-linecap','stroke-linejoin','stroke-width'],
  });
}

// ─── Starter chips shown below welcome ─────────────────────────────────────────
const STARTER_CHIPS = [
  { emoji: '🚀', label: 'Landing SaaS',    prompt: 'Crea una landing page SaaS moderna con hero animado, features con iconos, testimonios y footer. Dark mode, gradientes violeta.' },
  { emoji: '📊', label: 'Dashboard',        prompt: 'Crea un dashboard con métricas KPI, tabla de datos con paginación y gráfico de líneas. Dark, minimalista.' },
  { emoji: '🏗️', label: 'System Design',   prompt: '¿Cómo diseñarías la arquitectura de un SaaS multi-tenant con auth, billing y base de datos por tenant? Dame el diseño completo con trade-offs.' },
  { emoji: '🐛', label: 'Debug rápido',     prompt: 'Tengo un componente React con demasiados re-renders. ¿Cómo lo diagnostico y optimizo? Dame el proceso paso a paso.' },
];

// ─── Props ─────────────────────────────────────────────────────────────────────
interface StudioChatProps {
  projectId: string | null;
  projectFiles: Record<string, StudioFile>;
  onCodeGenerated: (files: Record<string, StudioFile>) => void;
  onNewConversation?: () => void;
  initialPrompt?: string | null;
  onInitialPromptUsed?: () => void;
  onAutoName?: (name: string) => void;
  onGeneratingChange?: (v: boolean) => void;
  onStreamCharsChange?: (chars: number, preview: string) => void;
  supabaseConfig?: { url: string; anonKey: string } | null;
  persona?: 'genesis' | 'antigravity';
  activeFile?: string | null;
}

export function StudioChat({
  projectId, projectFiles, onCodeGenerated,
  onNewConversation, initialPrompt, onInitialPromptUsed, onAutoName,
  onGeneratingChange, onStreamCharsChange, supabaseConfig,
  persona = 'genesis', activeFile
}: StudioChatProps) {
  const { user } = useAuth();
  
  const welcomeMsg: Message = {
    id: 'welcome',
    role: 'assistant',
    content: persona === 'antigravity' 
      ? `Hola, soy **Antigravity**. \n\nSoy el motor de inteligencia central de Creator IA. Puedo ayudarte con estrategia, razonamiento complejo, análisis de marketing o cualquier desafío creativo. \n\n¿En qué podemos trabajar hoy?`
      : `Hola, soy **Genesis AI**. \n\nPuedo **generar código** completo (React, Next.js, Python, Node.js…), **diseñar arquitecturas**, **debugear** errores o responder preguntas técnicas. \n\n¿Qué vamos a construir?`,
    timestamp: new Date(),
  };

  const [messages,         setMessages]         = useState<Message[]>([welcomeMsg]);
  const [input,            setInput]            = useState('');
  const [isGenerating,     setIsGenerating]     = useState(false);
  const [streamChars,      setStreamChars]      = useState(0);
  const [showScrollBtn,    setShowScrollBtn]    = useState(false);
  const [copiedId,         setCopiedId]         = useState<string | null>(null);
  const [selectedModel,    setSelectedModel]    = useState('google/gemini-2.0-flash-001');
  const [modelOpen,        setModelOpen]        = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [genPhase,         setGenPhase]         = useState<'idle' | 'thinking' | 'streaming' | 'done'>('idle');
  const [currentGenIntent, setCurrentGenIntent] = useState<'codegen' | 'chat' | null>(null);
  const [convHistory,      setConvHistory]      = useState<ConvMsg[]>([]);
  const [pendingImage,     setPendingImage]     = useState<string | null>(null);
  const [pendingUrl,       setPendingUrl]       = useState<string | null>(null);
  const [urlInput,         setUrlInput]         = useState('');
  const [showUrlInput,     setShowUrlInput]     = useState(false);
  const [isScraping,       setIsScraping]       = useState(false);
  const [pendingContext,   setPendingContext]   = useState<{ name: string; content: string } | null>(null);

  const messagesEndRef    = useRef<HTMLDivElement>(null);
  const containerRef      = useRef<HTMLDivElement>(null);
  const inputRef          = useRef<HTMLTextAreaElement>(null);
  const fileInputRef      = useRef<HTMLInputElement>(null);
  const isFirstGen        = useRef(true);
  const streamBufferRef   = useRef('');   // raw accumulator (network side)
  const genPhaseRef       = useRef<'idle' | 'thinking' | 'streaming' | 'done'>('idle');
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasTriggeredInitial = useRef(false);
  // ─── Persist chat per project ────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    const key = `genesis-chat-${projectId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed: Message[] = JSON.parse(saved);
        // Re-hydrate timestamps
        setMessages(parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp), imagePreview: undefined })));
        isFirstGen.current = parsed.filter(m => m.role === 'user').length === 0;
      } catch { setMessages([WELCOME]); }
    } else {
      setMessages([WELCOME]);
      isFirstGen.current = true;
    }
    setConvHistory([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!projectId || messages.length <= 1) return;
    const key = `genesis-chat-${projectId}`;
    const toSave = messages.map(m => ({ ...m, imagePreview: undefined }));
    try {
      localStorage.setItem(key, JSON.stringify(toSave));
    } catch {
      console.warn('[Genesis] localStorage quota exceeded — chat not persisted');
    }
  }, [messages, projectId]);

  useEffect(() => {
    if (!showScrollBtn) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating, streamingContent]);

  // ─── 40ms visual rate limiter — drain network buffer to display state ────────
  useEffect(() => {
    if (genPhase !== 'streaming') return;
    streamBufferRef.current = '';
    const id = setInterval(() => {
      const buf = streamBufferRef.current;
      if (buf) setStreamingContent(buf);
    }, 40);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genPhase]);

  useEffect(() => {
    if (initialPrompt && !isGenerating && user && !hasTriggeredInitial.current) {
      hasTriggeredInitial.current = true;
      onInitialPromptUsed?.();
      handleSend(initialPrompt);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, user]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 120);
  };

  // ─── Image upload handler ──────────────────────────────────────────────────
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Solo imágenes'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagen muy grande (máx 5MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => setPendingImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleTextFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setPendingContext({ name: file.name, content });
      toast.success(`Archivo "${file.name}" cargado como contexto.`);
    };
    reader.readAsText(file);
  };

  // ─── URL Scraper ───────────────────────────────────────────────────────────
  const handleAttachUrl = async () => {
    const raw = urlInput.trim();
    if (!raw) return;
    let url = raw;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    try { new URL(url); } catch { toast.error('URL inválida'); return; }

    setIsScraping(true);
    setShowUrlInput(false);
    setUrlInput('');
    try {
      const cloneData = await cloneWebsiteAdvanced(url);
      
      // Store full clone data to be injected into prompt later
      setPendingUrl(JSON.stringify(cloneData));
      toast.success('Sitio analizado. Describe cómo quieres clonarlo.');
    } catch (e: any) {
      if (e.name === 'TimeoutError') {
        toast.error('Tiempo agotado leyendo el sitio.');
      } else {
        toast.error(`No se pudo leer el sitio: ${e.message ?? e}`);
      }
    } finally {
      setIsScraping(false);
    }
  };

  // ─── Streaming generation ─────────────────────────────────────────────────
  const generateCode = useCallback(async (
    prompt: string,
  ): Promise<{ files: Record<string, StudioFile>; explanation: string; stack: string[]; deps: string[]; suggestions: string[]; isChatOnly?: boolean } | null> => {
    setIsGenerating(true);
    onGeneratingChange?.(true);
    setStreamChars(0);
    setGenPhase('thinking');
    genPhaseRef.current = 'thinking';
    streamBufferRef.current = '';
    setStreamingContent(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

      const isChatModeActive = detectIntent(prompt) === 'chat';
      setCurrentGenIntent(isChatModeActive ? 'chat' : 'codegen');

      try {
        const fileKeys = Object.keys(projectFiles);

        // ── @file mention injection ───────────────────────────────────────────────
        const mentionMatches = [...prompt.matchAll(/@([\w./\-]+)/g)];
        const mentionedFiles = mentionMatches
          .map(m => m[1])
          .filter(f => projectFiles[f]);
        const mentionBlock = mentionedFiles.length > 0
          ? '\n\n[ARCHIVOS MENCIONADOS]\n' + mentionedFiles.map(f =>
              `// @${f}\n${projectFiles[f].content.slice(0, 3000)}`).join('\n\n')
          : '';

        // Build project context for chat (compact — just file names + tech)
        let contextBlock = mentionBlock;
        if (isChatModeActive && fileKeys.length > 0 && !mentionBlock) {
          contextBlock = `\n\n[PROYECTO ACTIVO]\nArchivos: ${fileKeys.join(', ')}\n${activeFile ? `\n[ARCHIVO ACTUALMENTE ABIERTO - PRIORIDAD DE EDICIÓN]: ${activeFile}\nCONTENIDO DE ${activeFile}:\n${projectFiles[activeFile]?.content || ''}\n` : ''}\nContenido relevante:\n` +
            fileKeys.slice(0, 3).map(f => `// ${f}\n${projectFiles[f].content.slice(0, 600)}`).join('\n\n');
        } else if (!isChatModeActive && fileKeys.length > 0) {
          contextBlock += '\n\nARCHIVOS ACTUALES DEL PROYECTO:\n' +
            fileKeys.map(f => `--- ${f} ---\n${projectFiles[f].content.slice(0, 3000)}`).join('\n\n') +
            (activeFile ? `\n\n[ARCHIVO ACTUALMENTE ABIERTO]: ${activeFile}` : '');
        }

        // ── URL Clone injection ────────────────────────────────────────────────────
        let cloneBlock = '';
        let effectiveSystemPrompt = isChatModeActive 
          ? (persona === 'antigravity' ? ANTIGRAVITY_CHAT_SYSTEM : GENESIS_CHAT_SYSTEM)
          : CODE_GEN_SYSTEM;

      if (pendingUrl) {
        const parsedClone = JSON.parse(pendingUrl);
        // Supports legacy `{url, content}` or new `CloneResult` from cloneWebsiteAdvanced
        const cloneUrl = parsedClone.url;
        const cloneMd  = parsedClone.content || parsedClone.markdown || '';
        const colors   = parsedClone.colors && parsedClone.colors.length > 0 ? `\n[COLORES EXTRAÍDOS]: ${parsedClone.colors.join(', ')}` : '';
        const fonts    = parsedClone.fonts && parsedClone.fonts.length > 0 ? `\n[TIPOGRAFÍA EXTRAÍDA]: ${parsedClone.fonts.join(', ')}` : '';
        const sitemap  = parsedClone.sitemap && parsedClone.sitemap.length > 0 ? `\n[RUTAS/SITEMAP RECOMENDADO]: ${parsedClone.sitemap.join(', ')}` : '';

        // Always force codegen mode when a URL is attached
        effectiveSystemPrompt = CLONE_SYSTEM_PROMPT + cloneMd + colors + fonts + sitemap;
        cloneBlock = `\n\n[URL OBJETIVO A CLONAR]: ${cloneUrl}\n[INSTRUCCIÓN DEL USUARIO]: ${prompt}`;
        setPendingUrl(null); // consume once
      }

      // Build user content (multimodal if image present)
      const currentModel = MODELS.find(m => m.id === selectedModel) ?? MODELS[0];
      const userContent: any = (pendingImage && currentModel.vision && !isChatModeActive)
        ? [{ type: 'image_url', image_url: { url: pendingImage } }, { type: 'text', text: (cloneBlock || prompt) + contextBlock }]
        : (cloneBlock || prompt) + contextBlock;

      // System prompt + model selection
      const supabaseContext = supabaseConfig
        ? `\n\nSUPABASE CONECTADO AL PROYECTO:\n- URL: ${supabaseConfig.url}\n- Anon Key: ${supabaseConfig.anonKey}\nUSA window.supabaseClient (ya inicializado) para todas las operaciones de base de datos. NO importes ni crees el cliente, ya está disponible globalmente.`
        : '';
      const systemPrompt = cloneBlock
        ? effectiveSystemPrompt  // clone mode: already built above
        : (isChatModeActive ? effectiveSystemPrompt : effectiveSystemPrompt + supabaseContext);
      // In chat mode: Gemini Flash for speed. Clone/codegen: user-selected model.
      const modelToUse = (isChatModeActive && !cloneBlock)
        ? 'google/gemini-2.0-flash-001'
        : selectedModel;

      // Build messages with last 10 turns for memory
      const historySlice = convHistory.slice(-10);
      const messages = [
        { role: 'system', content: systemPrompt },
        ...historySlice,
        { role: 'user',   content: userContent },
      ];

      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? '';

      // Streaming fetch
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          provider: 'openrouter',
          path: 'chat/completions',
          body: {
            model: modelToUse,
            messages,
            stream: true,
            temperature: isChatModeActive ? 0.6 : 0.2,
            max_tokens: isChatModeActive ? 4096 : 16000,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        toast.error(`Error ${res.status}: ${errText.slice(0, 100)}`);
        return null;
      }

      const contentType = res.headers.get('content-type') ?? '';

      // Non-streaming fallback (edge function returned JSON error)
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data?.error) { toast.error(data.error); return null; }
        const rawText: string = data?.choices?.[0]?.message?.content ?? '';
        if (isChatModeActive) return { files: {}, explanation: rawText, stack: [], deps: [], suggestions: [], isChatOnly: true };
        return processRaw(rawText, prompt);
      }

      // Parse SSE stream
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';
      let streamError: string | null = null;

      try {
        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') break outer;
            try {
              const parsed = JSON.parse(payload);
              if (parsed?.error) { streamError = parsed.error.message ?? 'Error de IA'; break outer; }
              const delta = parsed?.choices?.[0]?.delta?.content;
              if (typeof delta === 'string') {
                accumulated += delta;
                setStreamChars(accumulated.length);
                onStreamCharsChange?.(accumulated.length, accumulated.slice(-800));
                // Write to buffer (drained by 40ms interval) — also transition phase on first token
                if (isChatModeActive) {
                  streamBufferRef.current = accumulated;
                  if (genPhaseRef.current === 'thinking') {
                    genPhaseRef.current = 'streaming';
                    setGenPhase('streaming');
                  }
                }
              }
            } catch { /* partial JSON chunk, skip */ }
          }
        }
      } finally {
        reader.cancel(); // always release the stream
      }

      if (streamError) { toast.error(streamError); return null; }
      if (isChatModeActive) return { files: {}, explanation: accumulated, stack: [], deps: [], suggestions: [], isChatOnly: true };
      return processRaw(accumulated, prompt);

    } catch (e: any) {
      if (e.name === 'AbortError') {
        toast.info('Generación detenida');
        return null;
      }
      const msg = e?.message || String(e);
      console.error('[Genesis] error:', msg);
      toast.error(msg.length > 120 ? msg.slice(0, 120) + '…' : msg, { duration: 6000 });
      return null;
    } finally {
      setIsGenerating(false);
      onGeneratingChange?.(false);
      setStreamChars(0);
      // Flush remaining buffer before clearing
      if (streamBufferRef.current) setStreamingContent(streamBufferRef.current);
      setGenPhase('done');
      genPhaseRef.current = 'done';
      // Brief "done" flash, then idle
      setTimeout(() => {
        setGenPhase('idle');
        genPhaseRef.current = 'idle';
        setStreamingContent(null);
        streamBufferRef.current = '';
        setCurrentGenIntent(null);
      }, 400);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectFiles, selectedModel, convHistory, pendingImage, supabaseConfig]);

  // ─── Process raw accumulated text into files ───────────────────────────────
  const processRaw = (rawText: string, prompt: string) => {
    if (!rawText) { toast.error('La IA devolvió una respuesta vacía.'); return null; }

    const extracted = extractJson(rawText);
    // No JSON found → treat as a conversational reply (not a code-gen request)
    if (!extracted) {
      return { files: {} as Record<string, StudioFile>, explanation: rawText, stack: [], deps: [], suggestions: [], isChatOnly: true };
    }
    if (!extracted.files || typeof extracted.files !== 'object') { toast.error('Respuesta incompleta. Intenta de nuevo.'); return null; }

    // Normalize files
    const normalizedFiles: Record<string, StudioFile> = {};
    for (const [filename, value] of Object.entries(extracted.files)) {
      if (typeof value === 'string') {
        const lang = filename.endsWith('.css') ? 'css' : filename.endsWith('.json') || filename.endsWith('.yaml') ? 'json' : filename.endsWith('.md') ? 'markdown' : filename.endsWith('.py') ? 'python' : 'tsx';
        normalizedFiles[filename] = { language: lang, content: value };
      } else if (value && typeof value === 'object' && (value as any).content) {
        normalizedFiles[filename] = value as StudioFile;
      }
    }
    if (Object.keys(normalizedFiles).length === 0) { toast.error('No se generaron archivos.'); return null; }

    const stack = extracted.tech_stack ?? [];
    const deps  = detectDeps(normalizedFiles);
    const suggestions = buildSuggestions(stack, prompt);

    return { files: normalizedFiles, explanation: extracted.explanation || '', stack, deps, suggestions };
  };

  // ─── Auto-name project from first prompt ────────────────────────────────────
  const autoNameProject = useCallback(async (prompt: string) => {
    if (!onAutoName) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? '';
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({
          provider: 'openrouter',
          path: 'chat/completions',
          body: {
            model: 'deepseek/deepseek-chat',
            messages: [{ role: 'user', content: `Give a short 2-4 word project title for this idea: "${prompt.slice(0, 120)}". Return ONLY the title, no quotes, no punctuation.` }],
            max_tokens: 15,
            temperature: 0.5,
          },
        }),
      });
      const data = await res.json();
      const name = (data?.choices?.[0]?.message?.content ?? '').trim().replace(/^["']|["']$/g, '');
      if (name && name.length > 2 && name.length < 60) onAutoName(name);
    } catch { /* silent */ }
  }, [onAutoName]);

  // ─── Stop generation ───────────────────────────────────────────────────────
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    onGeneratingChange?.(false);
    setGenPhase('idle');
    genPhaseRef.current = 'idle';
    setStreamingContent(null);
  };

  // ─── Send message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async (override?: string) => {
    let text = (override || input).trim();
    if (!text && !pendingContext) {
      if (!isGenerating && user) return; // avoid empty sends
    }
    if (isGenerating || !user) return;

    // Inject pending context if present
    if (pendingContext) {
      text = `[CONTRATO/CONTEXTO DE ARCHIVO: ${pendingContext.name}]\n\`\`\`\n${pendingContext.content}\n\`\`\`\n\n${text || "Analiza este archivo y propón mejoras según tu criterio de Master Brain."}`;
    }

    const imagePreview = pendingImage ?? undefined;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      imagePreview,
    };
    setMessages((prev) => [...prev.filter((m) => m.id !== 'welcome'), userMsg]);
    setInput('');
    setPendingImage(null);
    if (inputRef.current) inputRef.current.style.height = 'auto';

    // ── CREDIT DEDUCTION ─────────────────────────────────────────────────────
    const intent = detectIntent(text);
    const modelId = (intent === 'chat' && !pendingUrl) ? 'google/gemini-2.0-flash-001' : selectedModel;
    const cost = MODEL_COSTS[modelId] ?? 1;

    try {
      // 1. Spend credits
      await aiService.spendCredits(cost, intent, modelId, null);

      // 2. Generate code/chat
      const result = await generateCode(text);

      if (!result) {
        // Refund if result is empty
        await aiService.refundCredits(cost);
        return;
      }

      let assistantMsg: Message;
      if (result.isChatOnly) {
        const chatFiles = extractChatCodeFiles(result.explanation);
        if (chatFiles && Object.keys(chatFiles).length > 0) {
          const mergedFiles = { ...projectFiles, ...chatFiles };
          onCodeGenerated(mergedFiles);
        }
        assistantMsg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.explanation,
          timestamp: new Date(),
          ...(chatFiles ? { files: Object.keys(chatFiles), type: 'code' } : {}),
        };
        setConvHistory(prev => [
          ...prev,
          { role: 'user' as const,      content: text },
          { role: 'assistant' as const, content: result.explanation },
        ].slice(-16));
      } else if (result.files && Object.keys(result.files).length > 0) {
        const mergedFiles = { ...projectFiles, ...result.files };
        onCodeGenerated(mergedFiles);
        const fileList = Object.keys(result.files).map((f) => `• \`${f}\``).join('\n');
        assistantMsg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `✅ **¡Código generado!**\n\n${fileList}\n\n${result.explanation}`,
          timestamp: new Date(),
          type: 'code',
          files: Object.keys(result.files),
          stack: result.stack,
          deps: result.deps,
          suggestions: result.suggestions,
        };
        if (isFirstGen.current) {
          isFirstGen.current = false;
          autoNameProject(text);
        }
        setConvHistory(prev => [
          ...prev,
          { role: 'user' as const,      content: text },
          { role: 'assistant' as const, content: result.explanation || 'Código generado.' },
        ].slice(-16));
      } else {
        assistantMsg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '⚠️ Hubo un problema al procesar tu solicitud.',
          timestamp: new Date(),
        };
      }

      // 3. Add assistant message to UI
      setMessages((prev) => [...prev, assistantMsg]);
      setPendingContext(null); // Clear context after send

    } catch (err: any) {
      console.error("[StudioChat] Error in handleSend:", err);
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `⚠️ **Error:** ${err.message || "Hubo un problema."}`,
        timestamp: new Date(),
      }]);
    }
  }, [input, isGenerating, user, generateCode, onCodeGenerated, pendingImage, autoNameProject, selectedModel, projectId, pendingUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 350) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const copyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Drag and drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      handleImageFile(file);
    } else {
      handleTextFile(file);
    }
  };

  const currentModel = MODELS.find(m => m.id === selectedModel) ?? MODELS[0];

  return (
    <div className="flex flex-1 min-h-0 h-full w-full flex-col relative bg-background">

      {/* ── Messages ─────────────────────────────────────────────────────────── */}
      <div ref={containerRef} onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar"
        onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>




        {messages.map((msg) => (
          <div key={msg.id} className={`group ${msg.role === 'user' ? 'flex flex-col items-end gap-2 mb-4' : 'flex flex-col items-start gap-4 mb-8'}`}>
            {msg.role === 'user' ? (
              <>
                <div className="bg-zinc-900 text-white px-6 py-3.5 rounded-3xl rounded-tr-none text-sm font-bold shadow-2xl shadow-zinc-900/10 max-w-[85%] animate-in fade-in slide-in-from-right-4 duration-500">
                  {msg.imagePreview && (
                    <div className="rounded-xl overflow-hidden mb-3 border border-white/10">
                      <img src={msg.imagePreview} alt="Referencia" className="max-h-48 w-auto object-contain" />
                    </div>
                  )}
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                </div>
                <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                  Tú · {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            ) : (
              <div className="w-full max-w-[95%]">
                <div className="flex items-center gap-3 mb-3 pl-1">
                  <div className="h-7 w-7 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-xl shadow-zinc-200 animate-in zoom-in duration-500">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-zinc-900 tracking-[0.2em]">{persona === 'antigravity' ? 'Antigravity AI' : 'Genesis AI'}</span>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Master Brain Engine</span>
                  </div>
                </div>

                <div className="bg-white border border-zinc-200/80 px-7 py-6 rounded-[32px] rounded-tl-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] animate-in fade-in slide-in-from-left-4 duration-500 relative group/msg">
                  <div className="prose prose-zinc max-w-none prose-sm font-medium"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />

                  {/* Tech stack badge */}
                  {msg.stack && msg.stack.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-zinc-100">
                      {msg.stack.map(s => (
                        <span key={s} className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-zinc-50 text-zinc-500 border border-zinc-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Reactions / Actions */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                    <button onClick={() => copyMessage(msg.content, msg.id)}
                      className="p-2 rounded-xl bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all">
                      {copiedId === msg.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    {/* Retry button for assistant messages if context allows */}
                    <button onClick={() => {
                      const idx = messages.indexOf(msg);
                      if (idx > 0) handleSend(messages[idx-1].content);
                    }}
                      className="p-2 rounded-xl bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Suggestions / Starter Chips */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 pl-2">
                    {msg.suggestions.map((s, i) => (
                      <button key={i} onClick={() => handleSend(s)}
                        className="px-5 py-2.5 rounded-full border border-zinc-200 bg-white text-[11px] font-black text-zinc-500 hover:border-black hover:text-black hover:shadow-xl hover:shadow-black/5 transition-all animate-in fade-in slide-in-from-bottom-2 duration-500"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* ── Phase: THINKING ─────────── */}
        {genPhase === 'thinking' && (
          <div className="flex flex-col items-start gap-4 mb-8 pl-1 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-7 w-7 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-xl shadow-zinc-200">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
              <span className="text-[10px] font-black uppercase text-zinc-900 tracking-[0.2em]">
                {currentGenIntent === 'codegen' ? 'Generando...' : 'Genesis...'}
              </span>
            </div>
            <div className="flex items-center gap-3 py-3 px-6 rounded-3xl bg-zinc-50 border border-zinc-200/60 shadow-sm transition-all">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                Realizando Análisis Estratégico...
              </span>
            </div>
          </div>
        )}

        {/* ── Phase: STREAMING — live content with smooth rate-limited display ─ */}
        {(genPhase === 'streaming' || genPhase === 'done') && streamingContent !== null && (
          <div className="flex flex-col items-start gap-4 mb-8">
            <div className="flex items-center gap-3 mb-1 pl-1">
              <div className="h-7 w-7 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-xl shadow-zinc-200">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-zinc-900 tracking-[0.2em]">{persona === 'antigravity' ? 'Antigravity AI' : 'Genesis AI'}</span>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none tracking-tighter">Procesando...</span>
              </div>
            </div>

            <div className="bg-white border border-zinc-200/80 px-7 py-6 rounded-[32px] rounded-tl-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] animate-in fade-in slide-in-from-left-4 duration-500 min-w-[200px]">
              <div className="prose prose-zinc max-w-none prose-sm font-medium"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingContent || '​') }} />
              {/* Blinking cursor */}
              {genPhase === 'streaming' && (
                <span className="inline-block h-3.5 w-1 ml-1 align-text-bottom rounded-full animate-pulse bg-primary" />
              )}
            </div>

            {/* Code gen progress bar overlay */}
            {isGenerating && currentGenIntent === 'codegen' && (
              <div className="w-full max-w-xs mt-2 pl-2">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Compilando ADN</span>
                    {streamChars > 0 && <span className="text-[9px] font-black text-primary uppercase">{Math.min(Math.round((streamChars / 12000) * 100), 99)}%</span>}
                  </div>
                  <div className="h-1 w-full rounded-full overflow-hidden bg-zinc-100 border border-zinc-200/50">
                    <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" 
                      style={{ width: `${Math.min((streamChars / 12000) * 100, 95)}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll-to-bottom */}
      {showScrollBtn && (
        <button onClick={() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowScrollBtn(false); }}
          className="absolute bottom-24 right-3 z-10 h-7 w-7 flex items-center justify-center rounded-full bg-primary text-white shadow-lg">
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      )}

      {/* ── Input Area ── */}
      <div className="shrink-0 p-3 border-t border-border bg-background">

        {/* Pending image preview */}
        {pendingImage && (
          <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10">
            <img src={pendingImage} alt="Preview" className="h-8 w-8 rounded-lg object-cover shrink-0" />
            <span className="text-[11px] text-zinc-500 flex-1">Imagen adjunta · se enviará con el mensaje</span>
            <button onClick={() => setPendingImage(null)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Pending URL chip */}
        {pendingUrl && (
          <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl animate-in fade-in duration-200"
            style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
            <Globe className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] text-emerald-300/80 flex-1 truncate">
              {JSON.parse(pendingUrl).url}
            </span>
            <span className="text-[9px] text-emerald-400/50 shrink-0">Listo para clonar</span>
            <button onClick={() => setPendingUrl(null)} className="text-white/30 hover:text-white transition-colors ml-1">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Attached text/code context indicator */}
        {pendingContext && (
          <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 animate-in slide-in-from-bottom-1 duration-300">
            <FileCode2 className="h-3.5 w-3.5 text-primary" />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest truncate">Contexto: {pendingContext.name}</span>
              <span className="text-[9px] text-zinc-400 truncate">El código se enviará con tu mensaje</span>
            </div>
            <button onClick={() => setPendingContext(null)} className="text-zinc-400 hover:text-zinc-900 transition-colors shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* URL Input row */}
        {showUrlInput && (
          <div className="mb-2 flex items-center gap-1.5 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 border border-primary/20">
              <Link2 className="h-3.5 w-3.5 text-primary/40 shrink-0" />
              <input
                autoFocus
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAttachUrl(); }
                  if (e.key === 'Escape') { setShowUrlInput(false); setUrlInput(''); }
                }}
                placeholder="https://..."
                className="flex-1 bg-transparent text-[12px] text-zinc-900 placeholder:text-zinc-300 outline-none"
              />
              {urlInput && (
                <ExternalLink className="h-3 w-3 text-zinc-300" />
              )}
            </div>
            <button
              onClick={handleAttachUrl}
              disabled={!urlInput.trim() || isScraping}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all disabled:opacity-30"
              style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}
            >
              {isScraping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
              {isScraping ? 'Leyendo...' : 'Clonar'}
            </button>
            <button onClick={() => { setShowUrlInput(false); setUrlInput(''); }}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 transition-colors border border-zinc-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Active File Context Indicator */}
        {activeFile && (
          <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 w-fit animate-in fade-in slide-in-from-bottom-2 duration-300">
            <FileCode2 className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
              Editando: {activeFile.split('/').pop()}
            </span>
          </div>
        )}

        <div className="rounded-xl transition-all relative focus-within:ring-2 focus-within:ring-primary/10 bg-white border border-zinc-200 shadow-sm">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type or describe what you need... @file to cite code"
            className="w-full bg-transparent px-3.5 pt-3 pb-2 text-[13px] text-foreground placeholder:text-muted-foreground/30 outline-none resize-none min-h-[20px] max-h-[350px] leading-relaxed"
            disabled={isGenerating}
            rows={1}
          />
          <div className="flex items-center justify-between px-3 pb-2.5">
            <div className="flex items-center gap-1.5">
              {/* Image attach button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
                aria-label={currentModel.vision ? 'Adjuntar imagen' : 'Este modelo no soporta imágenes'}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all disabled:opacity-30"
                title={currentModel.vision ? 'Adjuntar imagen (modelo con visión)' : 'Este modelo no soporta imágenes'}
              >
                <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {!currentModel.vision && <span className="text-[9px]" aria-hidden="true">—</span>}
              </button>

              {/* URL Clone button */}
              <button
                onClick={() => { setShowUrlInput(v => !v); setUrlInput(''); }}
                disabled={isGenerating || isScraping}
                aria-label="Clonar sitio web desde URL"
                title="Clonar sitio web desde URL"
                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all disabled:opacity-30 ${
                  pendingUrl ? 'bg-emerald-50 text-emerald-600' : 
                  showUrlInput ? 'bg-primary/10 text-primary' : 
                  'text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
              </button>

              {/* Model selector — compact chip */}
              <div className="relative">
                <button
                  onClick={() => setModelOpen(!modelOpen)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  <Sparkles className="h-3 w-3 text-primary/50" />
                  <span className="max-w-[80px] truncate">{currentModel.label}</span>
                  <span className="text-[9px] text-muted-foreground/40 ml-0.5">code</span>
                  <ChevronDown className={`h-2.5 w-2.5 transition-transform ${modelOpen ? 'rotate-180' : ''}`} />
                </button>

                {modelOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setModelOpen(false)} />
                    <div className="absolute left-0 bottom-full mb-1.5 w-72 rounded-xl overflow-hidden z-50 bg-white border border-zinc-200 shadow-xl">
                      <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em]">Modelo de IA para código</p>
                      {MODELS.map(m => (
                        <button key={m.id} onClick={() => { setSelectedModel(m.id); setModelOpen(false); }}
                          aria-label={`Seleccionar modelo ${m.label}${m.premium ? ' (requiere plan Pymes)' : ''}`}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-all hover:bg-zinc-50 ${
                            selectedModel === m.id ? 'bg-primary/5 text-zinc-900' : 'text-zinc-500'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {m.premium && <Lock className="h-2.5 w-2.5 text-amber-500 shrink-0" aria-hidden="true" />}
                            <span className="text-[12px] font-medium">{m.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {m.vision && <span className="text-[9px] text-emerald-500" aria-label="Soporta visión">👁</span>}
                            <span className={`text-[9px] ${m.premium ? 'text-amber-600' : 'text-emerald-600'}`}>{m.badge}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            {isGenerating ? (
              <button
                onClick={handleStop}
                aria-label="Detener generación"
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all text-[11px] font-bold ml-2 shadow-sm"
              >
                <div className="h-2 w-2 rounded-sm bg-rose-500" aria-hidden="true" /> Stop
              </button>
            ) : (
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                aria-label="Enviar mensaje"
                className="flex flex-col items-center justify-center p-2 rounded-xl text-white disabled:opacity-30 transition-all active:scale-95 bg-primary hover:shadow-lg shadow-primary/20 ml-2"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <p className="mt-1.5 text-center text-[10px] text-zinc-300">
          {currentGenIntent === 'chat' || (currentGenIntent === null && detectIntent(input) === 'chat' && input.length > 3)
            ? 'Gemini Flash · respuesta rápida'
            : `${currentModel.label} · código`}
          {convHistory.length > 0 && <span className="ml-2 text-primary/40">· {convHistory.length / 2} turnos</span>}
        </p>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ''; }}
      />
    </div>
  );
}
