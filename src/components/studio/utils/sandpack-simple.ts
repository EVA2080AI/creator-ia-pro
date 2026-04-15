import type { StudioFile } from '@/hooks/useStudioProjects';

export interface SandpackFile {
  code: string;
  active?: boolean;
}

/**
 * Convierte archivos del usuario a formato Sandpack (versión simplificada)
 */
export function toSandpackFiles(
  files: Record<string, StudioFile>,
  _supabaseConfig?: { url: string; anonKey: string } | null
): Record<string, SandpackFile> {
  const result: Record<string, SandpackFile> = {};

  if (!files || typeof files !== 'object') {
    return result;
  }

  // Copiar archivos del usuario
  Object.entries(files).forEach(([name, file]) => {
    if (!file || typeof file !== 'object' || typeof file.content !== 'string') {
      return;
    }

    const cleanName = name.replace(/^\//, '');
    let path: string;

    // Archivos raíz van a /, el resto a /src/
    const rootFiles = ['package.json', 'index.html', 'tsconfig.json', 'vite.config.ts', 'tailwind.config.js'];

    // Si ya tiene src/ al inicio, preservar la ruta completa
    if (cleanName.startsWith('src/')) {
      path = '/' + cleanName;
    } else if (rootFiles.includes(cleanName) || cleanName.startsWith('public/')) {
      path = '/' + cleanName;
    } else {
      path = '/src/' + cleanName;
    }

    result[path] = { code: file.content };
  });

  // Crear App.tsx si no existe (usando el primer componente encontrado)
  if (!result['/src/App.tsx'] && !result['/App.tsx']) {
    const componentFiles = Object.keys(files).filter(n =>
      n.endsWith('.tsx') || n.endsWith('.jsx')
    );

    if (componentFiles.length > 0) {
      const mainFile = componentFiles[0];
      const content = files[mainFile].content;

      // Si el archivo tiene export default, usarlo directamente
      if (content.includes('export default')) {
        result['/src/App.tsx'] = { code: content, active: true };
      } else {
        // Wrap como App
        result['/src/App.tsx'] = {
          code: `import React from 'react';
import Component from './${mainFile.replace(/\.(tsx|jsx)$/, '')}';

export default function App() {
  return <Component />;
}`,
          active: false
        };
      }
    } else {
      // App.tsx por defecto
      result['/src/App.tsx'] = {
        code: `export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <h1 className="text-2xl font-bold text-zinc-900">Genesis Studio</h1>
    </div>
  );
}`,
        active: true
      };
    }
  }

  // Crear main.tsx si no existe
  if (!result['/src/main.tsx']) {
    const hasIndexCss = !!result['/src/index.css'] || !!result['/index.css'];

    result['/src/main.tsx'] = {
      code: `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
${hasIndexCss ? "import './index.css';" : ''}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}`
    };
  }

  // Crear index.html si no existe
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
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
    };
  }

  // Crear package.json si no existe
  if (!result['/package.json']) {
    const deps = new Set<string>();

    // Detectar dependencias de los imports
    Object.values(files).forEach(file => {
      if (!file.content) return;

      const importRegex = /from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(file.content)) !== null) {
        const pkg = match[1].split('/')[0];
        if (pkg !== 'react' && pkg !== 'react-dom' && !pkg.startsWith('.')) {
          deps.add(pkg);
        }
      }
    });

    const dependencies: Record<string, string> = {
      'react': '^18.0.0',
      'react-dom': '^18.0.0',
      'lucide-react': '^0.468.0'
    };

    deps.forEach(dep => {
      dependencies[dep] = 'latest';
    });

    result['/package.json'] = {
      code: JSON.stringify({
        name: 'genesis-project',
        type: 'module',
        dependencies
      }, null, 2)
    };
  }

  return result;
}
