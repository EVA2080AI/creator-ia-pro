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
    const [_, lang, rawFilename, content] = match;
    let filename = rawFilename?.trim();
    
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

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES DE MANIPULACIÓN DE ARCHIVOS (PATCH, DELETE, TRUNCATION)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detecta si la respuesta de la IA fue truncada (cortada)
 * Verifica si hay bloques de código sin cerrar o estructuras incompletas
 */
export function isResponseTruncated(text: string): boolean {
  if (!text || text.length < 100) return false;

  // Contar bloques de código abiertos vs cerrados
  const openCodeBlocks = (text.match(/```[a-z]*/gi) || []).length;
  const closeCodeBlocks = (text.match(/```\s*$/gm) || []).length;

  // Si hay bloques abiertos pero no cerrados apropiadamente
  if (openCodeBlocks > closeCodeBlocks) return true;

  // Verificar si termina en medio de un bloque de código
  const lastCodeBlock = text.lastIndexOf('```');
  const lastContent = text.slice(lastCodeBlock + 3).trim();
  if (lastCodeBlock !== -1 && lastContent.length > 0 && !lastContent.startsWith('\n')) {
    // Parece que hay contenido después del último ``` que no es un cierre
    const hasUnclosedBlock = /```(tsx|jsx|ts|js|css|html|json)\s*\n[\s\S]*$/.test(text);
    if (hasUnclosedBlock) return true;
  }

  // Verificar si termina abruptamente con caracteres de continuación
  const endsWithContinuation = /[\w\s,;:+\-\*/=<{(\[]$/.test(text.slice(-100));
  const hasIncompleteLine = !text.endsWith('}') && !text.endsWith('`') && !text.endsWith('>');

  // Verificar patrones de truncación comunes
  const truncationPatterns = [
    /export\s+default\s+\w+\s*\{[^}]*$/, // export default X { ... (sin cerrar)
    /return\s*\([^)]*$/,                 // return ( ... (sin cerrar)
    /<\w+[^>]*>$/,                       // <Tag ...> (sin cerrar)
    /\{[^}]*$/,                          // { ... (sin cerrar)
    /\[[^\]]*$/,                         // [ ... (sin cerrar)
  ];

  const lastLines = text.slice(-500);
  const appearsTruncated = truncationPatterns.some(pattern => pattern.test(lastLines));

  return appearsTruncated && endsWithContinuation;
}

/**
 * Extrae bloques PATCH del formato FIND/REPLACE del markdown
 * Formato esperado:
 * ```patch
 * // archivo.tsx
 * FIND:
 * código a buscar
 * REPLACE:
 * código nuevo
 * ```
 */
export function extractPatchBlocks(text: string): Array<{
  filename: string;
  find: string;
  replace: string;
}> | null {
  const patches: Array<{ filename: string; find: string; replace: string }> = [];

  // Patrón para bloques patch
  const patchRegex = /```patch\s*\n?(?:\/\/\s*)?([^\n]+)\n?([\s\S]*?)```/g;

  let match;
  while ((match = patchRegex.exec(text)) !== null) {
    const filename = match[1].trim().replace(/^\/\//, '').trim();
    const content = match[2];

    // Buscar secciones FIND y REPLACE
    const findMatch = content.match(/FIND:\s*\n?([\s\S]*?)(?=\n?REPLACE:|$)/);
    const replaceMatch = content.match(/REPLACE:\s*\n?([\s\S]*?)$/);

    if (findMatch && replaceMatch) {
      patches.push({
        filename,
        find: findMatch[1].trim(),
        replace: replaceMatch[1].trim()
      });
    }
  }

  // También soportar formato simplificado: ```patch filename
  const simplePatchRegex = /```patch\s+([\w.\/\-]+)\n([\s\S]*?)```/g;
  while ((match = simplePatchRegex.exec(text)) !== null) {
    const filename = match[1].trim();
    const patchContent = match[2];

    // Intentar separar por === o similar
    if (patchContent.includes('===')) {
      const [find, replace] = patchContent.split('===').map(s => s.trim());
      patches.push({ filename, find, replace });
    }
  }

  return patches.length > 0 ? patches : null;
}

/**
 * Extrae comandos DELETE del código
 * Busca comentarios // DELETE o instrucciones de eliminación
 */
export function extractDeleteCommands(text: string): string[] {
  const filesToDelete: string[] = [];

  // Patrón 1: // DELETE en bloques de código
  const deleteRegex = /```[a-z]*\s*\n?(?:\/\/\s*)?([^\n]+)\s*\n?\/\/\s*DELETE\s*```/gi;
  let match;
  while ((match = deleteRegex.exec(text)) !== null) {
    filesToDelete.push(match[1].trim().replace(/^\/\//, '').trim());
  }

  // Patrón 2: Texto explícito "elimina archivo X" o "borra X"
  const explicitDeleteRegex = /(?:elimina|borra|delete|remove)\s+(?:el\s+)?(?:archivo|file)?\s*:?\s*`?([\w.\/\-]+)`?/gi;
  while ((match = explicitDeleteRegex.exec(text)) !== null) {
    const filename = match[1].trim();
    if (filename.includes('.') && !filesToDelete.includes(filename)) {
      filesToDelete.push(filename);
    }
  }

  // Patrón 3: Comentarios inline // DELETE: filename
  const inlineDeleteRegex = /\/\/\s*DELETE\s*:\s*([\w.\/\-]+)/gi;
  while ((match = inlineDeleteRegex.exec(text)) !== null) {
    const filename = match[1].trim();
    if (!filesToDelete.includes(filename)) {
      filesToDelete.push(filename);
    }
  }

  return filesToDelete;
}

/**
 * Aplica patches quirúrgicos a archivos existentes
 * Usa el formato FIND/REPLACE para hacer cambios precisos
 */
export function applyPatchToFiles(
  text: string,
  projectFiles: Record<string, StudioFile>
): Record<string, StudioFile> {
  const patchedFiles = { ...projectFiles };
  const patches = extractPatchBlocks(text);

  if (!patches) return patchedFiles;

  for (const patch of patches) {
    const filename = patch.filename;
    const file = patchedFiles[filename];

    if (!file) {
      console.warn(`[applyPatchToFiles] Archivo no encontrado: ${filename}`);
      continue;
    }

    // Normalizar el contenido para la búsqueda
    const normalizedContent = file.content.replace(/\r\n/g, '\n');
    const normalizedFind = patch.find.replace(/\r\n/g, '\n');
    const normalizedReplace = patch.replace.replace(/\r\n/g, '\n');

    // Intentar reemplazo exacto
    if (normalizedContent.includes(normalizedFind)) {
      const newContent = normalizedContent.replace(normalizedFind, normalizedReplace);
      patchedFiles[filename] = {
        ...file,
        content: newContent
      };
      console.log(`[applyPatchToFiles] Patch aplicado a ${filename}`);
    } else {
      // Intentar búsqueda flexible (ignorando espacios extras)
      const flexibleFind = normalizedFind.replace(/\s+/g, '\\s+');
      const flexibleRegex = new RegExp(flexibleFind, 'g');

      if (flexibleRegex.test(normalizedContent)) {
        const newContent = normalizedContent.replace(flexibleRegex, normalizedReplace);
        patchedFiles[filename] = {
          ...file,
          content: newContent
        };
        console.log(`[applyPatchToFiles] Patch flexible aplicado a ${filename}`);
      } else {
        console.warn(`[applyPatchToFiles] No se encontró el patrón en ${filename}`);
      }
    }
  }

  return patchedFiles;
}

/**
 * Procesa todas las operaciones de archivo (PATCH, DELETE, nuevos archivos)
 * Retorna el estado actualizado de los archivos del proyecto
 */
export function processFileOperations(
  text: string,
  projectFiles: Record<string, StudioFile>
): {
  files: Record<string, StudioFile>;
  deletedFiles: string[];
  patchedFiles: string[];
  newFiles: string[];
} {
  let result = { ...projectFiles };
  const deletedFiles: string[] = [];
  const patchedFiles: string[] = [];
  const newFiles: string[] = [];

  // 1. Procesar DELETE primero
  const deletes = extractDeleteCommands(text);
  for (const filename of deletes) {
    if (result[filename]) {
      delete result[filename];
      deletedFiles.push(filename);
      console.log(`[processFileOperations] Archivo eliminado: ${filename}`);
    }
  }

  // 2. Procesar PATCH
  const patches = extractPatchBlocks(text);
  if (patches) {
    for (const patch of patches) {
      const filename = patch.filename;
      const file = result[filename];

      if (file) {
        const normalizedContent = file.content.replace(/\r\n/g, '\n');
        const normalizedFind = patch.find.replace(/\r\n/g, '\n');
        const normalizedReplace = patch.replace.replace(/\r\n/g, '\n');

        if (normalizedContent.includes(normalizedFind)) {
          result[filename] = {
            ...file,
            content: normalizedContent.replace(normalizedFind, normalizedReplace)
          };
          patchedFiles.push(filename);
        }
      }
    }
  }

  // 3. Extraer nuevos archivos de bloques de código
  const newFileBlocks = extractChatCodeFiles(text);
  if (newFileBlocks) {
    for (const [filename, fileData] of Object.entries(newFileBlocks)) {
      // Si el archivo ya existe y es idéntico, no lo marcamos como nuevo
      if (!result[filename] || result[filename].content !== fileData.content) {
        if (!result[filename]) {
          newFiles.push(filename);
        }
        result[filename] = fileData;
      }
    }
  }

  return {
    files: result,
    deletedFiles,
    patchedFiles,
    newFiles
  };
}

/**
 * Detecta si el usuario quiere limpiar/resetear el proyecto completamente
 */
export function wantsProjectReset(prompt: string): boolean {
  const p = prompt.toLowerCase().trim();
  const resetKeywords = [
    'limpia todo', 'borra todo', 'empezar de cero', 'resetear proyecto',
    'nuevo proyecto', 'clear all', 'start fresh', 'reset project',
    'elimina todo', 'desde cero', 'from scratch', 'clean slate'
  ];
  return resetKeywords.some(kw => p.includes(kw));
}

/**
 * Detecta dependencias faltantes basándose en los imports del código
 */
export function detectMissingDependencies(
  files: Record<string, StudioFile>
): string[] {
  const deps = new Set<string>();
  const importRegex = /import\s+(?:(?:\{[^}]*\}|[^'"]*)\s+from\s+)?['"]([^'"]+)['"];?/g;

  const dependencyMap: Record<string, string> = {
    'lucide-react': 'lucide-react',
    'framer-motion': 'framer-motion',
    'recharts': 'recharts',
    '@supabase/supabase-js': '@supabase/supabase-js',
    'react-router-dom': 'react-router-dom',
    'axios': 'axios',
    'clsx': 'clsx',
    'tailwind-merge': 'tailwind-merge',
    'zustand': 'zustand',
    '@react-three/fiber': '@react-three/fiber',
    '@react-three/drei': '@react-three/drei',
    'three': 'three',
    'date-fns': 'date-fns',
    'lodash': 'lodash',
    'zod': 'zod',
    'react-hook-form': 'react-hook-form',
    '@hookform/resolvers': '@hookform/resolvers',
  };

  for (const file of Object.values(files)) {
    let match;
    const content = file.content;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];

      // Ignorar imports relativos y de React
      if (importPath.startsWith('.') || importPath.startsWith('/')) continue;
      if (importPath === 'react' || importPath === 'react-dom') continue;

      // Extraer el nombre del paquete (sin subpaths)
      const packageName = importPath.split('/')[0];

      // Mapear a dependencia conocida o usar el nombre del paquete
      if (dependencyMap[importPath]) {
        deps.add(dependencyMap[importPath]);
      } else if (dependencyMap[packageName]) {
        deps.add(dependencyMap[packageName]);
      } else if (!importPath.startsWith('@')) {
        deps.add(packageName);
      }
    }
  }

  return Array.from(deps);
}
