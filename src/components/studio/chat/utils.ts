import type { StudioFile } from '@/hooks/useStudioProjects';
import { 
  CODE_VERBS, 
  CODE_NOUNS, 
  GREETINGS, 
  FILE_MGMT_KEYWORDS, 
  VISION_KEYWORDS 
} from './constants';

export function extractJson(text: string): any | null {
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

export function detectIntent(prompt: string, hasContext?: boolean): 'codegen' | 'chat' {
  const p = prompt.toLowerCase().trim();
  if (GREETINGS.includes(p) || p.length < 3) return 'chat';
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
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const lang = m[1].trim().toLowerCase();
    const code = m[2].trim();
    if (code.length < 5) continue; 
    let filename = '';
    const fileMatch = code.match(/\/\/\s*([\w./\-]+\.\w+)/);
    if (fileMatch) {
      filename = fileMatch[1].replace(/^src\//, ''); 
    } else {
      if (lang === 'html') filename = 'index.html';
      else if (lang === 'css') filename = 'styles.css';
      else if (code.includes('export default')) filename = 'App.tsx';
      else continue; 
    }
    let finalLang = lang;
    if (filename.endsWith('.tsx')) finalLang = 'tsx';
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
