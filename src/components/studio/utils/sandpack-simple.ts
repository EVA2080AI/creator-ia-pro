import type { StudioFile } from '@/hooks/useStudioProjects';
import { SANDPACK_BASE_FILES, SHADCN_DEPENDENCIES } from './shadcn-base';

export interface SandpackFile {
  code: string;
  active?: boolean;
}

/**
 * Convierte archivos del usuario a formato Sandpack (versión simplificada)
 *
 * Inyecta automáticamente la base shadcn/ui + lib/utils + tsconfig (con path alias @/*)
 * antes de los archivos del usuario, para que los componentes generados por la IA
 * puedan hacer `import { Button } from '@/components/ui/button'` sin fricción.
 */
export function toSandpackFiles(
  files: Record<string, StudioFile>,
  supabaseConfig?: { url: string; anonKey: string } | null,
  isVanillaHtml: boolean = false
): Record<string, SandpackFile> {
  const result: Record<string, SandpackFile> = {};

  if (!files || typeof files !== 'object') {
    return result;
  }

  // Inyectar base shadcn/ui (solo en proyectos React, NO en HTML vanilla)
  if (!isVanillaHtml) {
    Object.entries(SANDPACK_BASE_FILES).forEach(([path, code]) => {
      result[path] = { code };
    });

    // Pack G — Supabase client (siempre se inyecta; si el user configuró
    // Supabase vía StudioCloud, usamos sus creds; si no, placeholder que
    // muestra mensaje claro al fallar)
    const supaUrl = supabaseConfig?.url ?? 'https://YOUR_PROJECT.supabase.co';
    const supaKey = supabaseConfig?.anonKey ?? 'YOUR_ANON_KEY';
    const hasConfig = !!supabaseConfig?.url && !!supabaseConfig?.anonKey;
    result['/src/lib/supabase.ts'] = {
      code: `import { createClient } from '@supabase/supabase-js';

// ${hasConfig ? 'Configurado vía StudioCloud — credenciales reales del proyecto.' : 'Placeholder — configura Supabase en StudioCloud o reemplaza estas constantes.'}
const SUPABASE_URL = ${JSON.stringify(supaUrl)};
const SUPABASE_ANON_KEY = ${JSON.stringify(supaKey)};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isSupabaseConfigured = ${hasConfig};
`,
    };
  }

  // Copiar archivos del usuario (sobrescriben la base si coinciden de path)
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

  // Para proyectos HTML vanilla, no necesitamos crear archivos React
  if (isVanillaHtml) {
    // Asegurar que package.json existe para HTML vanilla
    if (!result['/package.json']) {
      result['/package.json'] = {
        code: JSON.stringify({
          name: 'html-project',
          type: 'module',
          dependencies: {}
        }, null, 2)
      };
    }
    return result;
  }

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

  // Crear main.tsx si no existe — auto-wrap con TooltipProvider + Toaster
  // para que la IA no tenga que recordar incluirlos
  if (!result['/src/main.tsx']) {
    const hasIndexCss = !!result['/src/index.css'] || !!result['/index.css'];

    result['/src/main.tsx'] = {
      code: `import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import App from './App';
import './globals.css';
${hasIndexCss ? "import './index.css';" : ''}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

// Genesis URL bar bridge — escucha postMessages del parent (StudioPreview)
// para permitir navegación cross-origin desde el URL bar / quick nav buttons
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'GENESIS_NAVIGATE' && typeof data.path === 'string') {
      window.history.pushState({}, '', data.path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    if (data.type === 'GENESIS_BACK') window.history.back();
    if (data.type === 'GENESIS_FORWARD') window.history.forward();
    if (data.type === 'GENESIS_RELOAD') window.location.reload();
  });
  // Notifica al parent cada vez que la ruta cambia (para sincronizar URL bar)
  const notify = () => window.parent?.postMessage({ type: 'GENESIS_ROUTE_CHANGED', path: window.location.pathname }, '*');
  window.addEventListener('popstate', notify);
  const origPushState = window.history.pushState;
  window.history.pushState = function (...args) {
    origPushState.apply(window.history, args);
    notify();
  };
  setTimeout(notify, 100);
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider delayDuration={200}>
          <App />
          <Toaster />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}`
    };
  }

  // Crear index.html si no existe — Tailwind CDN + config con HSL theme vars
  // para que la IA pueda usar bg-primary, text-foreground, border-border, etc.
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
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
          extend: {
            colors: {
              border: 'hsl(var(--border))',
              input: 'hsl(var(--input))',
              ring: 'hsl(var(--ring))',
              background: 'hsl(var(--background))',
              foreground: 'hsl(var(--foreground))',
              primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
              secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
              destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
              muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
              accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
              popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
              card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' }
            },
            borderRadius: {
              lg: 'var(--radius)',
              md: 'calc(var(--radius) - 2px)',
              sm: 'calc(var(--radius) - 4px)'
            }
          }
        }
      }
    </script>
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
      'lucide-react': '^0.468.0',
      'framer-motion': '^11.0.0',
      // shadcn/ui core deps (Radix + cva + clsx + tailwind-merge)
      ...SHADCN_DEPENDENCIES,
    };

    deps.forEach(dep => {
      // No sobrescribir versiones fijadas
      if (!dependencies[dep]) dependencies[dep] = 'latest';
      // Agregar react-is automáticamente si se usa recharts
      if (dep === 'recharts') {
        dependencies['react-is'] = '^18.0.0';
      }
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
