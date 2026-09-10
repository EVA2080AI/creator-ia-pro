import { type StudioFile } from '@/hooks/useStudioProjects';

export interface SandpackFile {
  code: string;
  active?: boolean;
}

/**
 * Convierte archivos del usuario a formato Sandpack (VERSIÓN SIMPLIFICADA)
 */
export function toSandpackFiles(
  files: Record<string, StudioFile>,
  _supabaseConfig?: { url: string; anonKey: string } | null | undefined,
  isVanillaHtml: boolean = false
): Record<string, SandpackFile> {
  const result: Record<string, SandpackFile> = {};

  if (!files || typeof files !== 'object' || Array.isArray(files)) {
    console.error("[toSandpackFiles] Invalid files object:", files);
    return result;
  }

  // Copiar archivos del usuario
  Object.entries(files).forEach(([name, file]) => {
    if (!file || typeof file !== 'object' || typeof file.content !== 'string') {
      return;
    }

    const cleanName = name.replace(/^\//, '');
    let abs: string;

    if (isVanillaHtml) {
      abs = '/' + cleanName;
      result[abs] = { code: file.content };
    } else {
      // Archivos raíz van a /, el resto a /src/
      const rootFiles = ['package.json', 'index.html', 'tsconfig.json', 'vite.config.ts', 'tailwind.config.js'];

      // Si el archivo ya tiene src/ en el nombre, preservarlo
      if (cleanName.startsWith('src/')) {
        abs = '/' + cleanName;
      } else if (rootFiles.includes(cleanName) || cleanName.startsWith('public/')) {
        abs = '/' + cleanName;
      } else {
        abs = '/src/' + cleanName;
      }
      result[abs] = { code: file.content };
    }
  });

  // Si es vanilla HTML, no necesitamos más
  if (isVanillaHtml) {
    return result;
  }

  // Para React: Asegurar archivos esenciales
  const allKeys = Object.keys(result);

  // Crear App.tsx si no existe
  if (!allKeys.includes('/src/App.tsx') && !allKeys.includes('/App.tsx')) {
    // Buscar componente principal
    const componentFiles = Object.keys(files).filter(n =>
      n.endsWith('.tsx') || n.endsWith('.jsx')
    );

    if (componentFiles.length > 0) {
      // Usar el primer archivo como App
      const mainFile = componentFiles[0];
      const content = files[mainFile].content;

      if (content.includes('export default')) {
        result['/src/App.tsx'] = { code: content, active: true };
      } else {
        // Wrap como App
        result['/src/App.tsx'] = {
          code: `export { default } from './${mainFile.replace(/\.tsx?$/, '')}';`,
          active: true
        };
      }
    } else {
      // App por defecto
      result['/src/App.tsx'] = {
        code: `export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <h1 className="text-2xl font-bold text-zinc-900">Basalt Studio</h1>
    </div>
  );
}`,
        active: true
      };
    }
  }

  // Crear main.tsx si no existe
  if (!result['/src/main.tsx']) {
    const hasIndexCss = !!result['/src/index.css'];
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
    <title>Basalt Studio</title>
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
    // Detectar dependencias de los imports
    const deps = new Set<string>();
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

/**
 * Genera un wrapper de router (SIMPLIFICADO - solo para casos simples)
 */
export function generateRouterWrapper(
  pages: { path: string; name: string; file: string }[],
  _files: Record<string, StudioFile>
): string {
  const imports = pages.map((p, i) => {
    const importPath = './' + p.file.replace(/^(src\/)?/, '').replace(/\.(tsx|jsx)$/, '');
    return `import Page${i} from '${importPath}';`;
  }).join('\n');

  const routes = pages.map((p, i) =>
    `      <Route path="${p.path}" element={<Page${i} />} />`
  ).join('\n');

  return `import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
${imports}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
${routes}
      </Routes>
    </BrowserRouter>
  );
}
`;
}

// Figma bridge (mantenido para compatibilidad)
export const figmaBridgeCode = `(function() {
  window.addEventListener('message', (e) => {
    if (e.data.type === 'FIGMA_EXTRACT_REQUEST') {
      try {
        const data = { ready: true, url: window.location.href };
        window.parent.postMessage({ type: 'FIGMA_EXTRACT_RESULT', data }, '*');
      } catch (err) {
        window.parent.postMessage({ type: 'FIGMA_EXTRACT_ERROR', error: String(err) }, '*');
      }
    }
  });
})()`;
