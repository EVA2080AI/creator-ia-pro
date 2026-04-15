import { StudioFile } from '@/hooks/useStudioProjects';

/** Tipos de intención del chat */
export type ChatIntent = 'chat' | 'code' | 'landing' | 'component';

/** Detecta qué quiere hacer el usuario */
export function detectIntent(prompt: string): ChatIntent {
  const p = prompt.toLowerCase().trim();

  // Landing page detection
  const landingKeywords = ['landing', 'pagina de inicio', 'home page', 'sitio web', 'website',
    'pagina web', 'página web', 'marketing', 'portfolio', 'portafolio', ' Agency', 'startup'];
  if (landingKeywords.some(k => p.includes(k))) return 'landing';

  // Component detection
  const componentKeywords = ['componente', 'component', 'button', 'boton', 'card', 'input', 'modal'];
  if (componentKeywords.some(k => p.includes(k))) return 'component';

  // Code detection
  const codeVerbs = ['crea', 'haz', 'genera', 'build', 'make', 'create', 'code', 'programa'];
  const codeNouns = ['pagina', 'page', 'app', 'aplicacion', 'formulario', 'form', 'dashboard'];

  const hasCodeVerb = codeVerbs.some(v => p.includes(v));
  const hasCodeNoun = codeNouns.some(n => p.includes(n));

  if (hasCodeVerb && hasCodeNoun) return 'code';

  return 'chat';
}

/** Extrae archivos de bloques de código markdown */
export function extractCodeBlocks(text: string): Record<string, StudioFile> | null {
  const files: Record<string, StudioFile> = {};

  // Patrón mejorado para bloques de código
  const codeBlockRegex = /```(?:tsx?|jsx?|css|html|json)?\s*(?:\/\/)?\s*([^\n]*)\n?([\s\S]*?)```/g;

  let match;
  let count = 0;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const possibleFilename = match[1]?.trim();
    const content = match[2].trim();

    // Detectar lenguaje del bloque
    const langMatch = text.slice(match.index, match.index + 20).match(/```(\w+)/);
    const lang = langMatch ? langMatch[1].toLowerCase() : 'tsx';

    // Determinar nombre de archivo
    let filename: string;

    if (possibleFilename && possibleFilename.match(/[\w\-]+\.(tsx|jsx|ts|js|css|html|json)$/)) {
      // El nombre está en la primera línea del bloque
      filename = possibleFilename.replace(/^\/\//, '').trim();
    } else if (possibleFilename && !possibleFilename.includes(' ')) {
      // Parece ser un nombre de archivo simple
      filename = possibleFilename;
    } else {
      // Generar nombre por defecto basado en el lenguaje
      const defaultNames: Record<string, string> = {
        'tsx': 'App.tsx', 'ts': 'utils.ts', 'jsx': 'App.jsx', 'js': 'script.js',
        'css': 'styles.css', 'html': 'index.html', 'json': 'package.json'
      };
      filename = defaultNames[lang] || `file${count}.${lang}`;
    }

    // Normalizar path
    if (filename.startsWith('src/')) filename = filename.slice(4);
    if (filename.startsWith('./')) filename = filename.slice(2);

    files[filename] = { content, language: lang as any };
    count++;
  }

  return Object.keys(files).length > 0 ? files : null;
}

/** Procesa la respuesta de la IA y extrae código */
export function processAIResponse(text: string): {
  files: Record<string, StudioFile>;
  explanation: string;
  hasCode: boolean;
} {
  if (!text) {
    return { files: {}, explanation: '', hasCode: false };
  }

  // Extraer bloques de código
  const files = extractCodeBlocks(text) || {};

  // Extraer explicación (texto antes del primer bloque de código)
  const firstCodeBlock = text.indexOf('```');
  const explanation = firstCodeBlock > 0
    ? text.slice(0, firstCodeBlock).trim()
    : text.trim();

  return {
    files,
    explanation,
    hasCode: Object.keys(files).length > 0
  };
}

/** Detecta dependencias de los imports */
export function detectDependencies(files: Record<string, StudioFile>): string[] {
  const deps = new Set<string>();
  const importRegex = /from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g;

  const knownDeps: Record<string, string> = {
    'lucide-react': 'lucide-react',
    'framer-motion': 'framer-motion',
    'recharts': 'recharts',
    '@supabase/supabase-js': '@supabase/supabase-js',
    'react-router-dom': 'react-router-dom',
    'axios': 'axios',
    'zustand': 'zustand',
    'clsx': 'clsx',
    'tailwind-merge': 'tailwind-merge'
  };

  Object.values(files).forEach(file => {
    let match;
    while ((match = importRegex.exec(file.content)) !== null) {
      const importPath = match[1] || match[2];
      if (!importPath) continue;

      // Ignorar imports relativos y de React
      if (importPath.startsWith('.') || importPath === 'react' || importPath === 'react-dom') {
        continue;
      }

      const packageName = importPath.split('/')[0];

      if (knownDeps[importPath]) {
        deps.add(knownDeps[importPath]);
      } else if (knownDeps[packageName]) {
        deps.add(knownDeps[packageName]);
      }
    }
  });

  return Array.from(deps);
}

/** Prepara archivos para Sandpack (simplificado) */
export function prepareForPreview(
  files: Record<string, StudioFile>,
  isLanding: boolean = false
): Record<string, { code: string }> {
  const result: Record<string, { code: string }> = {};

  // Copiar archivos del usuario
  Object.entries(files).forEach(([name, file]) => {
    if (!file || !file.content) return;

    let path = name.startsWith('/') ? name : `/${name}`;
    if (!path.startsWith('/src/') && !path.startsWith('/index.html') && !path.startsWith('/package.json')) {
      path = '/src' + path;
    }
    result[path] = { code: file.content };
  });

  // Asegurar main.tsx para React
  if (!result['/src/main.tsx'] && !result['/main.tsx']) {
    result['/src/main.tsx'] = {
      code: `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}`
    };
  }

  // Asegurar index.html
  if (!result['/index.html']) {
    result['/index.html'] = {
      code: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Genesis Studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`
    };
  }

  // Package.json básico
  if (!result['/package.json']) {
    const deps = detectDependencies(files);
    const depsObj: Record<string, string> = {};
    deps.forEach(d => {
      depsObj[d] = 'latest';
    });

    result['/package.json'] = {
      code: JSON.stringify({
        name: 'genesis-project',
        type: 'module',
        dependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0',
          'lucide-react': '^0.468.0',
          ...depsObj
        }
      }, null, 2)
    };
  }

  return result;
}
