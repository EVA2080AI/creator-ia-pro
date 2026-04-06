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

export function extractJson(text: string): any | null {
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

  const mdJson = t.match(/```json\s*([\s\S]*?)```/);
  if (mdJson) {
    const p = tryParse(mdJson[1].trim());
    if (p) return p;
  }

  const mdRaw = t.match(/```\s*([\s\S]*?)```/);
  if (mdRaw) {
    const inner = mdRaw[1].trim();
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

export type IntentType = 'codegen' | 'chat' | 'fullstack';

export function detectIntent(prompt: string, hasContext?: boolean): IntentType {
  const p = prompt.toLowerCase().trim();
  
  // High-complexity "Creation" keywords for FULLSTACK intent
  const CREATION_KEYWORDS = [
    'crea un web', 'hazme una web', 'crea un proyecto', 'crea un saas', 'crea una app completa',
    'create a full mvp', 'create a saas', 'industrial project', 'sistema completo',
    'build a complete system', 'dashboard completo', 'diseña un', 'armar una plataforma',
    'genera el alma del producto', 'visión estratégica', 'arquitectura de', 'propuesta de landing',
    'haz una pagina de', 'monta un sistema', 'create a website', 'make a landing'
  ];

  if (GREETINGS.includes(p) || p.length < 3) return 'chat';
  
  const isVisionRequest = p.includes('estrategia') || p.includes('arquitectura') || p.includes('pensamiento') || p.includes('planifica');
  const isCreationRequest = CREATION_KEYWORDS.some(k => p.includes(k));

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
      else if (value && typeof value === 'object' && (value as any).content) content = (value as any).content;
      
      if (content) {
        const lang = path.split('.').pop()?.toLowerCase() || 'tsx';
        files[path] = { language: lang, content: content.trim() };
      }
    });
    if (Object.keys(files).length > 0) return files;
  }

  // 2. Fallback to Markdown blocks
  const regex = /```(\w*)\s*(?:\/\/|#|--)\s*([\w./\-]+\.\w+)?\n([\s\S]*?)```/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const lang = m[1].trim().toLowerCase();
    const explicitPath = m[2];
    const code = m[3].trim();
    if (code.length < 5) continue; 

    let filename = explicitPath || '';
    if (!filename) {
      const fileMatch = code.match(/\/\/\s*([\w./\-]+\.\w+)/);
      if (fileMatch) {
        filename = fileMatch[1].replace(/^src\//, ''); 
      } else {
        if (lang === 'html') filename = 'index.html';
        else if (lang === 'css') filename = 'styles.css';
        else if (code.includes('export default')) filename = 'App.tsx';
        else continue; 
      }
    }
    
    const finalLang = lang || (filename.split('.').pop()?.toLowerCase() || 'tsx');
    const isDeletion = code.includes('// DELETE');
    files[filename] = { language: finalLang, content: isDeletion ? '__genesis_delete__' : code };
  }
  return Object.keys(files).length > 0 ? files : null;
}


export function processRawResponse(rawText: string, prompt: string, isChatOnly: boolean) {
  if (!rawText) return null;
  if (isChatOnly) return { files: {} as Record<string, StudioFile>, explanation: rawText, stack: [], deps: [], suggestions: [], isChatOnly: true };
  const extracted = extractJson(rawText);
  if (!extracted) return { files: {} as Record<string, StudioFile>, explanation: rawText, stack: [], deps: [], suggestions: [], isChatOnly: true };
  const normalizedFiles: Record<string, StudioFile> = {};
  if (extracted.files) {
    for (const [filename, value] of Object.entries(extracted.files)) {
      if (typeof value === 'string') {
        const lang = filename.endsWith('.css') ? 'css' : filename.endsWith('.json') ? 'json' : 'tsx';
        normalizedFiles[filename] = { language: lang, content: value };
      } else if (value && typeof value === 'object' && (value as any).content) {
        normalizedFiles[filename] = value as StudioFile;
      }
    }
  }
  const stack = extracted.tech_stack ?? [];
  const deps  = detectDeps(normalizedFiles);
  const suggestions = buildSuggestions(stack, prompt);
  return { files: normalizedFiles, explanation: extracted.explanation || '', stack, deps, suggestions };
}
