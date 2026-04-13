import { StudioFile } from '@/hooks/useStudioProjects';

const GREETINGS = ['hola', 'hi', 'hey', 'buenos dias', 'buenas noches', 'hello'];
const FILE_MGMT_KEYWORDS = ['borra', 'elimina', 'nuevo archivo', 'crear archivo', 'renombra', 'delete', 'remove', 'new file', 'rename'];
const VISION_KEYWORDS = ['explica', 'como funciona', 'analiza', 'review', 'describe', 'que hace'];
const CODE_VERBS = ['haz', 'crea', 'creame', 'has', 'pon', 'agrega', 'modifica', 'cambia', 'arregla', 'repara', 'fix', 'add', 'create', 'update', 'modify', 'corregir'];
const CODE_NOUNS = ['componente', 'estilo', 'script', 'button', 'input', 'div', 'clase', 'archivo', 'file', 'code', 'codigo', 'component', 'logic', 'hook'];

const TECH_KEYWORDS = [
  'button', 'page', 'component', 'style', 'input', 'form', 'api', 'route', 'hook', 'context',
  'navbar', 'hero', 'footer', 'layout', 'grid', 'flex', 'design', 'ui', 'ux', 'tailwind',
  'boton', 'pagina', 'componente', 'estilo', 'formulario', 'ruta', 'diseno', 'interfaz',
  'crea', 'create', 'build', 'implement', 'fix', 'error', 'bug', 'corregir', 'repara',
  'arreglar', 'mejora', 'refactor', 'setup', 'init', 'install'
];

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

export type ChatIntent = 'chat' | 'codegen' | 'fullstack' | 'vanilla-html' | 'html-import';

export function detectIntent(prompt: string, hasContext: boolean): ChatIntent {
  let p = prompt.toLowerCase().trim();
  
  // Normalization
  p = p.replace(/apagina/g, 'pagina')
       .replace(/asuna/g, 'una')
       .replace(/hasme/g, 'hazme')
       .replace(/has un/g, 'haz un')
       .replace(/has una/g, 'haz una')
       .replace(/vender/g, 'ventas');

  if (containsHtml(prompt)) return 'html-import';
  if (wantsVanillaHtml(prompt)) return 'vanilla-html';

  const CREATION_KEYWORDS = [
    'crea un web', 'hazme una web', 'crea un proyecto', 'crea un saas', 'crea una app completa',
    'creame una', 'hazme una', 'hasme una', 'has una', 'has un',
    'create a full mvp', 'create a saas', 'industrial project', 'sistema completo',
    'build a complete system', 'dashboard completo', 'diseña un', 'armar una plataforma',
    'genera el alma del producto', 'visión estratégica', 'arquitectura de', 'propuesta de landing',
    'haz una pagina de', 'monta un sistema', 'create a website', 'make a landing', 'building a website'
  ];

  if (GREETINGS.includes(p) || (p.length < 5 && !TECH_KEYWORDS.some(k => p.includes(k)))) return 'chat';
  
  const isVisionRequest = p.includes('estrategia') || p.includes('arquitectura') || p.includes('pensamiento') || p.includes('planifica');
  const isCreationRequest = CREATION_KEYWORDS.some(k => p.includes(k)) || 
                           ((p.includes('web') || p.includes('landing') || p.includes('website') || p.includes('app') || p.includes('página') || p.includes('sitio')) && 
                            (p.includes('crea') || p.includes('haz') || p.includes('has') || p.includes('genera') || p.includes('build') || p.includes('make')));

  if (isVisionRequest || isCreationRequest) return 'fullstack';

  // [FIX & CODE PRIORITY]
  if (p.includes('[auto-fix]') || p.includes('[fix]') || p.includes('corregir') || p.includes('repara') || p.includes('arregla')) return 'codegen';

  if (FILE_MGMT_KEYWORDS.some(k => p.includes(k)) && hasContext) return 'codegen';
  if (VISION_KEYWORDS.some(k => p.includes(k))) return 'codegen';
  if (p.includes('quien eres') || p.includes('que puedes hacer') || p.includes('ayuda')) return 'chat';
  
  const containsCodeNoun = CODE_NOUNS.some(n => p.includes(n));
  const startsWithCodeVerb = CODE_VERBS.some(v => p.startsWith(v + ' ') || p.startsWith(v + '\n'));
  const hasTechKeyword = TECH_KEYWORDS.some(k => p.includes(k));

  if (startsWithCodeVerb || containsCodeNoun || hasTechKeyword) return 'codegen';
  
  if (p.includes('pon un') || p.includes('agrega') || p.includes('modifica') || p.includes('add a') || p.includes('haz un')) return 'codegen';
  if (hasContext && !containsCodeNoun && !startsWithCodeVerb && !hasTechKeyword) return 'chat';
  
  return 'chat';
}

export function extractChatCodeFiles(text: string): Record<string, StudioFile> | null {
  const files: Record<string, StudioFile> = {};
  
  // 1. Try to find code blocks with filenames in the preceding lines or inside backticks
  // Pattern: ```tsx filename.tsx ... ``` or file: filename.tsx \n ``` ... ```
  const blockRegex = /```(tsx|jsx|ts|js|css|html|json)\s*([\w\.\/\-]*)\n([\s\S]*?)```/g;
  let match;
  let count = 0;

  while ((match = blockRegex.exec(text)) !== null) {
    let [_, lang, filename, content] = match;
    filename = filename?.trim();
    
    // If no filename in backticks, look at the line before
    if (!filename) {
      const beforeBlock = text.slice(0, match.index).trim().split('\n').pop() || '';
      const fileMatch = beforeBlock.match(/([\w\.\/\-]+\.(tsx|jsx|ts|js|css|html|json))/);
      if (fileMatch) {
        filename = fileMatch[1];
      }
    }

    // Default filenames if still missing
    if (!filename) {
      if (lang === 'css') filename = 'styles.css';
      else if (lang === 'html') filename = 'index.html';
      else if (count === 0) filename = 'App.tsx';
      else filename = `Component${count}.tsx`;
    }

    // Normalize path
    if (filename.startsWith('src/')) filename = filename.replace('src/', '');
    if (filename.startsWith('./')) filename = filename.replace('./', '');

    files[filename] = {
      content: content.trim(),
      language: lang as any
    };
    count++;
  }

  return Object.keys(files).length > 0 ? files : null;
}

export function extractJson(text: string) {
  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[1] || jsonMatch[0]);
  } catch (e) {
    return null;
  }
}

export function processRawResponse(rawText: string, prompt: string, isChatOnly: boolean) {
  if (!rawText) return null;
  
  // 1. Try structured JSON extraction first
  const extracted = extractJson(rawText);
  if (extracted?.files && Object.keys(extracted.files).length > 0) {
    const normalizedFiles: Record<string, StudioFile> = {};
    for (const [filename, value] of Object.entries(extracted.files)) {
      if (typeof value === 'string') {
        const lang = filename.endsWith('.css') ? 'css' : filename.endsWith('.json') ? 'json' : 'tsx';
        normalizedFiles[filename] = { language: lang, content: value };
      } else if (value && typeof value === 'object' && (value as any).content) {
        normalizedFiles[filename] = {
          language: (value as any).language || (filename.endsWith('.css') ? 'css' : 'tsx'),
          content: (value as any).content
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

  // 2. Fallback: extract code from markdown blocks (even if intent says chat)
  const mdFiles = extractChatCodeFiles(rawText);
  if (mdFiles && Object.keys(mdFiles).length > 0) {
    const stack = ['React', 'Tailwind'];
    const deps = detectDeps(mdFiles);
    const suggestions = buildSuggestions(stack, prompt);
    const firstBlock = rawText.indexOf('```');
    const explanation = firstBlock > 0 ? rawText.slice(0, firstBlock).trim() : 'Código generado.';
    return { files: mdFiles, explanation, tech_stack: stack, deps, suggestions, isChatOnly: false };
  }

  // 3. Final fallback: only use chat if absolutely NO code was found
  return { files: {} as Record<string, StudioFile>, explanation: rawText, tech_stack: [], deps: [], suggestions: [], isChatOnly: true };
}

function detectDeps(files: Record<string, StudioFile>): string[] {
  const deps = new Set<string>();
  Object.values(files).forEach(f => {
    const content = f.content;
    if (content.includes('lucide-react')) deps.add('lucide-react');
    if (content.includes('framer-motion')) deps.add('framer-motion');
    if (content.includes('clsx') || content.includes('tailwind-merge')) deps.add('clsx tailwind-merge');
    if (content.includes('recharts')) deps.add('recharts');
    if (content.includes('lucide')) deps.add('lucide-react');
  });
  return Array.from(deps);
}

function buildSuggestions(stack: string[], prompt: string): string[] {
  const sList = ['Agregar modo oscuro', 'Optimizar para móviles', 'Añadir animaciones', 'Pulir diseño'];
  return sList;
}
