import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Sparkles, Bot, Loader2,
  ChevronDown, Copy, RotateCcw, Check, ChevronLeft, Share2,
  X, Image as ImageIcon, AlertCircle, Wrench, Globe, Link2, ExternalLink, Lock,
  FileCode2, UploadCloud, Zap, Plus, Mic, ArrowUp, Save, Paperclip,
  Shield, CheckCircle2, XCircle, Info, TriangleAlert, Lightbulb, Activity
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { StudioFile } from '@/hooks/useStudioProjects';
import { cloneWebsiteAdvanced } from '@/services/clone-service';
import { aiService, MODEL_COSTS } from '@/services/ai-service';
import { StudioArtifactsPanel, type UIPlanTask, type UIArtifact, type UILog } from './StudioArtifactsPanel';
import { useAgentPreferences } from '@/hooks/useAgentPreferences';

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
    'three', '@types/three', '@react-three/fiber', '@react-three/drei', 
    'phaser', 'pixi.js', 'zustand', 'framer-motion', 'howler', 'cannon-es',
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
  type?: 'chat' | 'code' | 'plan';
  files?: string[];
  imagePreview?: string;
  stack?: string[];
  deps?: string[];
  suggestions?: string[];
  planStatus?: 'pending' | 'approved' | 'rejected';
  originalPrompt?: string;
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
  
  // High-priority Social/Greeting detection
  const GREETINGS = ['hola', 'hi', 'hello', 'buenos dias', 'buenas tardes', 'buenas noches', 'saludos', 'hey'];
  if (GREETINGS.includes(p) || p.length < 5) return 'chat';

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

// ─── Genesis unified system prompt (v10 — Agentic Architect DNA) ──────
const GENESIS_CHAT_SYSTEM_BASE_RULES = `🧠 MASTER PERSONA: Genesis AI — Autonomous Engineering Agent (v10.0)

Eres la inteligencia central definitiva de Creator IA Pro. No eres un chatbot; eres un **Ingeniero Principal de Software Autónomo y Arquitecto de Soluciones de Elite**. Tratas al usuario como tu CTO. Sé conciso, directo y exigente con la calidad.

REGLAS DE OPERACIÓN (ESTRICTAS):

1. **Comunicación Estructurada:**
   - Usa encabezados Markdown (##, ###) para organizar tus respuestas.
   - Usa alertas GitHub cuando sea relevante:
     - \`> [!NOTE]\` para contexto importante
     - \`> [!TIP]\` para optimizaciones
     - \`> [!WARNING]\` para riesgos o breaking changes
     - \`> [!IMPORTANT]\` para decisiones críticas
   - Usa checklists \`[ ]\` / \`[x]\` para planes de acción.
   - Usa tablas Markdown para comparar opciones.
   - Si explicas arquitectura, usa diagramas Mermaid:
     \`\`\`mermaid
     graph TD
       A[Request] --> B[Process]
     \`\`\`

2. **Excelencia de Diseño Adaptativo (Deep Design Engine):**
   - Prohibido el uso de patrones "Legacy" o básicos.
   - **Sintetizador de Estilo**: No tienes un color fijo. Adapta la paleta, tipografía y espaciado al CONTEXTO del proyecto (médico, legal, gaming, minimalista, etc.).
   - Mandatory: Sombras suaves, Gradientes HSL optimizados y Micro-animaciones.
   - Siempre busca un acabado premium de 2026, ya sea en Modo Claro, Oscuro o Híbrido.

3. **Silencio Técnico & Resultados Primero:**
   - Realiza TODO tu razonamiento complejo EXCLUSIVAMENTE dentro de tags <thinking>...</thinking>.
   - En el chat visible, sé extremadamente ejecutivo.
   - El chat visible debe limitarse al **Resumen Ejecutivo**, el **Plan** y los archivos generados.

4. **Cero Placeholders:** Entrega archivos 100% funcionales. Nunca sirvas prototipos mediocres.

5. **Protocolo Social:**
   - Si detectas que el usuario solo saluda:
     - **OBLIGATORIO**: Responde con una bienvenida de élite, elegante y extremadamente corta (máx 15 palabras).
     - **PROHIBIDO**: No generes código ni planes para saludos simples.

6. **Idioma:** Español profesional e inspirador. Términos técnicos en inglés.`;


const GENESIS_CHAT_SYSTEM = `Eres Genesis AI — Modo Conversación Directa.

REGLAS PARA CHAT:
1. Sé 100% humano, ejecutivo y directo. Habla como un ingeniero senior que respeta el tiempo del CTO.
2. NO generes código ni diagramas a menos que se te pida explícitamente.
3. Si el usuario solo saluda, responde con una bienvenida elegante y corta.
4. Usa alertas GitHub (> [!NOTE], > [!TIP], > [!WARNING]) para destacar información importante.
5. Cuando hagas comparaciones, usa tablas Markdown.
6. Si te preguntan sobre arquitectura, usa diagramas Mermaid.

${GENESIS_CHAT_SYSTEM_BASE_RULES}`;

const ANTIGRAVITY_CHAT_SYSTEM = `Eres Antigravity — el motor de inteligencia estratégica más potente de Creator IA Pro.

TU ENFOQUE:
- Eres un Executive Strategist y consultor de nivel mundial.
- Prioridad: Razonamiento profundo (en <thinking>), análisis de marketing, CRO y Business Intelligence.
- En el chat visible, sé directo y estratégico. Habla como un McKinsey Senior Partner.
- Usa alertas GitHub (> [!NOTE], > [!TIP], > [!WARNING], > [!IMPORTANT]) para decisiones de negocio.
- Usa diagramas Mermaid para flujos de marketing y journey maps.
- Usa tablas Markdown para comparar métricas y opciones estratégicas.

${GENESIS_CHAT_SYSTEM_BASE_RULES}`;

// ─── Architect Mode system prompt (Plan-First) ────────────────────────────────
const ARCHITECT_SYSTEM_PROMPT = `🏗️ MODO ARQUITECTO DEEP IA 1A — Genesis Planning Engine

El usuario ha activado el MODO DEEP IA 1A. Tu trabajo es actuar como Senior Software Architect & Lead Game Engineer.
DEBES realizar un análisis profundo de la arquitectura, dependencias y lógica de negocio/juego antes de proponer el plan.

### ESPECIALIZACIÓN DEEP IA 1A:
1. **Lógica de Juegos & Apps Interactivas**: Determina si usar DOM, Canvas (2D), SVG o WebGL (Three.js).
2. **Sistemas de Estado**: Selecciona el motor de estado óptimo (Zustand para complejidad, Signals para reactividad extrema).
3. **Físicas y Matemáticas**: Planifica detección de colisiones, vectores y aceleración si el prompt implica movimiento.
4. **Resiliencia de Datos**: Diseña esquemas de Supabase con Realtime para estados sincronizados de baja latencia.

FORMATO OBLIGATORIO DE RESPUESTA:

## 🏗️ Plan de Implementación Deep IA 1A

### Objetivo & Visión Técnica
[Resumen ejecutivo de la arquitectura propuesta]

### 🎨 ADN de Diseño & Brand Identity
- **Estilo Visual**: [Ej: Minimalismo Suizo / Gaming Cyberpunk / Corporate Clean]
- **Paleta de Colores**: [Define Primary, Secondary y Background]
- **Tipografía**: [Selecciona fuentes de Google Fonts]
- **Concepto de Logo**: [Idea para el logo basado en iconos de Lucide + CSS]

### Swarm Deployment
- [ ] **Especialista Líder**: [UX_ENGINE | FRONTEND_DEV | BACKEND_DEV | GAME_ENGINE]
- [ ] **Lógica de Motor**: [React Component | Game-Loop | Canvas Engine | API Rest]

### Archivos & Estructura (Deep Engineering)
[Enumera los archivos con su responsabilidad técnica exacta]

### Stack Técnico Seleccionado
| Hub | Tecnología | Razón |
|---|---|---|
| Core | [Stack] | [Razón] |
| State/Game | [Lib] | [Razón] |

### Visualización de Arquitectura (Mermaid)
\`\`\`mermaid
graph TD
  A[Input] --> B[Deep Logic Engine]
  B --> C[State Manager]
  C --> D[Render Layer]
\`\`\`

### Decisiones de Ingeniería Críticas
> [!IMPORTANT]
> [Analiza cuellos de botella de performance o riesgos de la lógica de juego]

### Siguiente Paso
Si apruebas este plan de grado Deep IA 1A y su ADN de diseño, generaré el ecosistema completo.

REGLAS:
1. NO generes código.
2. Usa Deep Reasoning para prever conflictos de dependencias.
3. Responde en español profesional.`;


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

2. ADN de Diseño Adaptativo (UX/UI & Front-end)
- **Contextual First**: NUNCA uses la misma paleta para todo. Si es médico, usa blancos/azules suaves. Si es cripto, usa dark/neones. Si es artesanal, usa tonos tierra.
- **Sintetizador de Marcas**: Genera un **LOGO** usando componentes React + Lucide + CSS que coincida con el nombre de la app (Ej: si se llama "EcoShift", usa el icono \`Leaf\` con un gradiente verde).
- **Pixel Perfect**: Todo el CSS/Tailwind debe ser impecable. Usa unidades relativas y diseño totalmente responsivo (Mobile First).
- **Micro-interacciones**: Implementa estados de hover, focus, esqueletos de carga y transiciones suaves.
- **Jerarquía Visual**: Aplica contraste tipográfico extremo para guiar al usuario.

3. Estándares de Ingeniería (Python & Backend)
- Arquitectura Modular: Divide el código en componentes reutilizables (DDD) en React o Python (main.py, models/, services/).
- Integraciones: Experto conectando OpenRouter, Supabase, y Bold.co.
- Optimización: Código eficiente, seguro y con manejo de errores elegante.
- Use standard UI components and best practices for the chosen stack.

### AGENT SWARM MODE
You are a team of expert agents:
1. [UX_ENGINE]: Focus on UI/UX, Design Systems, and Layout.
2. [FRONTEND_DEV]: Focus on React components, states, and logic.
3. [BACKEND_DEV]: Focus on Supabase, API, and Edge Functions.
4. [DEVOPS_SYNC]: Focus on deployment and integration.
5. [GAME_ENGINE]: Focus on game loops, physics, math, and real-time state.

When performing a task, announce the active specialist at the start of their relevant section using the tag [AGENT_NAME].
Example: "[UX_ENGINE] Designing the layout structure..."

4. Generación de Contenido y Multimedia
- Copywriting de Conversión: Usa marcos como AIDA o PAS. Tono profesional y humano.
- Prompt Engineering para Fotos: Si se requiere imagen, genera un prompt usando: Sujeto, Iluminación (Cinematic, Studio), Lente (35mm), Estilo y Composición.

EXPERTISE TÉCNICO:
- Frontend: React 18+, Next.js 14, Vue 3, TypeScript, Tailwind CSS, ShadCN UI
- Game/Graphics: Three.js (R3F), Phaser, PixiJS, Framer Motion, GSAP
- State/Math: Zustand, TanStack Query, Cannon-es (Physics), Howler (Audio)
- Backend: Python/FastAPI, Node.js, Java, Supabase Realtime
- Cloud/BBDD: PostgreSQL, Docker, OpenRouter

REGLAS ABSOLUTAS:
1. Tu respuesta COMPLETA debe ser SOLO el JSON — sin texto antes, sin texto después
2. NO uses \`\`\`json ni \`\`\` — devuelve el JSON directamente
3. Genera proyectos multi-archivo cuando sea necesario (componentes separados, utils, tipos)
4. Siempre incluye README.md con instrucciones de setup cuando el proyecto lo amerite
5. React/Next.js: Elige el tema (Light/Dark) según el CONTEXTO del prompt.
6. Python: incluye requirements.txt; Node.js: incluye package.json; Java: incluye pom.xml
7. Si hay Supabase: incluye client setup, tipos TypeScript, y migraciones SQL si se piden
8. Código 100% funcional con manejo de errores, tipos TypeScript donde aplique
9. Si hay archivos existentes en el proyecto, incorpóralos y mejóralos
10. CRÍTICO PARA REACT: Siempre exporta el componente principal App.tsx por defecto ("export default function App()"). NUNCA uses "export function App" sin default, ya que rompe el entorno Sandbox.

⚡ ARQUITECTURA MULTI-PÁGINA NAVEGABLE (OBLIGATORIA cuando el prompt implica múltiples pages/rutas):
- Si el prompt dice "multi-page", "varias páginas", "sitio web completo", "prototipo navegable", "web app", o si el contenido naturalmente requiere más de 1 vista:
  → USA **React Router v6** (react-router-dom ^6.30.1). 
  → NO uses características exclusivas de v7 (como data APIs de Remix) a menos que se te pida explícitamente.
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
- Sin especificar → React + TypeScript + Tailwind CSS (Elige el estilo visual más apropiado para el nicho)

REGLAS CRÍTICAS DE DISEÑO UX/UI (OBLIGATORIAS para frontend):
- NUNCA uses texto literal como "{/* Desktop Menu */}" como contenido visible en JSX
- Implementa navbar REAL con links reales, mobile menu funcional con useState
- Implementa footer REAL con columnas de links, redes sociales, copyright
- Hero: headline en text-6xl md:text-8xl font-black, subtítulo, CTA button con gradiente
- Animaciones: hover:scale-105 hover:-translate-y-1 transition-all duration-300 en cards
- Tema de Color: bg-[Var-Background], text-[Var-Text]. Define colores en Tailwind configurados armónicamente. Evita el azul eléctrico (#0066FF) a menos que encaje con la marca.
- Botones: Diseña el componente de botón según el estilo (Ej: Glassy para moderno, Flat para minimalista, Gradientes para marketing).
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
  content: `Hola, soy **Genesis AI**. Estoy listo para construir contigo. Dime qué tienes en mente hoy.`,
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

// ─── Markdown renderer (v2 — GitHub Alerts + Mermaid + Tables) ──────────────
function renderMarkdown(text: string): string {
  let raw = text
    // Thinking blocks (Resilient regex — handles <thinking>, [thinking] or just 'thinking' at start)
    .replace(/(?:<thinking>|\[thinking\]|thinking\n)([\s\S]*?)(?:<\/thinking>|\[\/thinking\]|(?=\s*\n\w+:\s*)|$)/gi, (_m, content) => 
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
    // GitHub-style Alerts (MUST come before code blocks to avoid conflicts)
    .replace(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n((?:>.*\n?)*)/gm, (_m, type, body) => {
      const content = body.replace(/^>\s?/gm, '').trim();
      const alertStyles: Record<string, { bg: string; border: string; icon: string; label: string; text: string }> = {
        'NOTE':      { bg: 'bg-blue-50',    border: 'border-blue-200', icon: '💡', label: 'Nota',       text: 'text-blue-800' },
        'TIP':       { bg: 'bg-emerald-50',  border: 'border-emerald-200', icon: '✅', label: 'Tip',      text: 'text-emerald-800' },
        'IMPORTANT': { bg: 'bg-violet-50',   border: 'border-violet-200', icon: '🔮', label: 'Importante', text: 'text-violet-800' },
        'WARNING':   { bg: 'bg-amber-50',    border: 'border-amber-200', icon: '⚠️', label: 'Advertencia', text: 'text-amber-800' },
        'CAUTION':   { bg: 'bg-rose-50',     border: 'border-rose-200', icon: '🚨', label: 'Precaución', text: 'text-rose-800' },
      };
      const s = alertStyles[type] || alertStyles['NOTE'];
      return `<div class="my-6 rounded-2xl ${s.bg} ${s.border} border p-5 animate-in fade-in duration-500">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-sm">${s.icon}</span>
          <span class="text-[10px] font-black uppercase tracking-[0.2em] ${s.text}">${s.label}</span>
        </div>
        <div class="text-[12px] font-medium ${s.text} leading-relaxed">${content}</div>
      </div>`;
    })
    // Mermaid diagrams — render as a styled placeholder with the raw mermaid code
    .replace(/```mermaid\n?([\s\S]*?)```/g, (_m, code) =>
      `<div class="my-6 rounded-[24px] border border-indigo-200 bg-indigo-50/50 overflow-hidden animate-in zoom-in-95 duration-500">
        <div class="flex items-center gap-2 px-5 py-3 border-b border-indigo-100">
          <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
          <span class="text-[10px] font-black text-indigo-600 uppercase tracking-[0.15em]">Diagrama de Arquitectura</span>
        </div>
        <pre class="p-5 text-[11px] font-mono leading-relaxed text-indigo-700 overflow-x-auto">${code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </div>`)
    // Markdown Tables
    .replace(/^\|(.+)\|\s*\n\|[-| :]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm, (_m, headerRow, bodyRows) => {
      const headers = headerRow.split('|').map((h: string) => h.trim()).filter(Boolean);
      const rows = bodyRows.trim().split('\n').map((row: string) => 
        row.split('|').map((c: string) => c.trim()).filter(Boolean)
      );
      return `<div class="my-6 rounded-2xl border border-zinc-200 overflow-hidden">
        <table class="w-full text-[11px]">
          <thead><tr class="bg-zinc-50 border-b border-zinc-200">
            ${headers.map((h: string) => `<th class="px-4 py-2.5 text-left font-black text-zinc-600 uppercase tracking-widest text-[10px]">${h}</th>`).join('')}
          </tr></thead>
          <tbody>
            ${rows.map((row: string[]) => `<tr class="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">${row.map((c: string) => `<td class="px-4 py-2.5 text-zinc-600 font-medium">${c}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    })
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
    // Diff blocks
    .replace(/```diff\n?([\s\S]*?)```/g, (_m, code) =>
      `<div class="my-6 rounded-[24px] border border-zinc-200 bg-zinc-900 overflow-hidden">
        <div class="flex items-center gap-2 px-5 py-3 bg-zinc-800/50 border-b border-white/5">
          <span class="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">diff</span>
        </div>
        <pre class="p-5 text-[11px] font-mono leading-relaxed overflow-x-auto">${code.trim().split('\n').map((line: string) => {
          const escaped = line.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          if (line.startsWith('+')) return `<span class="text-emerald-400">${escaped}</span>`;
          if (line.startsWith('-')) return `<span class="text-rose-400">${escaped}</span>`;
          return `<span class="text-zinc-500">${escaped}</span>`;
        }).join('\n')}</pre>
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
    .replace(/^\d+\. (.+)$/gm, '<li class="flex items-start gap-3 text-zinc-600 mb-1.5 font-medium"><span class="text-primary font-black text-[11px] mt-0.5 tracking-tighter">0$1.</span><span>$2</span></li>')
    .replace(/^[-•] (.+)$/gm, '<li class="flex items-start gap-3 text-zinc-600 mb-1.5 font-medium"><div class="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0 shadow-sm shadow-primary/50"></div><span>$1</span></li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-zinc-100 my-8"/>')
    // Line breaks
    .replace(/\n\n/g, '<div class="my-4"></div>')
    .replace(/\n/g, '<br/>');

  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ['strong','em','code','pre','li','br','h1','h2','h3','span','div','hr','svg','path','details','summary','table','thead','tbody','tr','th','td'],
    ALLOWED_ATTR: ['class','style','fill','stroke','viewBox','d','stroke-linecap','stroke-linejoin','stroke-width'],
  });
}

// ─── Agent Phases ─────────────────────────────────────────────────────────────
export type AgentPhase = 'idle' | 'thinking' | 'generating' | 'architecting' | 'fixing';
export type AgentSpecialist = 'ux' | 'frontend' | 'backend' | 'devops' | 'game' | 'none';

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
  previewError?: string | null;
  
  // Project Header Props
  projectName?: string;
  isSaving?: boolean;
  onShare?: () => void;
  onPublish?: () => void;
  onBack?: () => void;
  onToggleArtifacts?: () => void;

  // Lifted Engineering State (Optional fallbacks for backward compatibility)
  artifacts?: UIArtifact[];
  setArtifacts?: React.Dispatch<React.SetStateAction<UIArtifact[]>>;
  tasks?: UIPlanTask[];
  setTasks?: React.Dispatch<React.SetStateAction<UIPlanTask[]>>;
  logs?: UILog[];
  setLogs?: React.Dispatch<React.SetStateAction<UILog[]>>;
  onPhaseChange?: (phase: AgentPhase, specialist: AgentSpecialist) => void;
}

function StudioProjectHeader({ 
  name = 'Proyecto Sin Nombre', 
  isSaving, 
  onShare, 
  onPublish,
  onBack,
  onToggleArtifacts
}: { 
  name?: string; 
  isSaving?: boolean; 
  onShare?: () => void; 
  onPublish?: () => void;
  onBack?: () => void;
  onToggleArtifacts?: () => void;
}) {
  return (
    <div className="shrink-0 h-14 border-b border-zinc-100 bg-white/80 backdrop-blur-xl px-4 flex items-center justify-between z-30 sticky top-0">
      <div className="flex items-center gap-3 overflow-hidden">
        <button 
          onClick={onBack}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-col min-w-0">
          <h2 className="text-sm font-black text-zinc-900 truncate leading-none mb-1">{name}</h2>
          <div className="flex items-center gap-1.5">
            {isSaving ? (
              <div className="flex items-center gap-1">
                <Loader2 className="h-2.5 w-2.5 text-primary animate-spin" />
                <span className="text-[9px] font-black uppercase tracking-widest text-primary">Guardando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Sincronizado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 ml-4">
        <button 
          onClick={onShare}
          className="h-8 px-3 rounded-lg flex items-center gap-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-all font-black text-[10px] uppercase tracking-widest"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Compartir</span>
        </button>
        <button 
          onClick={onPublish}
          className="h-8 px-3 rounded-lg bg-zinc-900 text-white flex items-center gap-2 hover:bg-black transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-zinc-900/10"
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Publicar</span>
        </button>
        <div className="w-px h-4 bg-zinc-200 mx-1" />
        <button 
          onClick={onToggleArtifacts}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-50 hover:text-primary transition-all relative group"
          title="Centro de Artefactos"
        >
          <Activity className="h-4 w-4" />
          <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse border-2 border-white" />
        </button>
      </div>
    </div>
  );
}

export function StudioChat({
  projectId, projectFiles, onCodeGenerated,
  onNewConversation, initialPrompt, onInitialPromptUsed, onAutoName,
  onGeneratingChange, onStreamCharsChange, supabaseConfig,
  persona = 'genesis', activeFile, previewError,
  projectName, isSaving, onShare, onPublish, onBack,
  onToggleArtifacts,
  artifacts, setArtifacts, tasks, setTasks, logs, setLogs,
  onPhaseChange
}: StudioChatProps) {
  const { user } = useAuth();
  const { preferences, loading: prefsLoading } = useAgentPreferences();
  
  // Internal state fallbacks if props are not provided
  const [internalArtifacts, setInternalArtifacts] = useState<UIArtifact[]>([]);
  const [internalTasks, setInternalTasks] = useState<UIPlanTask[]>([]);
  const [internalLogs, setInternalLogs] = useState<UILog[]>([]);

  // Resolve active state (prop or internal)
  const activeArtifacts = artifacts || internalArtifacts;
  const setArtifactsState = setArtifacts || setInternalArtifacts;
  const activeTasks = tasks || internalTasks;
  const setTasksState = setTasks || setInternalTasks;
  const activeLogs = logs || internalLogs;
  const setLogsState = setLogs || setInternalLogs;

  const welcomeMsg: Message = {
    id: 'welcome',
    role: 'assistant',
    content: `Hola, soy **Genesis AI**. Estoy listo para construir contigo. Dime qué tienes en mente hoy.`,
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
  const [isPlusMenuOpen,   setIsPlusMenuOpen]   = useState(false);
  const [isArchitectMode,  setIsArchitectMode]  = useState(false);
  const [isAutoFixing,     setIsAutoFixing]     = useState(false);
  const [pendingPlanPrompt, setPendingPlanPrompt] = useState<string | null>(null);

  const messagesEndRef    = useRef<HTMLDivElement>(null);
  const containerRef      = useRef<HTMLDivElement>(null);
  const inputRef          = useRef<HTMLTextAreaElement>(null);
  const fileInputRef      = useRef<HTMLInputElement>(null);
  const isFirstGen        = useRef(true);
  const streamBufferRef   = useRef('');   
  const genPhaseRef = useRef<AgentPhase>('idle');

  // Helper to update phase and notify parent
  const updatePhase = useCallback((phase: AgentPhase, specialist: AgentSpecialist = 'none') => {
    genPhaseRef.current = phase;
    onPhaseChange?.(phase, specialist);
  }, [onPhaseChange]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const hasTriggeredInitial = useRef(false);
  const autoFixCountRef   = useRef(0);
  const lastAutoFixError  = useRef('');
  const errorHistoryRef   = useRef<string[]>([]);

  // ─── Phase 1: Main Code Generation Logic ───────────────────────────────────
  const generateCode = useCallback(async (
    prompt: string,
  ): Promise<{ files: Record<string, StudioFile>; explanation: string; stack: string[]; deps: string[]; suggestions: string[]; isChatOnly?: boolean } | null> => {
    setIsGenerating(true);
    onGeneratingChange?.(true);
    updatePhase('thinking');
    setStreamChars(0);
    setGenPhase('thinking');
    streamBufferRef.current = '';
    setStreamingContent(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const intent = detectIntent(prompt);
    
    // FETCH AND INJECT AGENT PREFERENCES
    const prefContext = preferences.map(p => `[MEMORIA ${p.agent_id.toUpperCase()}]: ${p.instructions}`).join('\n');
    const dynamicSystem = intent === 'chat' 
      ? (persona === 'antigravity' ? ANTIGRAVITY_CHAT_SYSTEM : GENESIS_CHAT_SYSTEM)
      : (isArchitectMode ? `${ARCHITECT_SYSTEM_PROMPT}\n\n${prefContext}` : `${CODE_GEN_SYSTEM}\n\n${prefContext}`);

    const isChatModeActive = intent === 'chat';
    const isArchitectRequest = isArchitectMode && !isChatModeActive;
    setCurrentGenIntent(isArchitectRequest ? 'chat' : (isChatModeActive ? 'chat' : 'codegen'));

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

      let contextBlock = mentionBlock;
      if (isChatModeActive && fileKeys.length > 0 && !mentionBlock) {
        contextBlock = `\n\n[PROYECTO ACTIVO]\nArchivos: ${fileKeys.join(', ')}\n${activeFile ? `\n[ARCHIVO ACTUALMENTE ABIERTO - PRIORIDAD DE EDICIÓN]: ${activeFile}\nCONTENIDO DE ${activeFile}:\n${projectFiles[activeFile]?.content || ''}\n` : ''}\nContenido relevante:\n` +
          fileKeys.slice(0, 3).map(f => `// ${f}\n${projectFiles[f].content.slice(0, 600)}`).join('\n\n');
      } else if (!isChatModeActive && fileKeys.length > 0) {
        contextBlock += '\n\nARCHIVOS ACTUALES DEL PROYECTO:\n' +
          fileKeys.map(f => `--- ${f} ---\n${projectFiles[f].content.slice(0, 3000)}`).join('\n\n') +
          (activeFile ? `\n\n[ARCHIVO ACTUALMENTE ABIERTO]: ${activeFile}` : '');
      }

      let cloneBlock = '';
      let effectiveSystemPrompt = isArchitectRequest
        ? ARCHITECT_SYSTEM_PROMPT
        : (isChatModeActive 
          ? (persona === 'antigravity' ? ANTIGRAVITY_CHAT_SYSTEM : GENESIS_CHAT_SYSTEM)
          : dynamicSystem);

      if (pendingUrl) {
        const parsedClone = JSON.parse(pendingUrl);
        const cloneUrl = parsedClone.url;
        const cloneMd  = parsedClone.content || parsedClone.markdown || '';
        const colors   = parsedClone.colors && parsedClone.colors.length > 0 ? `\n[COLORES EXTRAÍDOS]: ${parsedClone.colors.join(', ')}` : '';
        const fonts    = parsedClone.fonts && parsedClone.fonts.length > 0 ? `\n[TIPOGRAFÍA EXTRAÍDA]: ${parsedClone.fonts.join(', ')}` : '';
        const sitemap  = parsedClone.sitemap && parsedClone.sitemap.length > 0 ? `\n[RUTAS/SITEMAP RECOMENDADO]: ${parsedClone.sitemap.join(', ')}` : '';

        // Always force codegen mode when a URL is attached
        effectiveSystemPrompt = CLONE_SYSTEM_PROMPT + cloneMd + colors + fonts + sitemap;
        cloneBlock = `\n\n[URL OBJETIVO A CLONAR]: ${cloneUrl}\n[INSTRUCCIÓN DEL USUARIO]: ${prompt}`;
        setPendingUrl(null); 
      }

      const currentModel = MODELS.find(m => m.id === selectedModel) ?? MODELS[0];
      const userContent: any = (pendingImage && currentModel.vision && !isChatModeActive)
        ? [{ type: 'image_url', image_url: { url: pendingImage } }, { type: 'text', text: (cloneBlock || prompt) + contextBlock }]
        : (cloneBlock || prompt) + contextBlock;

      const supabaseContext = supabaseConfig
        ? `\n\nSUPABASE CONECTADO AL PROYECTO:\n- URL: ${supabaseConfig.url}\n- Anon Key: ${supabaseConfig.anonKey}\nUSA window.supabaseClient (ya inicializado) para todas las operaciones de base de datos. NO importes ni crees el cliente, ya está disponible globalmente.`
        : '';
        
      const systemPrompt = cloneBlock
        ? effectiveSystemPrompt 
        : (isChatModeActive ? effectiveSystemPrompt : effectiveSystemPrompt + supabaseContext);

      const modelToUse = (isChatModeActive && !cloneBlock)
        ? 'google/gemini-2.0-flash-001'
        : selectedModel;

      const historySlice = convHistory.slice(-10);
      const messages = [
        { role: 'system', content: systemPrompt },
        ...historySlice,
        { role: 'user',   content: userContent },
      ];

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? '';

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
        updatePhase('idle');
        return null;
      }

      const contentType = res.headers.get('content-type') ?? '';

      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data?.error) { toast.error(data.error); updatePhase('idle'); return null; }
        const rawText: string = data?.choices?.[0]?.message?.content ?? '';
        updatePhase('idle');
        if (isChatModeActive) return { files: {}, explanation: rawText, stack: [], deps: [], suggestions: [], isChatOnly: true };
        return processRaw(rawText, prompt);
      }

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
                if (genPhaseRef.current !== 'generating') {
                  updatePhase('generating', 'frontend'); // Default to frontend for streaming
                }

                // Real-time agent detection from stream
                if (accumulated.includes('[UX_ENGINE]')) updatePhase('generating', 'ux');
                if (accumulated.includes('[FRONTEND_DEV]')) updatePhase('generating', 'frontend');
                if (accumulated.includes('[BACKEND_DEV]')) updatePhase('generating', 'backend');
                if (accumulated.includes('[DEVOPS_SYNC]')) updatePhase('generating', 'devops');
                if (accumulated.includes('[GAME_ENGINE]')) updatePhase('generating', 'game');
                setGenPhase('streaming');

                if (isChatModeActive) {
                  streamBufferRef.current = accumulated;
                }
              }
            } catch { /* skip partial chunk */ }
          }
        }
      } finally {
        reader.cancel();
      }

      if (streamError) { toast.error(streamError); updatePhase('idle'); return null; }
      if (isChatModeActive) { updatePhase('idle'); return { files: {}, explanation: accumulated, stack: [], deps: [], suggestions: [], isChatOnly: true }; }
      return processRaw(accumulated, prompt);

    } catch (e: any) {
      if (e.name === 'AbortError') {
        toast.info('Generación detenida');
      } else {
        const msg = e?.message || String(e);
        console.error('[Genesis] error:', msg);
        toast.error(msg.length > 120 ? msg.slice(0, 120) + '…' : msg, { duration: 6000 });
      }
      updatePhase('idle');
      return null;
    } finally {
      setIsGenerating(false);
      onGeneratingChange?.(false);
      setStreamChars(0);
      if (streamBufferRef.current) setStreamingContent(streamBufferRef.current);
      setGenPhase('done');
      updatePhase('idle');
      setTimeout(() => {
        setGenPhase('idle');
        setStreamingContent(null);
        streamBufferRef.current = '';
        setCurrentGenIntent(null);
      }, 400);
    }
  }, [projectFiles, selectedModel, convHistory, pendingImage, supabaseConfig, activeFile, isArchitectMode, onGeneratingChange, onStreamCharsChange, persona, pendingUrl, updatePhase, preferences]);

  const processRaw = (rawText: string, prompt: string) => {
    if (!rawText) { toast.error('La IA devolvió una respuesta vacía.'); return null; }
    const extracted = extractJson(rawText);
    if (!extracted) {
      return { files: {} as Record<string, StudioFile>, explanation: rawText, stack: [], deps: [], suggestions: [], isChatOnly: true };
    }
    if (!extracted.files || typeof extracted.files !== 'object') { toast.error('Respuesta incompleta. Intenta de nuevo.'); return null; }

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

  // ─── Side Effects ──────────────────────────────────────────────────────────

  // Auto-correción Loop (Genesis Architect)
  useEffect(() => {
    if (!previewError || isGenerating || !user) return;
    if (previewError === lastAutoFixError.current) return; 
    
    if (autoFixCountRef.current >= 3) {
      toast.error('Genesis no pudo corregir el error automáticamente tras 3 intentos.', {
        description: 'Por favor, revisa el código o proporciona más detalles del error.'
      });
      return;
    }

    const newLog: UILog = {
      id: crypto.randomUUID(),
      type: 'error',
      message: previewError,
      timestamp: new Date(),
      source: 'Sandpack Runtime'
    };
    setLogsState(prev => [newLog, ...prev]);

    updatePhase('fixing');
    const timer = setTimeout(async () => {
      lastAutoFixError.current = previewError;
      autoFixCountRef.current += 1;
      errorHistoryRef.current.push(previewError); 
      
      setIsAutoFixing(true);
      onToggleArtifacts?.(); 

      setLogsState(prev => [{
        id: crypto.randomUUID(),
        type: 'info',
        message: `🤖 Iniciando Bucle de Auto-corrección (Intento #${autoFixCountRef.current}/3)...`,
        timestamp: new Date(),
        source: 'Genesis IA'
      }, ...prev]);

      const fileContext = Object.keys(projectFiles).map(f => `• ${f} (${projectFiles[f].language})`).join('\n');
      const errorHistoryFormatted = errorHistoryRef.current.map((err, idx) => `Error de Intento #${idx+1}:\n${err}`).join('\n\n');
      
      const fixPrompt = `[AUTO-FIX LOOP - INTENTO #${autoFixCountRef.current}/3]
      
CONTEXTO DEL PROYECTO:
${fileContext}

HISTORIAL DE ERRORES (APRENDIZAJE):
${errorHistoryFormatted}

TAREA: Analiza la causa raíz del error actual basándote en los intentos fallidos previos. 
Corrige el código de los archivos necesarios para eliminar este error y asegurar que el preview renderice correctamente. 
Asegúrate de NO repetir las mismas soluciones que fallaron anteriormente.`;

      try {
        const result = await generateCode(fixPrompt);
        if (result && result.files && Object.keys(result.files).length > 0) {
          const mergedFiles = { ...projectFiles, ...result.files };
          onCodeGenerated(mergedFiles);
          
          setLogsState(prev => [{
            id: crypto.randomUUID(),
            type: 'success',
            message: `✅ Intento #${autoFixCountRef.current} completado. Archivos actualizados: ${Object.keys(result.files).join(', ')}`,
            timestamp: new Date(),
            source: 'Genesis Fixer'
          }, ...prev]);
        }
      } catch (err) {
        setLogsState(prev => [{
          id: crypto.randomUUID(),
          type: 'error',
          message: `Fallo en el intento de corrección #${autoFixCountRef.current}: ${String(err)}`,
          timestamp: new Date(),
          source: 'System'
        }, ...prev]);
      } finally {
        setIsAutoFixing(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [previewError, isGenerating, user, projectFiles, onCodeGenerated, generateCode]);

  // Reset auto-fix counter when project files change
  useEffect(() => {
    autoFixCountRef.current = 0;
    lastAutoFixError.current = '';
    errorHistoryRef.current = [];
  }, [Object.keys(projectFiles).length]);

  // Persist chat per project
  useEffect(() => {
    if (!projectId) return;
    const key = `genesis-chat-${projectId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed: Message[] = JSON.parse(saved);
        setMessages(parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
        isFirstGen.current = parsed.filter(m => m.role === 'user').length === 0;
      } catch (e) {
        console.error("Error loading chat history:", e);
      }
    }
  }, [projectId]);

  // Extract artifacts & tasks
  useEffect(() => {
    const newArtifacts: UIArtifact[] = [];
    const newTasks: UIPlanTask[] = [];

    messages.forEach(m => {
      const mermaidMatches = m.content.matchAll(/```mermaid\n?([\s\S]*?)```/g);
      for (const match of mermaidMatches) {
        newArtifacts.push({
          id: crypto.randomUUID(),
          type: 'mermaid',
          title: 'Arquitectura Sugerida',
          content: match[1].trim()
        });
      }

      const taskMatches = Array.from(m.content.matchAll(/^\[( |x|X|\/)\] (.+)$/gm));
      for (const match of taskMatches) {
        const symbol = (match[1] as string).toLowerCase();
        newTasks.push({
          id: crypto.randomUUID(),
          text: (match[2] as string).trim(),
          status: symbol === 'x' ? 'completed' : symbol === '/' ? 'in-progress' : 'pending'
        });
      }
    });

    if (streamingContent) {
      const mermaidMatches = streamingContent.matchAll(/```mermaid\n?([\s\S]*?)```/g);
      for (const match of mermaidMatches) {
        newArtifacts.push({ id: crypto.randomUUID(), type: 'mermaid', title: 'Arquitectura (Generando...)', content: match[1].trim() });
      }
      const taskMatches = Array.from(streamingContent.matchAll(/^\[( |x|X|\/)\] (.+)$/gm));
      for (const match of taskMatches) {
        const symbol = (match[1] as string).toLowerCase();
        newTasks.push({ id: crypto.randomUUID(), text: (match[2] as string).trim(), status: symbol === 'x' ? 'completed' : symbol === '/' ? 'in-progress' : 'pending' });
      }
    }

    setArtifactsState(newArtifacts);
    setTasksState(newTasks);
  }, [messages, streamingContent, setArtifactsState, setTasksState]);
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
    updatePhase('idle');
    setStreamingContent(null);
  };

  // ─── File Handlers ────────────────────────────────────────────────────────
  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPendingImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    toast.success('Imagen adjuntada');
  };

  const handleTextFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPendingContext({
        name: file.name,
        content: e.target?.result as string
      });
      toast.success(`Archivo "${file.name}" cargado como contexto`);
    };
    reader.readAsText(file);
  };

  const handleAttachUrl = async () => {
    if (!urlInput) return;
    setIsScraping(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? '';
      const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ url: urlInput })
      });
      const data = await response.json();
      setPendingContext({ name: data.title || urlInput, content: data.content });
      toast.success('Contenido web adjuntado');
      setShowUrlInput(false);
      setUrlInput('');
    } catch (err) {
      toast.error('Error al capturar la URL');
    } finally {
      setIsScraping(false);
    }
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

    // ── ARCHITECT MODE: if codegen intent + architect mode → plan first ────
    const shouldPlan = isArchitectMode && intent === 'codegen' && !pendingPlanPrompt;

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

      // ── ARCHITECT MODE: Show plan card instead of generating code ──────
      if (shouldPlan && result?.isChatOnly && result.explanation) {
        assistantMsg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.explanation,
          timestamp: new Date(),
          type: 'plan',
          planStatus: 'pending',
          originalPrompt: text,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setPendingContext(null);
        return; // Don't proceed to code gen yet
      }

      if (result?.isChatOnly) {
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
          ...(chatFiles ? { files: Object.keys(chatFiles), type: 'code' as const } : {}),
        };
        setConvHistory(prev => [
          ...prev,
          { role: 'user' as const,      content: text },
          { role: 'assistant' as const, content: result.explanation },
        ].slice(-16));
      } else if (result?.files && Object.keys(result.files).length > 0) {
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

  const handleScroll = () => {
    if (containerRef.current) {
      setShowScrollBtn(containerRef.current.scrollTop > 400);
    }
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

                <div className={`px-7 py-6 rounded-[32px] rounded-tl-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] animate-in fade-in slide-in-from-left-4 duration-500 relative group/msg ${msg.type === 'plan' ? 'bg-gradient-to-br from-indigo-50 to-violet-50 border-2 border-indigo-200' : 'bg-white border border-zinc-200/80'}`}>
                  {/* Plan Card Header */}
                  {msg.type === 'plan' && (
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-indigo-200/50">
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-700">Modo Arquitecto</span>
                        <span className="block text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Plan de Implementación</span>
                      </div>
                      {msg.planStatus === 'pending' && (
                        <span className="ml-auto px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest animate-pulse">Pendiente</span>
                      )}
                      {msg.planStatus === 'approved' && (
                        <span className="ml-auto px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest">✓ Aprobado</span>
                      )}
                      {msg.planStatus === 'rejected' && (
                        <span className="ml-auto px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-widest">✗ Rechazado</span>
                      )}
                    </div>
                  )}

                  <div className="prose prose-zinc max-w-none prose-sm font-medium"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />

                  {/* Plan Card Action Buttons */}
                  {msg.type === 'plan' && msg.planStatus === 'pending' && (
                    <div className="flex items-center gap-3 mt-6 pt-5 border-t border-indigo-200/50">
                      <button
                        onClick={async () => {
                          // Mark as approved
                          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, planStatus: 'approved' as const } : m));
                          // Now generate the actual code with architect mode temporarily disabled
                          const origArchitect = isArchitectMode;
                          setIsArchitectMode(false);
                          setPendingPlanPrompt(msg.originalPrompt || '');
                          await handleSend(msg.originalPrompt || '');
                          setPendingPlanPrompt(null);
                          setIsArchitectMode(origArchitect);
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[11px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-95"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Aprobar y Generar
                      </button>
                      <button
                        onClick={() => {
                          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, planStatus: 'rejected' as const } : m));
                          toast.info('Plan rechazado. Puedes hacer ajustes y volver a pedir.');
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-zinc-200 bg-white text-zinc-500 text-[11px] font-black uppercase tracking-widest hover:border-rose-200 hover:text-rose-500 transition-all active:scale-95"
                      >
                        <XCircle className="h-4 w-4" />
                        Rechazar
                      </button>
                    </div>
                  )}

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
                {isAutoFixing ? '🔧 Auto-corrigiendo error detectado...' : 'Realizando Análisis Estratégico...'}
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

        <div className="max-w-4xl mx-auto w-full relative">
          {/* Plus Menu Popover */}
          {isPlusMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsPlusMenuOpen(false)} />
              <div className="absolute left-0 bottom-full mb-3 w-64 rounded-2xl bg-white border border-zinc-200 shadow-2xl z-50 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                <div className="p-3 border-b border-zinc-100 italic text-[10px] text-zinc-400 font-medium">Adjuntar recurso...</div>
                
                <button onClick={() => { setIsPlusMenuOpen(false); fileInputRef.current?.click(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition-colors group">
                  <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                    <Paperclip className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-zinc-900">Adjuntar Archivo</span>
                    <span className="text-[10px] text-zinc-400">Imagen, Código o Texto</span>
                  </div>
                </button>


                <button onClick={() => { setIsPlusMenuOpen(false); setShowUrlInput(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition-colors group border-t border-zinc-50">
                  <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-zinc-900">Clonar URL</span>
                    <span className="text-[10px] text-zinc-400">Importar sitio web</span>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* Main Centric Bar */}
          <div className={`flex items-center gap-2 p-2 rounded-[28px] bg-white border shadow-sm focus-within:ring-4 transition-all ${isArchitectMode ? 'border-indigo-200 focus-within:ring-indigo-100/50 focus-within:border-indigo-300' : 'border-zinc-200 focus-within:ring-primary/5 focus-within:border-primary/20'}`}>
            {/* Plus Trigger */}
            <button
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
              className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${isPlusMenuOpen ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50'}`}
            >
              <Plus className={`h-5 w-5 transition-transform duration-300 ${isPlusMenuOpen ? 'rotate-45' : ''}`} />
            </button>

            {/* Input Textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Describe qué quieres construir..."
              className="flex-1 bg-transparent px-2 py-3 text-[14px] text-foreground placeholder:text-zinc-300 outline-none resize-none min-h-[44px] max-h-[350px] leading-relaxed"
              disabled={isGenerating}
              rows={1}
            />

            {/* Right Controls */}
            <div className="flex items-center gap-1 pr-1">
              {/* Architect Mode Toggle */}
              <button
                onClick={() => setIsArchitectMode(!isArchitectMode)}
                title={isArchitectMode ? 'Modo Arquitecto activado — planifica antes de generar' : 'Activar Modo Arquitecto'}
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${isArchitectMode ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-200' : 'text-zinc-300 hover:text-zinc-900 hover:bg-zinc-50'}`}
              >
                <Shield className="h-4 w-4" />
              </button>

              {/* Mic Icon */}
              <button className="h-10 w-10 rounded-full flex items-center justify-center text-zinc-300 hover:text-zinc-900 transition-colors">
                <Mic className="h-4 w-4" />
              </button>

              {/* Send / Stop */}
              {isGenerating ? (
                <button
                  onClick={handleStop}
                  className="h-10 w-10 rounded-full flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-100 transition-all"
                >
                  <div className="h-3 w-3 rounded-sm bg-rose-500 animate-pulse" />
                </button>
              ) : (
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="h-10 w-10 rounded-full flex items-center justify-center bg-zinc-50 text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-zinc-50 disabled:hover:text-zinc-300"
                >
                  <ArrowUp className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Model selector — repositioned below as a floating chip */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2">
            <button
              onClick={() => setModelOpen(!modelOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-zinc-200 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 hover:shadow-lg transition-all"
            >
              <Sparkles className="h-3 w-3 text-primary/60" />
              <span>{currentModel.label}</span>
              <ChevronDown className={`h-2.5 w-2.5 transition-transform ${modelOpen ? 'rotate-180' : ''}`} />
            </button>

            {modelOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setModelOpen(false)} />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-72 rounded-2xl overflow-hidden z-50 bg-white border border-zinc-200 shadow-2xl">
                  <p className="px-4 pt-3 pb-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">IA Engine</p>
                  {MODELS.map(m => (
                    <button key={m.id} onClick={() => { setSelectedModel(m.id); setModelOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all hover:bg-zinc-50 ${
                        selectedModel === m.id ? 'bg-primary/5 text-zinc-900 font-bold' : 'text-zinc-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {m.premium && <Lock className="h-2.5 w-2.5 text-amber-500 shrink-0" />}
                        <span className="text-[12px]">{m.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {m.vision && <span className="text-[9px] text-emerald-500">👁</span>}
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${m.premium ? 'text-amber-600' : 'text-emerald-600'}`}>{m.badge.split(' ')[0]}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
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

      {/* Hidden file input — Universal support */}
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/*,.txt,.js,.ts,.tsx,.css,.html,.json,.md,.py,.go,.sh,.sql,.yaml,.yml"
        className="hidden"
        onChange={(e) => { 
          const f = e.target.files?.[0]; 
          if (!f) return;
          if (f.type.startsWith('image/')) handleImageFile(f);
          else handleTextFile(f);
          e.target.value = ''; 
        }}
      />
    </div>
  );
}

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${className}`}>
      {children}
    </span>
  );
}
