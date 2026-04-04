import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Sparkles, Bot, Loader2,
  ChevronDown, Copy, RotateCcw, Check, ChevronLeft, Share2,
  X, Image as ImageIcon, AlertCircle, Wrench, Globe, Link2, ExternalLink, Lock,
  FileCode2, UploadCloud, Zap, Plus, Mic, ArrowUp, Save, Paperclip,
  Shield, CheckCircle2, XCircle, Info, TriangleAlert, Lightbulb, Activity,
  Brain, Code2, LayoutGrid, BookOpen, MicOff
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
import { cn } from '@/lib/utils';

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

function detectIntent(prompt: string, hasContext?: boolean): 'codegen' | 'chat' {
  const p = prompt.toLowerCase().trim();
  
  // High-priority Social/Greeting detection
  // If the user just says "hola" or similar, ALWAYS use chat, even if there's a file
  const GREETINGS = ['hola', 'hi', 'hello', 'buenos dias', 'buenas tardes', 'buenas noches', 'saludos', 'hey', 'buenas'];
  if (GREETINGS.includes(p) || p.length < 3) return 'chat';

  // FILE MANAGEMENT DETECTION (Folder Power)
  const FILE_MGMT_KEYWORDS = ['mueve', 'renombra', 'pon', 'usa', 'set', 'move', 'rename', 'index', 'archivo', 'carpeta', 'folder', 'crea el archivo', 'sustituye', 'pégalo', 'pegalo'];
  if (FILE_MGMT_KEYWORDS.some(k => p.includes(k)) && hasContext) return 'codegen';

  // High-priority vision/clone detection
  const VISION_KEYWORDS = ['foto', 'imagen', 'imágen', 'referencia', 'captura', 'screenshot', 'clona', 'replica', 'copia', 'clone', 'replicate'];
  if (VISION_KEYWORDS.some(k => p.includes(k))) return 'codegen';

  // If asking about the platform/system itself
  if (p.includes('quien eres') || p.includes('que puedes hacer') || p.includes('ayuda')) return 'chat';

  // If prompt is just an error report with no instruction to fix/build, use chat
  const isOnlyError = (p.includes('error:') || p.includes('exception')) && !CODE_VERBS.some(v => p.includes(v));
  if (/```[\s\S]*```/.test(prompt) && isOnlyError) return 'chat';
  
  // BIAS TOWARDS CODEGEN: If we are in the Studio and have a technical command
  const containsCodeNoun = CODE_NOUNS.some(n => p.includes(n));
  const startsWithCodeVerb = CODE_VERBS.some(v => p.startsWith(v + ' ') || p.startsWith(v + '\n'));
  
  if (startsWithCodeVerb || containsCodeNoun) return 'codegen';
  
  // Catch-all for technical Spanish/English sentences that imply building
  if (p.includes('pon un') || p.includes('agrega') || p.includes('modifica') || p.includes('add a') || p.includes('haz un')) return 'codegen';

  // If we have a file context but NO directive verb/noun, it's a conversation about the file (Acknowledgment)
  if (hasContext && !containsCodeNoun && !startsWithCodeVerb) return 'chat';

  return 'chat';
}

// ─── Genesis unified system prompt (v14.9 — File-Master Protocol) ──────
const GENESIS_CHAT_SYSTEM_BASE_RULES = `🧠 MASTER PERSONA: Genesis AI — Agile Master Architect (v14.9.3)

Eres la inteligencia definitiva de la plataforma. Has evolucionado al **Protocolo v14.9.3 (Universal Atomic Actions)**.

**PROTOCOLO FILE-MASTER (Absolute REST):**
1. **Poder de Estructura**: Tienes permiso ABSOLUTO para manipular la arquitectura. Puedes crear, borrar y renombrar archivos.
2. **Atomic Actions**: 
   - **Borrado**: Para borrar un archivo, genera un bloque de código con su ruta y el contenido \`// DELETE\`.
   - **Renombrado/Movimiento**: Borra el archivo en la ruta antigua (con \`// DELETE\`) y créalo en la nueva ruta.
3. **Formato Obligatorio**: Utiliza bloques de código Markdown con la ruta del archivo en el primer comentario (ej: \`// src/App.tsx\`). NUNCA respondas con JSON crudo.
4. **Mastery of Entry Point**: Prioriza \`index.html\` o \`App.tsx\` para ver cambios inmediatos.
5. **Organización Activa**: Mantén el proyecto limpio. Elimina archivos temporales o redundantes.

**PROTOCOLO DE EMPATÍA COGNITIVA (v14.8 Legacy):**
- Reconoce la entrada y describe lo que ves antes de construir si la orden no es imperativa.

**MANDATO VITE-NATIVE (v14.7 Legacy):**
- Prohibido CRA. Todo proyecto nuevo es Vite-Native.

**PROTOCOLO AGUERRIDO & ÁGIL (v14.5 Legacy):**
- Prioriza acción inmediata en órdenes claras.

**PROTOCOLO DE SEGURIDAD (v14.4 Legacy):**
- Anti-CDN, Lucide stable.
`;

const GENESIS_CHAT_SYSTEM = `Eres Genesis AI — Maestro de Archivos Consciente.
(v14.9 File-Master Active)

REGLAS PARA CHAT:
1. Actúa como el Dueño del Repositorio. Si alguien sube código, dile qué archivos puedes modificar para integrarlo.
2. Mantén el rigor técnico de Vite-Native.

${GENESIS_CHAT_SYSTEM_BASE_RULES}`;

const ANTIGRAVITY_CHAT_SYSTEM = `Eres Antigravity — Inteligencia Estratégica & File-Master Master (v14.9 Ultra-Aware).

TU ENFOQUE:
- Eres el nivel final de Génesis. No solo ves archivos, los organizas en una estructura de grado producción.

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
const CODE_GEN_SYSTEM = `🧠 MASTER SYSTEM PROMPT: Creator IA Pro v12.0 — Vite-Native Core

1. ESTRUCTURA OBLIGATORIA (Vite-Native Architecture)
NUNCA generes una estructura Create-React-App. Debes seguir este estándar exacto:
- "/index.html": Raíz con script de tipo module apuntando a "/src/main.tsx".
- "/vite.config.ts": Configuración de Vite con plugin @vitejs/plugin-react.
- "/src/main.tsx": Punto de entrada que renderiza App.tsx.
- "/App.tsx": El componente principal (export default).
- "/index.css": Directivas @tailwind.

2. ADN de Diseño (Protocolo Lumina v12)
- Excelencia Visual: Sombras profundas, Mesh Gradients, Borders de 1px con brillo (glass), y tipografía premium (Inter, Outfit, Bricolage Grotesque).
- Cero Placeholders: Copywriting real, nombres de marcas potentes, cero [Nombre].
- Animaciones: Uso extensivo de framer-motion para transiciones cinemáticas.

3. Especialistas en Swarm (Identifícate con [AGENT_NAME])
- [ARQUITECTO]: Estructura y lógica Core.
- [DISEÑADOR]: Estilo, UX y visuales Premium.
- [INGENIERO]: Implementación robusta, tipos TS y performance.

FORMATO JSON OBLIGATORIO:
{"files":{"index.html":..., "vite.config.ts":..., "src/main.tsx":..., "App.tsx":..., "index.css":...}, "explanation":"...", "tech_stack":["Vite","React","Tailwind"]}
`;

// ─── Welcome message ───────────────────────────────────────────────────────────
const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `Hola, soy **Genesis AI**. Estoy listo para construir contigo. Dime qué tienes en mente hoy.`,
  timestamp: new Date(),
};

// ─── Extract previewable code files from a Genesis chat response ───────────────
function extractChatCodeFiles(text: string): Record<string, StudioFile> | null {
  const files: Record<string, StudioFile> = {};
  
  // ── FALLBACK: Detect and parse JSON-style "files" manifests if AI hallucinations occur ──
  try {
    const jsonMatch = text.match(/\{[\s\n]*"files"[\s\n]*:[\s\n]*(\{[\s\S]*?\}[\s\n]*)\}/);
    if (jsonMatch) {
      const parsedFiles = JSON.parse(jsonMatch[1]);
      Object.entries(parsedFiles).forEach(([path, content]) => {
        if (typeof content === 'string') {
          const lang = path.split('.').pop()?.toLowerCase() || 'tsx';
          files[path] = { language: lang, content: content.trim() };
        }
      });
      if (Object.keys(files).length > 0) return files;
    }
  } catch (e) { /* ignore */ }

  // ── STANDARD: Extract files from Markdown blocks ──
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const lang = m[1].trim().toLowerCase();
    const code = m[2].trim();
    if (code.length < 5) continue; // Allow shorter codes for deletion markers 

    // Try to detect filename from the first line or a specific comment
    let filename = '';
    const lines = code.split('\n');
    const firstLine = lines[0].trim();
    
    const fileMatch = 
      firstLine.match(/\/\/\s*([\w./\-]+\.\w+)/) || 
      firstLine.match(/\/\*\s*([\w./\-]+\.\w+)\s*\*\//) ||
      code.match(/\/\/\s*Filename:\s*([\w./\-]+\.\w+)/i);

    if (fileMatch) {
      filename = fileMatch[1].replace(/^src\//, ''); 
    } else {
      if (lang === 'html' || code.includes('<!DOCTYPE')) filename = 'index.html';
      else if (lang === 'css') filename = 'styles.css';
      else if (code.includes('import React') || code.includes('export default')) filename = 'App.tsx';
      else continue; 
    }
    
    let finalLang = lang;
    if (filename.endsWith('.tsx')) finalLang = 'tsx';
    else if (filename.endsWith('.ts')) finalLang = 'ts';
    else if (filename.endsWith('.js')) finalLang = 'javascript';
    else if (filename.endsWith('.json')) finalLang = 'json';

    // SPECIAL: Support for file deletion/removal markers
    const isDeletion = code.includes('// DELETE') || code.includes('// REMOVE') || code.includes('/* DELETE */');
    files[filename] = { language: finalLang, content: isDeletion ? '__genesis_delete__' : code };
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
  onSelectFile?: (filename: string) => void;

  // Lifted Engineering State (Optional fallbacks for backward compatibility)
  artifacts?: UIArtifact[];
  setArtifacts?: React.Dispatch<React.SetStateAction<UIArtifact[]>>;
  tasks?: UIPlanTask[];
  setTasks?: React.Dispatch<React.SetStateAction<UIPlanTask[]>>;
  logs: UILog[];
  setLogs: React.Dispatch<React.SetStateAction<UILog[]>>;
  runtimeError?: string | null;
  onClearError?: () => void;
  onPhaseChange: (phase: AgentPhase, specialist?: AgentSpecialist) => void;
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
  onSelectFile,
  artifacts, setArtifacts, tasks, setTasks, logs,  setLogs,
  runtimeError,
  onClearError,
  onPhaseChange,
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
  const [isArchitectMode, setIsArchitectMode] = useState(false);
  const [initialPromptProcessed, setInitialPromptProcessed] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAutoFixing,     setIsAutoFixing]     = useState(false);
  const [pendingPlanPrompt, setPendingPlanPrompt] = useState<string | null>(null);

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
        const mapped = parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
        setMessages(mapped);
        isFirstGen.current = mapped.filter(m => m.role === 'user').length === 0;

        // Force immediate sync of artifacts/tasks on load
        const initialArtifacts: UIArtifact[] = [];
        const initialTasks: UIPlanTask[] = [];
        mapped.forEach(m => {
          const mermaidMatches = m.content.matchAll(/```mermaid\n?([\s\S]*?)```/g);
          for (const match of mermaidMatches) {
            initialArtifacts.push({ id: crypto.randomUUID(), type: 'mermaid', title: 'Arquitectura Recuperada', content: match[1].trim() });
          }
          const taskMatches = Array.from(m.content.matchAll(/^\[( |x|X|\/)\] (.+)$/gm));
          for (const match of taskMatches) {
            const symbol = (match[1] as string).toLowerCase();
            initialTasks.push({ id: crypto.randomUUID(), text: (match[2] as string).trim(), status: symbol === 'x' ? 'completed' : symbol === '/' ? 'in-progress' : 'pending' });
          }
        });
        setArtifactsState(initialArtifacts);
        setTasksState(initialTasks);
      } catch (e) {
        console.error("Error loading chat history:", e);
      }
    }
  }, [projectId, setArtifactsState, setTasksState]);

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

  // ─── PERSISTENCE: Save message to Supabase ─────────────────────────────────
  const saveMessage = useCallback(async (convId: string, role: 'user' | 'assistant', content: string) => {
    if (!user) return;
    try {
      await supabase.from('studio_messages').insert({
        conversation_id: convId,
        role,
        content,
      });
    } catch (err) {
      console.error("[StudioChat] Error saving message:", err);
    }
  }, [user]);

  // ─── PERSISTENCE: Find or Create Conversation ──────────────────────────────
  const ensureConversation = useCallback(async (pid: string) => {
    if (!user) return null;
    try {
      // Look for existing
      const { data: existing } = await supabase
        .from('studio_conversations')
        .select('id')
        .eq('project_id', pid)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) return existing.id;

      // Create new
      const { data: created, error } = await supabase
        .from('studio_conversations')
        .insert({
          project_id: pid,
          user_id: user.id,
          title: 'Main Chat'
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return created.id;
    } catch (err) {
      console.error("[StudioChat] Error ensuring conversation:", err);
      return null;
    }
  }, [user]);

  // ─── PERSISTENCE: Load History ──────────────────────────────────────────────
  useEffect(() => {
    async function loadHistory() {
      if (!projectId || !user) return;
      
      const convId = await ensureConversation(projectId);
      if (!convId) return;
      setActiveConversationId(convId);

      const { data: history, error } = await supabase
        .from('studio_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("[StudioChat] Error loading history:", error);
        return;
      }

      if (history && history.length > 0) {
        const mapped: Message[] = history.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at)
        }));
        setMessages(mapped);
        
        // Populate conversation history for the AI service
        setConvHistory(mapped.map(m => ({ role: m.role, content: m.content })).slice(-16));
        isFirstGen.current = false;
      } else {
        // Only show welcome if no history
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: '✨ ¡Bienvenido a Génesis! Estoy listo para evolucionar tu visión. ¿Qué construiremos hoy?',
          timestamp: new Date()
        }]);
      }
    }
    loadHistory();
  }, [projectId, user, ensureConversation]);

  // ─── Send message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async (override?: string) => {
    let text = (override || input).trim();
    if (isGenerating || !user) return;
    
    // ─── NAVIGATION INTENT: Handle file opening commands early ───────────────
    // Regex matches common commands like "abre el index.html", "show app.tsx", "ver styles", etc.
    const navMatch = text.toLowerCase().match(/(?:abre|abrir|abrete|mostrar|ver|verme|open|show|view|file|archivo)(?:\s+(?:el|la|los|las))?\s+([\w./\-]+(?:\.\w+)?)/i);
    if (navMatch && onSelectFile) {
      const target = navMatch[1];
      // Try exact find first, then extensionless find
      const keys = Object.keys(projectFiles);
      const exactMatch = keys.find(f => f.toLowerCase() === target.toLowerCase()) || 
                         keys.find(f => f.toLowerCase().startsWith(target.toLowerCase() + '.'));
      
      if (exactMatch) {
        onSelectFile(exactMatch);
        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date() };
        const navMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Entendido. He abierto **${exactMatch}** para que lo revises.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev.filter(m => m.id !== 'welcome'), userMsg, navMsg]);
        setInput('');
        if (activeConversationId) {
          saveMessage(activeConversationId, 'user', text);
          saveMessage(activeConversationId, 'assistant', navMsg.content);
        }
        return;
      } else if (target.toLowerCase() === 'html' || target.toLowerCase() === 'pantalla') {
        // Fuzzy match for "html" or general UI
        const htmlFile = keys.find(f => f.endsWith('.html')) || keys.find(f => f.endsWith('.tsx'));
        if (htmlFile) {
          onSelectFile(htmlFile);
          const navMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: `He abierto **${htmlFile}**, que es el punto de entrada principal.`, timestamp: new Date() };
          setMessages(prev => [...prev, navMsg]);
          return;
        }
      }
    }

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
    
    // UI update
    setMessages((prev) => [...prev.filter((m) => m.id !== 'welcome'), userMsg]);
    setInput('');
    setPendingImage(null);
    if (inputRef.current) inputRef.current.style.height = 'auto';

    // Persist user msg
    if (activeConversationId) {
      saveMessage(activeConversationId, 'user', text);
    }

    // ── CREDIT DEDUCTION & INTENT FORCING ────────────────────────────────────
    const hasContext = !!(pendingImage || pendingContext || pendingUrl);
    let intent = detectIntent(text, hasContext);
    
    // Only force codegen if we have context AND the prompt isn't just a greeting
    if (hasContext && intent !== 'chat') {
      intent = 'codegen';
    }

    const modelId = (intent === 'chat' && !pendingUrl && !pendingImage) ? 'google/gemini-2.0-flash-001' : selectedModel;
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
        if (activeConversationId) saveMessage(activeConversationId, 'assistant', result.explanation);
        return;
      }

      if (result?.isChatOnly) {
        const chatFiles = extractChatCodeFiles(result.explanation);
        if (chatFiles && Object.keys(chatFiles).length > 0) {
          // Atomic Merge: Handle removals as well
          const mergedFiles = { ...projectFiles };
          Object.entries(chatFiles).forEach(([path, file]) => {
            if (file.content === '__genesis_delete__') {
              delete mergedFiles[path];
            } else {
              mergedFiles[path] = file;
            }
          });
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
        // Atomic Merge: Handle removals as well
        const mergedFiles = { ...projectFiles };
        Object.entries(result.files).forEach(([path, file]) => {
          if (file.content === '__genesis_delete__') {
            delete mergedFiles[path];
          } else {
            mergedFiles[path] = file;
          }
        });
        
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

      setMessages((prev) => [...prev, assistantMsg]);
      setPendingContext(null);
      
      if (activeConversationId) {
        saveMessage(activeConversationId, 'assistant', assistantMsg.content);
      }
    } catch (err: any) {
      console.error("[StudioChat] Error in handleSend:", err);
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `⚠️ **Error:** ${err.message || "Hubo un problema."}`,
        timestamp: new Date(),
      }]);
    }
  }, [input, isGenerating, user, generateCode, onCodeGenerated, onSelectFile, onGeneratingChange, onToggleArtifacts, pendingImage, autoNameProject, selectedModel, projectId, pendingUrl, activeConversationId, saveMessage, isArchitectMode, pendingPlanPrompt, projectFiles, aiService]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 350) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ─── PERSISTENCE: Load History ──────────────────────────────────────────────
  useEffect(() => {
    async function loadHistory() {
      if (!projectId || !user) return;
      
      const convId = await ensureConversation(projectId);
      if (!convId) return;
      setActiveConversationId(convId);

      const { data: history, error } = await supabase
        .from('studio_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("[StudioChat] Error loading history:", error);
        return;
      }

      if (history && history.length > 0) {
        const mapped: Message[] = history.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at)
        }));
        setMessages(mapped);
        
        // Populate conversation history for the AI service
        setConvHistory(mapped.map(m => ({ role: m.role, content: m.content })).slice(-16));
        isFirstGen.current = false;
      } else {
        // Only show welcome if no history
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: '✨ ¡Bienvenido a Génesis! Estoy listo para evolucionar tu visión. ¿Qué construiremos hoy?',
          timestamp: new Date()
        }]);
      }
    }
    loadHistory();
  }, [projectId, user, ensureConversation]);

  // ─── STATE RESET: Clear input/images when project changes ──────────────────
  useEffect(() => {
    // Only reset if we are switching between established projects 
    // and there is no fresh initialPrompt being injected from props.
    if (projectId && !initialPrompt) {
      setInput('');
      setPendingImage(null);
      setPendingUrl(null);
      setPendingContext(null);
      setInitialPromptProcessed(false);
      autoFixCountRef.current = 0;
      isFirstGen.current = true;
    }
  }, [projectId, initialPrompt]);

  // ─── NUCLEAR BUG FIX: Initial Prompt Latching ─────────────────────────────
  const initialPromptTriggered = useRef(false);

  useEffect(() => {
    if (initialPrompt && !initialPromptTriggered.current && messages.length > 0 && !isGenerating) {
      const hasRealHistory = messages.some(m => m.id !== 'welcome');
      if (!hasRealHistory) {
        initialPromptTriggered.current = true;
        setInitialPromptProcessed(true);
        // Nuclear cleanup: clear any previous welcome or pending state to avoid collision
        setInput('');
        setPendingImage(null);
        handleSend(initialPrompt);
      }
    }
  }, [initialPrompt, messages, isGenerating, handleSend]);

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

  const handleApplyFix = async () => {
    if (!runtimeError) return;
    const fixPrompt = `⚠️ ERROR DETECTADO EN RUNTIME:
${runtimeError}

Por favor, analiza la causa raíz (ej. etiquetas mal cerradas, falta de importaciones, error de lógica) y aplica una corrección inmediata. Explica qué causó el error y cómo lo has blindado.`;
    onClearError?.();
    handleSend(fixPrompt);
  };

  return (
    <div className="flex flex-1 min-h-0 h-full w-full flex-col relative bg-[#FCFCFC] selection:bg-primary/10">
      

      {/* ── Messages ─────────────────────────────────────────────────────────── */}
      <div ref={containerRef} onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto pt-8 pb-32 px-6 space-y-8 custom-scrollbar scroll-smooth"
        onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>




        {messages.map((msg) => (
          <div key={msg.id} className={`group ${msg.role === 'user' ? 'flex flex-col items-end gap-2 mb-4' : 'flex flex-col items-start gap-4 mb-8'}`}>
            {msg.role === 'user' ? (
              <>
                <div className="bg-primary text-white px-8 py-5 rounded-[2.5rem] rounded-tr-none text-[13px] font-bold shadow-2xl shadow-primary/20 max-w-[85%] animate-in fade-in slide-in-from-right-4 duration-500">
                  {msg.imagePreview && (
                    <div className="rounded-2xl overflow-hidden mb-4 border border-white/20 shadow-xl">
                      <img src={msg.imagePreview} alt="Referencia" className="max-h-64 w-auto object-contain" />
                    </div>
                  )}
                  <span className="whitespace-pre-wrap leading-relaxed">{msg.content}</span>
                </div>
                <span className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity pr-4 mt-2">
                  Verificado · {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            ) : (
              <div className="w-full max-w-[95%]">
                <div className="flex items-center gap-4 mb-4 pl-3">
                  <div className="h-9 w-9 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-primary shadow-xl shadow-zinc-200/50 animate-in zoom-in duration-700">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase text-zinc-900 tracking-[0.2em] leading-none mb-1">
                      {persona === 'antigravity' ? 'Antigravity Core' : 'Genesis Engine'}
                    </span>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Protocolo Lumina Online</span>
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "px-9 py-8 rounded-[2.5rem] rounded-tl-none shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all duration-700 relative group/msg border overflow-hidden",
                  msg.type === 'plan' 
                    ? "bg-indigo-50/50 border-indigo-200/50" 
                    : "bg-white/80 border-zinc-100 backdrop-blur-xl"
                )}>
                  {/* --- Light Blueprint Overlay (if Plan) --- */}
                  {msg.type === 'plan' && (
                    <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                  )}

                  {/* Plan Card Header */}
                  {msg.type === 'plan' && (
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-indigo-100 relative z-10">
                      <div className="h-10 w-10 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-100">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="text-[12px] font-black uppercase tracking-[0.3em] text-indigo-700">Génesis Arquitecto</span>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest leading-none">Plano de Implementación Élite</span>
                        </div>
                      </div>
                      
                      <div className="ml-auto flex flex-col items-end">
                        {msg.planStatus === 'pending' && (
                          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/50 border border-amber-200/50">
                             <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                             <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Revisión</span>
                          </div>
                        )}
                        {msg.planStatus === 'approved' && (
                          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/50 border border-emerald-200/50">
                             <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ejecutando</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className={cn(
                    "prose max-w-none relative z-10",
                    msg.type === 'plan' ? "prose-indigo font-sans text-[13px] leading-relaxed text-indigo-900/80" : "prose-zinc prose-sm font-medium text-zinc-600"
                  )}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} 
                  />

                  {/* Plan Card Action Buttons */}
                  {msg.type === 'plan' && msg.planStatus === 'pending' && (
                    <div className="flex items-center gap-3 mt-8 pt-6 border-t border-indigo-100 relative z-10">
                      <button
                        onClick={async () => {
                          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, planStatus: 'approved' as const } : m));
                          const origArchitect = isArchitectMode;
                          setIsArchitectMode(false);
                          setPendingPlanPrompt(msg.originalPrompt || '');
                          await handleSend(msg.originalPrompt || '');
                          setPendingPlanPrompt(null);
                          setIsArchitectMode(origArchitect);
                        }}
                        className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Comenzar Construcción
                      </button>
                      <button 
                        onClick={() => {
                          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, planStatus: 'rejected' as const } : m));
                          toast.info('Plan rechazado. Puedes hacer ajustes y volver a pedir.');
                        }}
                        className="px-6 py-3.5 rounded-2xl bg-white border border-zinc-200 text-zinc-500 text-[11px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all"
                      >
                        Revisar Prompt
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

        {/* --- Autonomous Fix Prompt (Floating Alert) --- */}
        {runtimeError && !isGenerating && (
          <div className="mx-6 my-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="group relative overflow-hidden rounded-3xl border border-rose-200 bg-rose-50/80 p-6 backdrop-blur-xl shadow-2xl shadow-rose-200/20">
              <div className="absolute top-0 right-0 p-2">
                <button onClick={() => onClearError?.()} className="p-2 text-rose-300 hover:text-rose-500 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-inner">
                    <Zap className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-rose-900">Señal de Error Detectada</h4>
                    <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Génesis Engine está listo para intervenir</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/50 p-4 border border-rose-100">
                   <code className="text-[10px] font-mono text-rose-700 leading-relaxed block break-words">
                     {runtimeError}
                   </code>
                </div>
                <button 
                  onClick={handleApplyFix}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-lg hover:shadow-rose-600/30 active:scale-[0.98]"
                >
                  <Sparkles className="h-4 w-4" />
                  Analizar y Corregir Automáticamente
                </button>
              </div>
            </div>
          </div>
        )}
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

        {/* --- Quick Action Chips (Empty state) --- */}
        {messages.length === 1 && messages[0].id === 'welcome' && !pendingContext && !pendingUrl && (
          <div className="max-w-4xl mx-auto w-full mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { label: 'Crear un SaaS de Gestión', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50/50' },
                { label: 'Analizar Arquitectura', icon: Brain, color: 'text-indigo-500', bg: 'bg-indigo-50/50' },
                { label: 'Corregir Errores de UI', icon: LayoutGrid, color: 'text-rose-500', bg: 'bg-rose-50/50' },
                { label: 'Refactorizar Código', icon: Code2, color: 'text-emerald-500', bg: 'bg-emerald-50/50' },
                { label: 'Crear Documentación', icon: BookOpen, color: 'text-primary/70', bg: 'bg-primary/5' },
              ].map((chip, i) => (
                <button
                  key={i}
                  onClick={() => setInput(chip.label)}
                  className={cn(
                    "flex items-center gap-2.5 px-6 py-2.5 rounded-2xl border border-transparent transition-all hover:border-zinc-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 group",
                    chip.bg
                  )}
                >
                  <chip.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", chip.color)} />
                  <span className="text-[11px] font-black text-zinc-900 uppercase tracking-widest">{chip.label}</span>
                </button>
              ))}
            </div>
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
