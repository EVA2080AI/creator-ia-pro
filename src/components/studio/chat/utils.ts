import { StudioFile } from '@/hooks/useStudioProjects';

const GREETINGS = ['hola', 'hi', 'hey', 'buenos dias', 'buenas noches', 'hello'];
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
    /<!DOCTYPE\s+html/i, /<html[\s>]/i, /<head[\s>]/i, /<body[\s>]/i,
    /<div[\s>][\s\S]{50,}/i, /<section[\s>][\s\S]{50,}/i,
    /<nav[\s>]/i, /<header[\s>][\s\S]{30,}/i, /<footer[\s>][\s\S]{30,}/i,
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

export function detectIntent(prompt: string, _hasContext?: boolean): ChatIntent {
  let p = prompt.toLowerCase().trim();

  // Normalization - common typos
  p = p.replace(/apagina/g, 'pagina').replace(/asuna/g, 'una')
       .replace(/hasme/g, 'hazme').replace(/has un/g, 'haz un').replace(/has una/g, 'haz una');

  // Check for HTML imports
  if (containsHtml(prompt)) return 'html-import';
  if (wantsVanillaHtml(prompt)) return 'vanilla-html';

  // Check for fix/repair commands
  if (p.includes('[auto-fix]') || p.includes('[fix]') || p.startsWith('corregir') || p.startsWith('repara') || p.startsWith('arregla')) {
    return 'codegen';
  }

  // Check for greetings/simple chat
  if (GREETINGS.includes(p)) return 'chat';
  if (p.length < 5 && !TECH_KEYWORDS.some(k => p.includes(k))) return 'chat';
  if (p.includes('quien eres') || p.includes('que puedes hacer') || p.includes('como estas') || p.includes('que tal')) return 'chat';
  if (p.startsWith('ayuda') && p.length < 20) return 'chat';

  // Landing page detection - more specific
  const LANDING_KEYWORDS = [
    'landing page', 'pagina de inicio', 'landing', 'home page', 'pagina principal',
    'sitio web', 'website', 'portafolio', 'portfolio', 'web de', 'pagina de'
  ];
  const CREATION_VERBS = ['crea', 'haz', 'hazme', 'creame', 'genera', 'build', 'make', 'create', 'diseña', 'monta'];

  const hasLandingKeyword = LANDING_KEYWORDS.some(k => p.includes(k));
  const hasCreationVerb = CREATION_VERBS.some(v => p.includes(v));

  // If it's a landing/site creation, it's fullstack (needs multiple files)
  if (hasLandingKeyword && hasCreationVerb) return 'fullstack';

  // Dashboard/app creation - fullstack
  const FULLSTACK_KEYWORDS = ['dashboard', 'app', 'aplicacion', 'saas', 'plataforma', 'sistema', 'web app'];
  if (FULLSTACK_KEYWORDS.some(k => p.includes(k)) && hasCreationVerb) return 'fullstack';

  // Component creation - codegen
  const COMPONENT_KEYWORDS = ['componente', 'component', 'button', 'boton', 'card', 'input', 'form', 'modal'];
  if (COMPONENT_KEYWORDS.some(k => p.includes(k)) && hasCreationVerb) return 'codegen';

  // Style/modify operations - codegen
  const CODE_VERBS = ['pon', 'agrega', 'modifica', 'cambia', 'update', 'add', 'fix', 'modificar'];
  const CODE_NOUNS = ['estilo', 'script', 'div', 'clase', 'archivo', 'file', 'codigo', 'logic', 'hook', 'style'];

  const containsCodeNoun = CODE_NOUNS.some(n => p.includes(n));
  const hasCodeVerb = CODE_VERBS.some(v => p.startsWith(v + ' ') || p.includes(' ' + v + ' '));
  const hasTechKeyword = TECH_KEYWORDS.some(k => p.includes(k));

  if (hasCodeVerb || (containsCodeNoun && hasCreationVerb) || hasTechKeyword) return 'codegen';

  // Default to chat
  return 'chat';
}

/** IMPROVED: Extract code blocks from markdown with better filename detection */
export function extractChatCodeFiles(text: string): Record<string, StudioFile> | null {
  const files: Record<string, StudioFile> = {};

  // Improved regex that handles:
  // 1. ```tsx App.tsx
  // 2. ```tsx // src/App.tsx
  // 3. ```tsx
  // 4. Different languages
  const blockRegex = /```(\w+)(?:\s*\n|\s+)(?:\/\/\s*)?([^\n`]*?)\n([\s\S]*?)```/gi;
  let match;
  let count = 0;

  while ((match = blockRegex.exec(text)) !== null) {
    const rawLang = match[1].toLowerCase().trim();
    const firstLine = match[2].trim();
    const content = match[3];

    // Determine filename - check multiple patterns
    let filename: string | null = null;

    // Pattern 1: Filename right after language (```tsx App.tsx)
    // Pattern 2: Comment with path (```tsx // src/App.tsx)
    // Pattern 3: Plain comment (```tsx // App.tsx)
    if (firstLine) {
      // Check if first line looks like a filename
      const filenameMatch = firstLine.match(/(?:\/?(?:src\/)?)?([\w\-./]+\.(tsx|jsx|ts|js|css|html|json))$/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // If no filename found, use language-based default
    if (!filename) {
      const langMap: Record<string, string> = {
        'tsx': 'App.tsx', 'ts': 'utils.ts', 'jsx': 'App.jsx', 'js': 'script.js',
        'css': 'styles.css', 'html': 'index.html', 'json': 'package.json'
      };
      filename = langMap[rawLang] || (count === 0 ? 'App.tsx' : `Component${count}.tsx`);
    }

    // Normalize path - preserve src/ prefix if present
    if (filename.startsWith('./')) filename = filename.slice(2);
    // Don't strip src/ prefix, just clean double slashes
    filename = filename.replace(/\/+/g, '/');

    files[filename] = {
      content: content.trim(),
      language: rawLang as any
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

/** SIMPLIFIED: Process AI response */
export function processRawResponse(rawText: string, prompt: string, isChatOnly: boolean) {
  if (!rawText) {
    console.warn('[processRawResponse] Empty response received');
    return null;
  }

  // 1. Try JSON extraction first
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
      return {
        files: normalizedFiles,
        explanation: extracted.explanation || '',
        tech_stack: extracted.tech_stack || [],
        deps: detectDeps(normalizedFiles),
        suggestions: buildSuggestions(extracted.tech_stack || [], prompt),
        isChatOnly: false
      };
    }
  }

  // 2. Fallback: extract code from markdown blocks
  const mdFiles = extractChatCodeFiles(rawText);
  if (mdFiles && Object.keys(mdFiles).length > 0) {
    const firstBlock = rawText.indexOf('```');
    const explanation = firstBlock > 0 ? rawText.slice(0, firstBlock).trim() : 'Código generado.';

    // Ensure we have essential files for a React project
    const ensuredFiles = ensureEssentialFiles(mdFiles);

    return {
      files: ensuredFiles,
      explanation,
      tech_stack: ['React', 'TypeScript', 'Tailwind'],
      deps: detectDeps(ensuredFiles),
      suggestions: buildSuggestions(['React'], prompt),
      isChatOnly: false
    };
  }

  // 3. Chat only response
  return {
    files: {} as Record<string, StudioFile>,
    explanation: rawText,
    tech_stack: [],
    deps: [],
    suggestions: [],
    isChatOnly: true
  };
}

/**
 * Ensures that essential files exist for a working React project
 */
function ensureEssentialFiles(files: Record<string, StudioFile>): Record<string, StudioFile> {
  const result = { ...files };

  // Check if we have at least one .tsx or .jsx file
  const hasComponentFile = Object.keys(result).some(name =>
    name.endsWith('.tsx') || name.endsWith('.jsx')
  );

  // If no component file, but we have HTML/CSS/JS, it's a vanilla project
  const hasHtmlFile = Object.keys(result).some(name => name.endsWith('.html'));
  const hasJsFile = Object.keys(result).some(name => name.endsWith('.js') && !name.includes('.json'));

  // For React projects (has TSX/JSX files)
  if (hasComponentFile && !hasHtmlFile) {
    // Ensure App.tsx exists
    const hasApp = Object.keys(result).some(name =>
      name === 'App.tsx' || name === 'App.jsx' || name.endsWith('/App.tsx') || name.endsWith('/App.jsx')
    );

    if (!hasApp) {
      // Find the first component file to use as App
      const firstComponent = Object.keys(result).find(name =>
        name.endsWith('.tsx') || name.endsWith('.jsx')
      );
      if (firstComponent) {
        result['App.tsx'] = result[firstComponent];
      }
    }
  }

  return result;
}

function detectDeps(files: Record<string, StudioFile>): string[] {
  const deps = new Set<string>();
  Object.values(files).forEach(f => {
    const content = f.content;
    if (content.includes('lucide-react')) deps.add('lucide-react');
    if (content.includes('framer-motion')) deps.add('framer-motion');
    if (content.includes('clsx') || content.includes('tailwind-merge')) deps.add('clsx tailwind-merge');
    if (content.includes('recharts')) deps.add('recharts');
  });
  return Array.from(deps);
}

function buildSuggestions(stack: string[], _prompt: string): string[] {
  const suggestions = ['Agregar modo oscuro', 'Optimizar para móviles', 'Añadir animaciones'];
  if (stack.includes('React')) suggestions.push('Agregar TypeScript strict');
  return suggestions;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH & FILE OPERATIONS (SIMPLIFIED - REMOVED COMPLEX PATCH SYSTEM)
// ═══════════════════════════════════════════════════════════════════════════════

export function extractPatchBlocks(_text: string): null {
  // PATCH SYSTEM REMOVED - Too complex and buggy
  return null;
}

export function extractDeleteCommands(text: string): string[] {
  const filesToDelete: string[] = [];

  // Simple pattern: "elimina archivo X" or "borra X"
  const explicitDeleteRegex = /(?:elimina|borra|delete|remove)\s+(?:el\s+)?(?:archivo|file)?\s*:?\s*`?([\w.\/\-]+)`?/gi;
  let match;
  while ((match = explicitDeleteRegex.exec(text)) !== null) {
    const filename = match[1].trim();
    if (filename.includes('.') && !filesToDelete.includes(filename)) {
      filesToDelete.push(filename);
    }
  }

  return filesToDelete;
}

export function applyPatchToFiles(
  _text: string,
  projectFiles: Record<string, StudioFile>
): Record<string, StudioFile> {
  // PATCH SYSTEM REMOVED - Files are replaced entirely
  return projectFiles;
}

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
  const newFiles: string[] = [];

  // Process deletes
  const deletes = extractDeleteCommands(text);
  for (const filename of deletes) {
    if (result[filename]) {
      delete result[filename];
      deletedFiles.push(filename);
    }
  }

  // Extract new files
  const newFileBlocks = extractChatCodeFiles(text);
  if (newFileBlocks) {
    for (const [filename, fileData] of Object.entries(newFileBlocks)) {
      if (!result[filename]) {
        newFiles.push(filename);
      }
      result[filename] = fileData;
    }
  }

  return {
    files: result,
    deletedFiles,
    patchedFiles: [], // PATCH SYSTEM REMOVED
    newFiles
  };
}

export function wantsProjectReset(prompt: string): boolean {
  const p = prompt.toLowerCase().trim();
  const resetKeywords = [
    'limpia todo', 'borra todo', 'empezar de cero', 'resetear proyecto',
    'nuevo proyecto', 'clear all', 'start fresh', 'reset project',
    'elimina todo', 'desde cero', 'from scratch', 'clean slate'
  ];
  return resetKeywords.some(kw => p.includes(kw));
}

export function detectMissingDependencies(files: Record<string, StudioFile>): string[] {
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
    'zustand': 'zustand'
  };

  for (const file of Object.values(files)) {
    let match;
    const content = file.content;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (importPath.startsWith('.') || importPath === 'react' || importPath === 'react-dom') continue;

      const packageName = importPath.split('/')[0];
      if (dependencyMap[importPath]) {
        deps.add(dependencyMap[importPath]);
      } else if (dependencyMap[packageName]) {
        deps.add(dependencyMap[packageName]);
      }
    }
  }

  return Array.from(deps);
}

export function injectDependenciesIntoPackageJson(
  files: Record<string, StudioFile>,
  dependencies: string[]
): Record<string, StudioFile> {
  if (!dependencies || dependencies.length === 0) return files;

  const result = { ...files };
  const pkgFileKey = Object.keys(result).find(k => k.toLowerCase() === 'package.json') || 'package.json';
  const pkgFile = result[pkgFileKey] || { language: 'json', content: '{}' };

  let pkgJson: any;
  try {
    pkgJson = JSON.parse(pkgFile.content);
  } catch (e) {
    pkgJson = {};
  }

  if (!pkgJson.dependencies) pkgJson.dependencies = {};

  const pkgVersions: Record<string, string> = {
    'lucide-react': '^0.468.0',
    'framer-motion': '^11.0.0',
    'react-router-dom': '^6.0.0',
    'recharts': '^2.0.0',
    'zustand': '^4.0.0',
    'axios': '^1.0.0',
    'clsx': '^2.0.0',
    'tailwind-merge': '^2.0.0'
  };

  let changed = false;
  dependencies.forEach(dep => {
    if (!pkgJson.dependencies[dep]) {
      pkgJson.dependencies[dep] = pkgVersions[dep] || 'latest';
      changed = true;
    }
  });

  if (changed) {
    result[pkgFileKey] = {
      ...pkgFile,
      language: 'json',
      content: JSON.stringify(pkgJson, null, 2)
    };
  }

  return result;
}

export function isResponseTruncated(text: string): boolean {
  if (!text || text.length < 100) return false;

  // Count code blocks
  const openCodeBlocks = (text.match(/```[a-z]*/gi) || []).length;
  const closeCodeBlocks = (text.match(/```\s*(?:\n|$)/gm) || []).length;
  if (openCodeBlocks > closeCodeBlocks) return true;

  // Check for unclosed braces in TypeScript/JavaScript code
  // Only check within code blocks, not the whole text
  const codeBlocks = text.match(/```(?:tsx?|jsx?|js)?\n([\s\S]*?)```/g) || [];
  for (const block of codeBlocks) {
    const code = block.replace(/```[a-z]*\n?/, '').replace(/```$/, '');

    // Count braces, parentheses, brackets
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;

    // Allow small mismatches (1-2) but flag big mismatches
    if (Math.abs(openBraces - closeBraces) > 2) return true;
    if (Math.abs(openParens - closeParens) > 3) return true;
    if (Math.abs(openBrackets - closeBrackets) > 3) return true;

    // Check for incomplete export/function/component
    const hasIncompleteExport = code.includes('export') && !code.match(/export\s+(?:default\s+)?(?:function|class|const|interface|type)?\s*\w+/);
    if (hasIncompleteExport) return true;
  }

  // Check if ends mid-line with code-like patterns
  const lastLine = text.trim().split('\n').pop() || '';
  const endsMidCode = /[<\w]+\s*$/.test(lastLine) || // ends with opening tag or word
                     /[=:]\s*$/.test(lastLine) ||      // ends with assignment
                     /\(\s*$/.test(lastLine);          // ends with open paren

  if (endsMidCode && text.length > 500) return true;

  return false;
}
