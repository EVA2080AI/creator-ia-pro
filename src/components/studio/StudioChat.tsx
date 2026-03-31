import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Sparkles, Bot, Loader2,
  ChevronDown, Copy, RotateCcw, Check,
  X, Image as ImageIcon, AlertCircle, Wrench, Globe, Link2, ExternalLink,
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
  { id: 'anthropic/claude-3.5-sonnet',           label: 'Claude 3.5 Sonnet',  badge: '⚡ Recomendado', vision: true  },
  { id: 'anthropic/claude-3-5-sonnet-20241022',  label: 'Claude 3.5 Sonnet v2',badge: '🔥 Sólido',     vision: true  },
  { id: 'openai/gpt-4o',                         label: 'GPT-4o',              badge: '🧠 OpenAI',     vision: true  },
  { id: 'deepseek/deepseek-r1',                  label: 'DeepSeek R1',         badge: '💡 Razonador',  vision: false },
  { id: 'deepseek/deepseek-chat',                label: 'DeepSeek V3',         badge: '💰 Económico',  vision: false },
  { id: 'google/gemini-2.0-flash-001',           label: 'Gemini 2.0 Flash',   badge: '🚀 Veloz',      vision: true  },
  { id: 'mistralai/mistral-large',               label: 'Mistral Large',       badge: '🇪🇺 EU',         vision: false },
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
  // Pasting an error/code block → always chat
  if (/```[\s\S]*```/.test(prompt) || p.includes('error:') || p.includes('exception')) return 'chat';
  // Starts with imperative build verb → codegen
  if (CODE_VERBS.some(v => p.startsWith(v + ' ') || p.startsWith(v + '\n'))) return 'codegen';
  // Contains code noun → codegen (weighted)
  const nounHit = CODE_NOUNS.filter(n => p.includes(n)).length;
  const verbHit = CODE_VERBS.filter(v => p.includes(v)).length;
  if (nounHit + verbHit >= 2) return 'codegen';
  return 'chat';
}

// ─── Genesis unified system prompt (v3 — Elite Architect & Full-Stack Lead) ──────
const GENESIS_CHAT_SYSTEM = `Eres Genesis AI — el asistente de desarrollo más avanzado del mundo, experto en arquitectura de software y entrega de productos de nivel empresarial (Elite Architect). Eres:

🧠 ARQUITECTO DE SISTEMAS & AITMPL EXPERT:
  - Diseñas arquitecturas escalables (Microservicios, Serverless, Event-Driven).
  - Experto en el ecosistema aitmpl.com: Creas Skills, MCPs, Plugins y Slash Commands de alto nivel.
  - Dominas patrones de diseño (SOLID, KISS, DRY, DDD).

⚡ ELITE FULL-STACK ENGINEER (Senior Staff Level):
  - FRONTEND: React 19, Next.js 15 (App Router), TypeScript avanzado, Zustand/TanStack Query. Optimizas para Core Web Vitals y performance extrema.
  - BACKEND: APIs REST/GraphQL/tRPC ultra-seguras. Experto en Node.js, Python/FastAPI, Go.
  - SQL & DB ARCHITECT: Maestro en PostgreSQL. Diseñas esquemas, índices, vistas, funciones RPC y migraciones complejas (Supabase).

🎨 UX/UI & PRODUCT DESIGNER:
  - Creas interfaces premium (Onyx UI Design System).
  - Dominas Tailwind CSS, ShadCN y Animaciones (Framer Motion).
  - Enfoque en CRO (Conversion Rate Optimization) y Accesibilidad (WCAG 2.1).

🚀 DEVOPS, DEPLOYMENT & QA:
  - QA EXPERT: Escribes tests robustos (Playwright, Vitest). Sabes hacer debugging profundo de race conditions o memory leaks.
  - DEPLOYMENT LOGIC: Experto en GitHub Actions (CI/CD), Vercel y Supabase.
  - PAYMENTS (Stripe & Bold): Implementación experta de pasarelas de pago (webhooks, suscripciones, seguridad y orquestación).

ESTILO Y REGLAS DE ORO:
- Precisión absoluta. Sin palabras de relleno.
- Responde en español (términos técnicos en inglés).
- Siempre da una solución proactiva: no esperes a que se te pida arreglar un error, sugere mejoras de arquitectura y código industrial.
- Si detectas debilidades de seguridad o performance, corrígelas inmediatamente.

Tienes acceso total al contexto de este proyecto. Estás aquí para liderar la implementación desde el primer archivo hasta el despliegue final en producción.`;

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
- Integraciones: Experto conectando OpenRouter, Supabase, y Stripe.
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
  const blocks: Array<{ lang: string; code: string }> = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    const lang = m[1].trim().toLowerCase();
    const code = m[2].trim();
    if (code.length > 80) blocks.push({ lang, code });
  }
  if (blocks.length === 0) return null;

  const files: Record<string, StudioFile> = {};
  for (const { lang, code } of blocks) {
    if (lang === 'html' || code.startsWith('<!DOCTYPE') || code.startsWith('<html')) {
      files['index.html'] = { language: 'html', content: code };
    } else if ((lang === 'tsx' || lang === 'jsx' || lang === 'react') && code.length > 100) {
      files['App.tsx'] = { language: 'tsx', content: code };
    } else if ((lang === 'ts' || lang === 'js' || lang === 'typescript' || lang === 'javascript') && code.length > 100 && !files['App.tsx']) {
      // Treat as TSX if it contains JSX patterns or React hooks
      const isJsx = /return\s*\(?\s*<|useState\s*[<(]|useEffect\s*\(|<[A-Z][A-Za-z]|React\.createElement/.test(code);
      files['App.tsx'] = { language: isJsx ? 'tsx' : lang, content: code };
    } else if (lang === 'css' && code.length > 20) {
      files['styles.css'] = { language: 'css', content: code };
    } else if (lang === 'python') {
      files['main.py'] = { language: 'python', content: code };
    }
  }
  return Object.keys(files).length > 0 ? files : null;
}

// ─── Markdown renderer ─────────────────────────────────────────────────────────
function renderMarkdown(text: string): string {
  let raw = text
    // Code blocks (multiline) — process FIRST before inline code
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, lang, code) =>
      `<pre class="my-2 rounded-xl overflow-x-auto p-3 text-[11px] font-mono leading-relaxed" style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.08)"><code class="text-[#a8d8a8]">${code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`)
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-[12px] font-bold text-white/90 mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="text-[13px] font-bold text-white mt-3 mb-1.5">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 class="text-[14px] font-black text-white mt-3 mb-2">$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white/95">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-black/40 px-1.5 py-0.5 rounded-md text-[#8AB4F8] font-mono text-[10px] border border-white/[0.07]">$1</code>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="flex items-start gap-2 text-white/70 mb-0.5"><span class="text-[#8AB4F8] shrink-0 font-bold text-[10px] mt-0.5">→</span><span>$1</span></li>')
    // Bullet lists
    .replace(/^[-•] (.+)$/gm, '<li class="flex items-start gap-2 text-white/70 mb-0.5"><span class="text-[#8AB4F8] shrink-0 mt-1.5 h-1 w-1 rounded-full bg-current inline-block"></span><span>$1</span></li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-white/10 my-3"/>')
    // Line breaks
    .replace(/\n\n/g, '<div class="my-2"></div>')
    .replace(/\n/g, '<br/>');

  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ['strong','em','code','pre','li','br','h1','h2','h3','span','div','hr'],
    ALLOWED_ATTR: ['class','style'],
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
}

export function StudioChat({
  projectId, projectFiles, onCodeGenerated,
  onNewConversation, initialPrompt, onInitialPromptUsed, onAutoName,
  onGeneratingChange, onStreamCharsChange, supabaseConfig,
}: StudioChatProps) {
  const { user } = useAuth();
  const [messages,         setMessages]         = useState<Message[]>([WELCOME]);
  const [input,            setInput]            = useState('');
  const [isGenerating,     setIsGenerating]     = useState(false);
  const [streamChars,      setStreamChars]      = useState(0);
  const [showScrollBtn,    setShowScrollBtn]    = useState(false);
  const [copiedId,         setCopiedId]         = useState<string | null>(null);
  const [selectedModel,    setSelectedModel]    = useState(MODELS[0].id);
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

  const messagesEndRef    = useRef<HTMLDivElement>(null);
  const containerRef      = useRef<HTMLDivElement>(null);
  const inputRef          = useRef<HTMLTextAreaElement>(null);
  const fileInputRef      = useRef<HTMLInputElement>(null);
  const isFirstGen        = useRef(true);
  const streamBufferRef   = useRef('');   // raw accumulator (network side)
  const genPhaseRef       = useRef<'idle' | 'thinking' | 'streaming' | 'done'>('idle');
  const abortControllerRef = useRef<AbortController | null>(null);
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
    if (initialPrompt && !isGenerating && user) {
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
        contextBlock = `\n\n[PROYECTO ACTIVO]\nArchivos: ${fileKeys.join(', ')}\nContenido relevante:\n` +
          fileKeys.slice(0, 3).map(f => `// ${f}\n${projectFiles[f].content.slice(0, 600)}`).join('\n\n');
      } else if (!isChatModeActive && fileKeys.length > 0) {
        contextBlock += '\n\nARCHIVOS ACTUALES DEL PROYECTO:\n' +
          fileKeys.map(f => `--- ${f} ---\n${projectFiles[f].content.slice(0, 2000)}`).join('\n\n');
      }

      // ── URL Clone injection ────────────────────────────────────────────────────
      let cloneBlock = '';
      let effectiveSystemPrompt = isChatModeActive ? GENESIS_CHAT_SYSTEM : CODE_GEN_SYSTEM;
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
    const text = (override || input).trim();
    if (!text || isGenerating || !user) return;

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
      await aiService.spendCredits(cost, intent, modelId, projectId);

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
          onCodeGenerated(chatFiles);
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
        onCodeGenerated(result.files);
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

  // Drag and drop image into textarea area
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  const currentModel = MODELS.find(m => m.id === selectedModel) ?? MODELS[0];

  return (
    <div className="flex flex-1 min-h-0 h-full w-full flex-col relative" style={{ background: '#141417' }}>

      {/* ── Messages ─────────────────────────────────────────────────────────── */}
      <div ref={containerRef} onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar"
        onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>

        {/* Starter chips — shown only when chat is empty (welcome only) */}
        {messages.length === 1 && messages[0].id === 'welcome' && !isGenerating && (
          <div className="px-1 pb-2">
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-2 px-1">Empezar con</p>
            <div className="grid grid-cols-2 gap-1.5">
              {STARTER_CHIPS.map(chip => (
                <button key={chip.label} onClick={() => handleSend(chip.prompt)}
                  className="flex items-center gap-2 p-2.5 rounded-xl text-left transition-all group/chip"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(138,180,248,0.25)'; (e.currentTarget as HTMLElement).style.background = 'rgba(138,180,248,0.05)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                >
                  <span className="text-base shrink-0">{chip.emoji}</span>
                  <span className="text-[11px] font-semibold text-white/50 group-hover/chip:text-white/80 transition-colors leading-tight">{chip.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`group ${msg.role === 'user' ? 'flex justify-end mb-3' : 'mb-4'}`}>
            {msg.role === 'user' ? (
              <div className="max-w-[88%] space-y-1.5">
                {msg.imagePreview && (
                  <div className="rounded-xl overflow-hidden border border-[#8AB4F8]/20">
                    <img src={msg.imagePreview} alt="Referencia" className="max-h-32 w-auto object-contain" />
                  </div>
                )}
                <div className="rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[13px] leading-relaxed text-white"
                  style={{ background: 'rgba(138,180,248,0.18)', border: '1px solid rgba(138,180,248,0.25)' }}>
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-2 px-1">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md mt-0.5"
                    style={{ background: 'rgba(138,180,248,0.12)', border: '1px solid rgba(138,180,248,0.2)' }}>
                    <Bot className="h-3 w-3 text-[#8AB4F8]" />
                  </div>
                  <div className={`flex-1 text-[13px] leading-relaxed ${msg.type === 'code' ? 'text-white/90' : 'text-white/75'}`}>
                    <div className="prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />

                    {/* Tech stack badge */}
                    {msg.stack && msg.stack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {msg.stack.map(s => (
                          <span key={s} className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest"
                            style={{ background: 'rgba(138,180,248,0.1)', color: '#8AB4F8', border: '1px solid rgba(138,180,248,0.2)' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Missing deps warning */}
                    {msg.deps && msg.deps.length > 0 && (
                      <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-xl text-[10px]"
                        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <AlertCircle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-400 mb-0.5">Instalar dependencias:</p>
                          <code className="text-white/60 text-[9px]">npm i {msg.deps.join(' ')}</code>
                        </div>
                      </div>
                    )}

                    {/* Quick suggestions */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[9px] text-white/25 uppercase tracking-widest font-bold px-1">Iteraciones rápidas</p>
                        {msg.suggestions.map((s, i) => (
                          <button key={i} onClick={() => handleSend(s)}
                            className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-[11px] text-white/50 hover:text-white transition-all text-left"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(138,180,248,0.25)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
                          >
                            <Wrench className="h-3 w-3 text-[#8AB4F8]/50 shrink-0" />
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Reaction bar */}
                <div className="flex items-center gap-0.5 ml-8 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => copyMessage(msg.content, msg.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-white/25 hover:text-white hover:bg-white/[0.06] transition-all text-[10px]">
                    {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                  <button onClick={() => handleSend(messages[messages.indexOf(msg) - 1]?.content)}
                    className="px-2 py-1 rounded-md text-white/25 hover:text-white hover:bg-white/[0.06] transition-all">
                    <RotateCcw className="h-3 w-3" />
                  </button>
                  <span className="ml-1 text-[10px] text-white/15">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ── Phase: THINKING ─────────── */}
        {genPhase === 'thinking' && (
          <div className="flex items-start gap-2 px-1 mb-4 animate-in fade-in duration-200">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
              style={{ background: 'rgba(138,180,248,0.12)', border: '1px solid rgba(138,180,248,0.2)' }}>
              <Bot className="h-3 w-3 text-[#8AB4F8]" />
            </div>
            <div className="flex items-center gap-2.5 py-1">
              <Loader2 className="h-3 w-3 text-[#8AB4F8]/50 animate-spin" />
              <span className="text-[11px] font-medium text-[#8AB4F8]/60">
                {currentGenIntent === 'codegen' ? 'Generando código…' : 'Genesis está pensando…'}
              </span>
            </div>
          </div>
        )}

        {/* ── Phase: STREAMING — live content with smooth rate-limited display ─ */}
        {(genPhase === 'streaming' || genPhase === 'done') && streamingContent !== null && (
          <div className="flex items-start gap-2 px-1 mb-4">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md mt-0.5"
              style={{ background: 'rgba(138,180,248,0.12)', border: '1px solid rgba(138,180,248,0.2)' }}>
              <Bot className="h-3 w-3 text-[#8AB4F8]" />
            </div>
            <div className="flex-1 text-[13px] leading-relaxed text-white/75">
              <div className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingContent || '​') }} />
              {/* Blinking cursor — only while actively streaming */}
              {genPhase === 'streaming' && (
                <span className="inline-block h-3.5 w-0.5 ml-0.5 align-text-bottom rounded-full animate-pulse"
                  style={{ background: '#8AB4F8' }} />
              )}
            </div>
          </div>
        )}

        {/* ── Code gen progress bar ─────────────────────────────────────────────── */}
        {isGenerating && currentGenIntent === 'codegen' && (
          <div className="flex items-start gap-2 px-1 mb-4">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
              style={{ background: 'rgba(138,180,248,0.1)', border: '1px solid rgba(138,180,248,0.18)' }}>
              <Loader2 className="h-3 w-3 text-[#8AB4F8] animate-spin" />
            </div>
            <div className="flex flex-col justify-center gap-1 py-0.5 flex-1">
              <span className="text-[11px] text-white/35">
                {genPhase === 'thinking' ? 'Analizando prompt…' : 'Generando código…'}
              </span>
              {streamChars > 0 && (
                <div className="h-0.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(138,180,248,0.1)' }}>
                  <div className="h-full rounded-full animate-pulse" style={{ background: '#8AB4F8', width: `${Math.min((streamChars / 12000) * 100, 95)}%`, transition: 'width 0.3s ease' }} />
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll-to-bottom */}
      {showScrollBtn && (
        <button onClick={() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowScrollBtn(false); }}
          className="absolute bottom-24 right-3 z-10 h-7 w-7 flex items-center justify-center rounded-full bg-[#8AB4F8] text-white shadow-lg">
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      )}

      {/* ── Input ─────────────────────────────────────────────────────────────── */}
      <div className="shrink-0 p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Pending image preview */}
        {pendingImage && (
          <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(138,180,248,0.08)', border: '1px solid rgba(138,180,248,0.2)' }}>
            <img src={pendingImage} alt="Preview" className="h-8 w-8 rounded-lg object-cover shrink-0" />
            <span className="text-[11px] text-white/50 flex-1">Imagen adjunta · se enviará con el mensaje</span>
            <button onClick={() => setPendingImage(null)} className="text-white/30 hover:text-white transition-colors">
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

        {/* URL Input row */}
        {showUrlInput && (
          <div className="mb-2 flex items-center gap-1.5 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(138,180,248,0.3)' }}>
              <Link2 className="h-3.5 w-3.5 text-[#8AB4F8]/60 shrink-0" />
              <input
                autoFocus
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAttachUrl(); }
                  if (e.key === 'Escape') { setShowUrlInput(false); setUrlInput(''); }
                }}
                placeholder="https://stripe.com"
                className="flex-1 bg-transparent text-[12px] text-white placeholder:text-white/20 outline-none"
              />
              {urlInput && (
                <ExternalLink className="h-3 w-3 text-white/20" />
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
              className="p-2 rounded-xl text-white/30 hover:text-white transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Scraping spinner */}
        {isScraping && !showUrlInput && (
          <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
            <Loader2 className="h-3.5 w-3.5 text-emerald-400 animate-spin shrink-0" />
            <span className="text-[11px] text-emerald-300/60">Analizando sitio web objetivo...</span>
          </div>
        )}

        <div className="rounded-xl transition-all relative focus-within:ring-1 focus-within:ring-white/20"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe o describe lo que necesitas… @archivo para citar código"
            className="w-full bg-transparent px-3.5 pt-3 pb-2 text-[13px] text-white placeholder:text-white/25 outline-none resize-none min-h-[20px] max-h-[350px] leading-relaxed"
            disabled={isGenerating}
            rows={1}
          />
          <div className="flex items-center justify-between px-3 pb-2.5">
            <div className="flex items-center gap-1.5">
              {/* Image attach button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-white/30 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-30"
                title={currentModel.vision ? 'Adjuntar imagen (modelo con visión)' : 'Este modelo no soporta imágenes'}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                {!currentModel.vision && <span className="text-[9px]">—</span>}
              </button>

              {/* URL Clone button */}
              <button
                onClick={() => { setShowUrlInput(v => !v); setUrlInput(''); }}
                disabled={isGenerating || isScraping}
                title="Clonar sitio web desde URL"
                className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all disabled:opacity-30"
                style={pendingUrl
                  ? { background: 'rgba(52,211,153,0.15)', color: '#34d399' }
                  : showUrlInput
                    ? { background: 'rgba(138,180,248,0.12)', color: '#8AB4F8' }
                    : { color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => { if (!pendingUrl && !showUrlInput) (e.currentTarget as HTMLElement).style.color = 'white'; }}
                onMouseLeave={e => { if (!pendingUrl && !showUrlInput) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; }}
              >
                <Globe className="h-3.5 w-3.5" />
              </button>

              {/* Model selector — compact chip */}
              <div className="relative">
                <button
                  onClick={() => setModelOpen(!modelOpen)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"
                >
                  <Sparkles className="h-3 w-3 text-[#8AB4F8]/50" />
                  <span className="max-w-[80px] truncate">{currentModel.label}</span>
                  <span className="text-[9px] text-white/15 ml-0.5">código</span>
                  <ChevronDown className={`h-2.5 w-2.5 transition-transform ${modelOpen ? 'rotate-180' : ''}`} />
                </button>

                {modelOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setModelOpen(false)} />
                    <div className="absolute left-0 bottom-full mb-1.5 w-72 rounded-xl overflow-hidden z-50"
                      style={{ background: '#1e2028', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                      <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-bold text-white/25 uppercase tracking-[0.3em]">Modelo de IA</p>
                      {MODELS.map(m => (
                        <button key={m.id} onClick={() => { setSelectedModel(m.id); setModelOpen(false); }}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-left transition-all"
                          style={selectedModel === m.id ? { background: 'rgba(138,180,248,0.12)', color: '#E3E3E3' } : { color: 'rgba(255,255,255,0.5)' }}
                          onMouseEnter={e => { if (selectedModel !== m.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                          onMouseLeave={e => { if (selectedModel !== m.id) (e.currentTarget as HTMLElement).style.background = ''; }}
                        >
                          <span className="text-[12px] font-medium">{m.label}</span>
                          <div className="flex items-center gap-1.5">
                            {m.vision && <span className="text-[9px] text-emerald-400">👁</span>}
                            <span className="text-[10px] text-white/30">{m.badge}</span>
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
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all text-[11px] font-bold ml-2 shadow-sm"
              >
                <div className="h-2 w-2 rounded-sm bg-rose-500" /> Stop
              </button>
            ) : (
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="flex flex-col items-center justify-center p-2 rounded-xl text-white disabled:opacity-30 transition-all active:scale-95 bg-white/10 hover:bg-[#8AB4F8] hover:text-black hover:shadow-lg ml-2"
                style={input.trim() ? { background: '#8AB4F8', color: '#141417' } : {}}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <p className="mt-1.5 text-center text-[10px] text-white/15">
          {currentGenIntent === 'chat' || (currentGenIntent === null && detectIntent(input) === 'chat' && input.length > 3)
            ? 'Gemini Flash · respuesta rápida'
            : `${currentModel.label} · código`}
          {convHistory.length > 0 && <span className="ml-2 text-[#8AB4F8]/40">· {convHistory.length / 2} turnos</span>}
        </p>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ''; }}
      />
    </div>
  );
}
