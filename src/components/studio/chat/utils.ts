import type { StudioFile } from '@/hooks/useStudioProjects';
import { 
  CODE_VERBS, 
  CODE_NOUNS, 
  GREETINGS, 
  FILE_MGMT_KEYWORDS, 
  VISION_KEYWORDS 
} from './constants';

export function repairJson(text: string): string {
  let json = text.trim();
  const stack: string[] = [];
  let isInString = false;
  let isEscaped = false;

  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (char === '\\') {
      isEscaped = true;
      continue;
    }
    if (char === '"') {
      isInString = !isInString;
      continue;
    }
    if (!isInString) {
      if (char === '{' || char === '[') stack.push(char === '{' ? '}' : ']');
      else if (char === '}' || char === ']') stack.pop();
    }
  }

  if (isInString) json += '"';
  while (stack.length > 0) {
    json += stack.pop();
  }
  return json;
}

// ─── Phase 2 Hardening: AI Response Interface ──────────────────────────────
export interface GenesisResponse {
  files?: Record<string, string | { content: string; language?: string; deleted?: boolean }>;
  explanation?: string;
  tech_stack?: string[];
  primary_colors?: string[];
  ux_principles?: string[];
}

export function extractJson(text: string): GenesisResponse | null {
  const t = text.trim();
  
  const tryParse = (str: string) => {
    try { return JSON.parse(str); } catch {
      try { return JSON.parse(repairJson(str)); } catch { return null; }
    }
  };

  if (t.startsWith('{') && t.endsWith('}')) {
    const p = tryParse(t);
    if (p) return p;
  }

  // Match ```json, ```javascript, ```typescript, or bare ``` blocks containing JSON
  const mdLang = t.match(/```(?:json|javascript|typescript|js|ts)?\s*\n?([\s\S]*?)```/);
  if (mdLang) {
    const inner = mdLang[1].trim();
    if (inner.startsWith('{')) {
      const p = tryParse(inner);
      if (p) return p;
    }
  }

  const first = t.indexOf('{');
  const last  = t.lastIndexOf('}');
  if (first !== -1) {
    const content = last > first ? t.slice(first, last + 1) : t.slice(first);
    const p = tryParse(content);
    if (p) return p;
  }

  return null;
}


export function detectDeps(files: Record<string, StudioFile>): string[] {
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

export function buildSuggestions(stack: string[], prompt: string): string[] {
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

export type IntentType = 'codegen' | 'chat' | 'fullstack' | 'html-import' | 'vanilla-html';

/** Detect if prompt contains raw HTML code */
export function containsHtml(text: string): boolean {
  const htmlPatterns = [
    /<!DOCTYPE\s+html/i,
    /<html[\s>]/i,
    /<head[\s>]/i,
    /<body[\s>]/i,
    /<div[\s>][\s\S]{50,}/i,
    /<section[\s>][\s\S]{50,}/i,
    /<nav[\s>]/i,
    /<header[\s>][\s\S]{30,}/i,
    /<footer[\s>][\s\S]{30,}/i,
  ];
  const matchCount = htmlPatterns.filter(p => p.test(text)).length;
  return matchCount >= 2;
}

/** Detect if user wants plain HTML without React */
export function wantsVanillaHtml(text: string): boolean {
  const p = text.toLowerCase();
  const vanillaKeywords = [
    'html puro', 'solo html', 'sin react', 'vanilla', 'html simple',
    'plain html', 'static html', 'html css', 'html y css', 'sin framework',
    'no react', 'html basico', 'html básico', 'pagina html', 'página html',
    'html estatico', 'html estático', 'without react', 'pure html',
  ];
  return vanillaKeywords.some(k => p.includes(k));
}

export function detectIntent(prompt: string, hasContext?: boolean): IntentType {
  let p = prompt.toLowerCase().trim();
  
  // Normalización de typos comunes (Fuzzy typos)
  p = p.replace(/apagina/g, 'pagina')
       .replace(/asuna/g, 'una')
       .replace(/hasme/g, 'hazme')
       .replace(/has un/g, 'haz un')
       .replace(/has una/g, 'haz una')
       .replace(/vender/g, 'ventas');

  // HTML Import: detect raw HTML pasted in chat
  if (containsHtml(prompt)) return 'html-import';

  // Vanilla HTML: user explicitly wants HTML without React
  if (wantsVanillaHtml(prompt)) return 'vanilla-html';

  // High-complexity "Creation" keywords for FULLSTACK intent
  const CREATION_KEYWORDS = [
    'crea un web', 'hazme una web', 'crea un proyecto', 'crea un saas', 'crea una app completa',
    'creame una', 'hazme una', 'hasme una', 'has una', 'has un',
    'create a full mvp', 'create a saas', 'industrial project', 'sistema completo',
    'build a complete system', 'dashboard completo', 'diseña un', 'armar una plataforma',
    'genera el alma del producto', 'visión estratégica', 'arquitectura de', 'propuesta de landing',
    'haz una pagina de', 'monta un sistema', 'create a website', 'make a landing', 'building a website'
  ];

  if (GREETINGS.includes(p) || p.length < 3) return 'chat';
  
  const isVisionRequest = p.includes('estrategia') || p.includes('arquitectura') || p.includes('pensamiento') || p.includes('planifica');
  const isCreationRequest = CREATION_KEYWORDS.some(k => p.includes(k)) || 
                           ((p.includes('web') || p.includes('landing') || p.includes('website') || p.includes('app') || p.includes('página') || p.includes('sitio')) && 
                            (p.includes('crea') || p.includes('haz') || p.includes('has') || p.includes('genera') || p.includes('build') || p.includes('make')));

  if (isVisionRequest || isCreationRequest) return 'fullstack';

  // [FIX] Priority
  if (p.includes('[auto-fix]') || p.includes('[fix]')) return 'codegen';

  if (FILE_MGMT_KEYWORDS.some(k => p.includes(k)) && hasContext) return 'codegen';
  if (VISION_KEYWORDS.some(k => p.includes(k))) return 'codegen';
  if (p.includes('quien eres') || p.includes('que puedes hacer') || p.includes('ayuda')) return 'chat';
  const isOnlyError = (p.includes('error:') || p.includes('exception')) && !CODE_VERBS.some(v => p.includes(v));
  if (/```[\s\S]*```/.test(prompt) && isOnlyError) return 'chat';
  const containsCodeNoun = CODE_NOUNS.some(n => p.includes(n));
  const startsWithCodeVerb = CODE_VERBS.some(v => p.startsWith(v + ' ') || p.startsWith(v + '\n'));
  if (startsWithCodeVerb || containsCodeNoun) return 'codegen';
  if (p.includes('pon un') || p.includes('agrega') || p.includes('modifica') || p.includes('add a') || p.includes('haz un')) return 'codegen';
  if (hasContext && !containsCodeNoun && !startsWithCodeVerb) return 'chat';
  return 'chat';
}


export function extractChatCodeFiles(text: string): Record<string, StudioFile> | null {
  const files: Record<string, StudioFile> = {};
  
  // 1. Try primary JSON extraction with repair capability
  const extracted = extractJson(text);
  if (extracted && extracted.files) {
    Object.entries(extracted.files).forEach(([path, value]) => {
      let content = '';
      if (typeof value === 'string') content = value;
      else if (value && typeof value === 'object' && value.content) content = value.content;
      
      if (content) {
        const lang = path.split('.').pop()?.toLowerCase() || 'tsx';
        files[path] = { language: lang, content: content.trim() };
      }
    });
    if (Object.keys(files).length > 0) return files;
  }

  // 2. Fallback to Markdown blocks (ROBUST VERSION)
  const regex = /```(\w*)[\s\n]*([\s\S]*?)```/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const lang = m[1].trim().toLowerCase();
    const code = m[2].trim();
    if (code.length < 5) continue; 

    const blockStartPos = m.index;
    const textBefore = text.slice(Math.max(0, blockStartPos - 100), blockStartPos);

    // Search for a filename inside the block (first 3 lines)
    let filename = '';
    const fileMatchInside = code.match(/(?:\/\/|#|--)\s*([\w./\-]+\.\w+)/);
    
    if (fileMatchInside) {
      filename = fileMatchInside[1];
    } else {
      // Look for filename in the text BEFORE the block (e.g. "File: src/App.tsx")
      const fileMatchBefore = textBefore.match(/(?:file|archivo|path|ruta|src|public|app|components|pages|styles)[:\s]*([\w./\-]+\.\w+)/i);
      if (fileMatchBefore) {
        filename = fileMatchBefore[1];
      } else {
        // Guess filename based on language and content
        if (lang === 'html') filename = 'index.html';
        else if (lang === 'css') filename = 'index.css';
        else if (code.includes('export default') || code.includes('ReactDOM')) {
          filename = (lang === 'typescript' || lang === 'ts' || lang === 'tsx') ? 'src/App.tsx' : 'src/App.jsx';
        } else {
          filename = `src/component-${Object.keys(files).length}.${lang || 'tsx'}`;
        }
      }
    }
    
    // Clean up filename (sometimes it catches trailing dots/chars)
    filename = filename.replace(/[:"']/g, '').trim();

    const finalLang = lang || (filename.split('.').pop()?.toLowerCase() || 'tsx');
    const isDeletion = code.includes('// DELETE');
    files[filename] = { language: finalLang, content: isDeletion ? '__genesis_delete__' : code };
  }
  return Object.keys(files).length > 0 ? files : null;
}


// ─── PUNTO 2: SURGICAL PATCH SYSTEM ──────────────────────────────────
// Genesis can now output PATCH blocks: targeted line replacements instead of
// full file rewrites — same as Antigravity's multi_replace_file_content tool.
//
// Format Genesis uses in its response:
//   ```patch
//   // src/components/Navbar.tsx
//   FIND:
//   const [open, setOpen] = useState(false);
//   REPLACE:
//   const [isOpen, setIsOpen] = useState(false);
//   ```
//
// This lets Genesis fix a 1-line bug without regenerating a 300-line file.
export function applyPatchToFiles(
  patches: string,
  existingFiles: Record<string, StudioFile>
): Record<string, StudioFile> {
  const result = { ...existingFiles };

  // Parse all patch blocks: ```patch\n// filename\nFIND:\n...\nREPLACE:\n...\n```
  const patchRegex = /```patch\n([\s\S]*?)```/g;
  let m;
  while ((m = patchRegex.exec(patches)) !== null) {
    const block = m[1];

    // Extract filename from first comment line
    const fileMatch = block.match(/^\/\/\s*([\w./\-]+\.\w+)/);
    if (!fileMatch) continue;
    const filename = fileMatch[1];

    // Extract FIND and REPLACE sections
    const findMatch  = block.match(/FIND:\n([\s\S]*?)(?=REPLACE:|$)/);
    const replMatch  = block.match(/REPLACE:\n([\s\S]*)$/);
    if (!findMatch || !replMatch) continue;

    const findText    = findMatch[1].trim();
    const replaceText = replMatch[1].trim();

    if (result[filename]) {
      // Surgical replacement: find exact match and swap it
      const currentContent = result[filename].content;
      if (currentContent.includes(findText)) {
        result[filename] = {
          ...result[filename],
          content: currentContent.replace(findText, replaceText)
        };
      }
      // If not found, fall back gracefully (no-op this patch block)
    } else if (replaceText && !findText) {
      // Pure NEW FILE patch (FIND empty = create new)
      const lang = filename.split('.').pop()?.toLowerCase() || 'tsx';
      result[filename] = { language: lang, content: replaceText };
    }
  }
  return result;
}

// ─── PUNTO 3: TRUNCATION DETECTION ─────────────────────────────────────
// Detects when Genesis was cut off mid-generation so useStudioChatAI
// can automatically request a continuation — mimicking Antigravity's
// ability to work file-by-file without token pressure.
export function isResponseTruncated(text: string): boolean {
  const trimmed = text.trimEnd();
  if (!trimmed) return false;

  // Signs of truncation in code
  const openBackticks  = (trimmed.match(/```/g) || []).length;
  if (openBackticks % 2 !== 0) return true;           // unclosed code block

  const lastLines = trimmed.split('\n').slice(-8).join('\n');

  // Mid-function or mid-object cuts
  if (/[{([,]\s*$/.test(lastLines)) return true;
  if (/=>\s*$/.test(lastLines))      return true;
  if (/\breturn\s*$/.test(lastLines)) return true;
  if (/import .* from\s*$/.test(lastLines)) return true;

  // Incomplete JSX tags
  if (/<[A-Z][a-zA-Z]*[^/>]*$/.test(lastLines)) return true;

  // Hardcoded truncation markers
  if (/\.\.\.$/.test(trimmed) && !trimmed.includes('```')) return true;
  if (/\/\/ (continúa|continues|truncated|TODO|rest of)/i.test(lastLines)) return true;

  return false;
}

export function extractPatchBlocks(text: string): boolean {
  return text.includes('```patch');
}

export function processRawResponse(rawText: string, prompt: string, isChatOnly: boolean) {
  if (!rawText) return null;
  if (isChatOnly) return { files: {} as Record<string, StudioFile>, explanation: rawText, stack: [], deps: [], suggestions: [], isChatOnly: true };

  // 1. Try structured JSON extraction first
  const extracted = extractJson(rawText);
  if (extracted?.files && Object.keys(extracted.files).length > 0) {
    const normalizedFiles: Record<string, StudioFile> = {};
    for (const [filename, value] of Object.entries(extracted.files)) {
      if (typeof value === 'string') {
        const lang = filename.endsWith('.css') ? 'css' : filename.endsWith('.json') ? 'json' : 'tsx';
        normalizedFiles[filename] = { language: lang, content: value };
      } else if (value && typeof value === 'object' && value.content) {
        normalizedFiles[filename] = {
          language: value.language || (filename.endsWith('.css') ? 'css' : 'tsx'),
          content: value.content
        };
      }
    }
    if (Object.keys(normalizedFiles).length > 0) {
      const stack = extracted.tech_stack || [];
      const deps  = detectDeps(normalizedFiles);
      const suggestions = buildSuggestions(stack, prompt);
      return { files: normalizedFiles, explanation: extracted.explanation || '', tech_stack: stack, deps, suggestions };
    }
  }

  // 2. Fallback: extract code from markdown blocks (AI often returns ```tsx ... ``` instead of JSON)
  const mdFiles = extractChatCodeFiles(rawText);
  if (mdFiles && Object.keys(mdFiles).length > 0) {
    const stack = ['React', 'Tailwind'];
    const deps = detectDeps(mdFiles);
    const suggestions = buildSuggestions(stack, prompt);
    // Extract explanation text (everything before the first code block)
    const firstBlock = rawText.indexOf('```');
    const explanation = firstBlock > 0 ? rawText.slice(0, firstBlock).trim() : 'Código generado.';
    return { files: mdFiles, explanation, tech_stack: stack, deps, suggestions };
  }

  // 3. No code found — treat as chat-only
  return { files: {} as Record<string, StudioFile>, explanation: rawText, tech_stack: [], deps: [], suggestions: [], isChatOnly: true };
}
