import { type StudioFile } from '@/hooks/useStudioProjects';

export interface SandpackFile {
  code: string;
  active?: boolean;
}

// Figma bridge code template
export const figmaBridgeCode = `(function() {
  window.addEventListener('message', (e) => {
    if (e.data.type === 'FIGMA_EXTRACT_REQUEST') {
      try {
        const layers = document.querySelectorAll('*');
        const data = Array.from(layers).map(el => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const rgb = style.backgroundColor;
          const m = rgb.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
          const bg = m ? { r: parseInt(m[1])/255, g: parseInt(m[2])/255, b: parseInt(m[3])/255, a: m[4] ? parseFloat(m[4]) : 1 } : null;
          return {
            name: el.tagName + (el.id ? '#' + el.id : ''),
            x: rect.x, y: rect.y, width: rect.width, height: rect.height,
            backgroundColor: bg,
            fontSize: parseFloat(style.fontSize) || 12,
          };
        });
        window.parent.postMessage({ type: 'FIGMA_EXTRACT_RESULT', data }, '*');
      } catch (err) {
        window.parent.postMessage({ type: 'FIGMA_EXTRACT_ERROR', error: String(err) }, '*');
      }
    }
  });
  window.parent.postMessage({ type: 'FIGMA_BRIDGE_READY' }, '*');
})()`;

// Generate a wrapper main.tsx that sets up routing for multi-page projects
export function generateRouterWrapper(
  pages: { path: string; name: string; file: string }[],
  _files: Record<string, StudioFile>,
): string {
  const imports = pages.map((p, i) => {
    const importPath = './' + p.file.replace(/^(src\/)?/, '').replace(/\.(tsx|jsx)$/, '');
    return `import Page${i} from '${importPath}';`;
  }).join('\n');

  const routes = pages.map((p, i) =>
    `          <Route path="${p.path}" element={<RouteElement${i} />} />`
  ).join('\n');

  const routeElements = pages.map((p, i) =>
    `const RouteElement${i} = () => <Page${i} />;`
  ).join('\n');

  const navLinks = pages.map(p =>
    `            <NavLink to="${p.path}" className={({ isActive }) => \`nav-link \${isActive ? 'active' : ''}\`}>${p.name}</NavLink>`
  ).join('\n');

  return `import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
${imports}

${routeElements}

function NavBar() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '0 20px', height: '56px',
      background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <style>{\`
        .nav-link {
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-link:hover { color: #0f172a; background: rgba(0,0,0,0.03); }
        .nav-link.active { color: #3b82f6; background: rgba(59,130,246,0.08); shadow: 0 1px 2px rgba(59,130,246,0.05); }
      \`}</style>
${navLinks}
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF' }}>
        <NavBar />
        <main style={{ flex: 1, position: 'relative' }}>
          <Routes>
${routes}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
`;
}

export function toSandpackFiles(
  files: Record<string, StudioFile>,
  supabaseConfig: { url: string; anonKey: string } | null | undefined,
  isVanillaHtml: boolean
): Record<string, SandpackFile> {
  const result: Record<string, SandpackFile> = {};
  
  if (!files || typeof files !== 'object' || Array.isArray(files)) {
     console.error("[toSandpackFiles] Invalid files object received:", files);
     return {};
  }
  
  const ROOT_FILES = ['package.json', 'vite.config.js', 'vite.config.ts', 'tailwind.config.js', 'postcss.config.js', 'tsconfig.json', 'index.html', 'index.css'];
  let customPackageJson: { dependencies?: Record<string, string>; devDependencies?: Record<string, string>; name?: string } | null = null;

  Object.entries(files).forEach(([name, file]) => {
    if (!file || typeof file !== 'object') return;
    if (typeof file.content !== 'string') return;
    if (file.content === '__genesis_delete__') return; // skip deleted files
    
    const cleanName = name.replace(/^\//, '');
    let abs = '/' + cleanName;

    if (isVanillaHtml) {
      result[abs] = { code: file.content };
    } else {
      if (ROOT_FILES.includes(cleanName) || cleanName.startsWith('public/')) {
        if (cleanName === 'package.json') {
          try { 
            customPackageJson = JSON.parse(file.content); 
          } catch(e) {
            console.warn("Could not parse generated package.json", e);
          }
        }
      } else {
        if (!abs.startsWith('/src/')) abs = '/src' + abs;
      }
      result[abs] = { code: file.content };
    }
  });

  if (!isVanillaHtml) {
    const allKeys = Object.keys(result);

    // ── STEP 1: Detect or generate App.tsx ───────────────────────────────────
    const pages = Object.entries(files)
      .filter(([name]) => name.startsWith('pages/') || name.startsWith('src/pages/'))
      .map(([name]) => {
        const base = name.replace(/^(src\/)?pages\//, '').replace(/\.(tsx|jsx)$/, '');
        const path = base === 'index' || base === 'Home' ? '/' : '/' + base.toLowerCase();
        return { path, name: base, file: name };
      });

    if (pages.length > 1) {
      // Multi-page project: generate a router wrapper
      result['/src/App.tsx'] = { code: generateRouterWrapper(pages, files), active: true };
    } else if (!allKeys.includes('/src/App.tsx') && !allKeys.includes('/App.tsx') && !allKeys.includes('/src/App.jsx')) {
      // Single-file/component: pick the best candidate
      const candidateFiles = Object.keys(files).filter(n => n.endsWith('.tsx') || n.endsWith('.jsx'));

      let mainFile = candidateFiles.find(n =>
        n.toLowerCase().endsWith('app.tsx') ||
        n.toLowerCase().endsWith('app.jsx') ||
        n.toLowerCase().endsWith('main.tsx') ||
        n.toLowerCase().endsWith('index.tsx') ||
        n.toLowerCase().endsWith('dashboard.tsx')
      );

      if (!mainFile && candidateFiles.length > 0) {
        mainFile = candidateFiles.sort((a, b) => (files[b].content?.length || 0) - (files[a].content?.length || 0))[0];
      }

      if (mainFile) {
        const targetPath = '/src/' + mainFile.replace(/^(\/?src\/)/, '');
        result[targetPath] = { code: files[mainFile].content, active: true };
        if (targetPath !== '/src/App.tsx') {
          // Re-export so main.tsx can always import from './App'
          const importPath = targetPath.replace('/src/', '').replace(/\.(tsx|jsx)$/, '');
          result['/src/App.tsx'] = { 
            code: `export { default } from './${importPath}';`,
            active: false 
          };
        }
      }
    }

    // ── STEP 2: Always guarantee a valid main.tsx ─────────────────────────────
    // The Sandpack react-ts template needs /src/main.tsx to mount the app.
    // If the user's generated code already has one, respect it.
    // Otherwise inject a clean one.
    if (!result['/src/main.tsx']) {
      const userIndexCss = !!result['/src/index.css'];
      result['/src/main.tsx'] = {
        code: `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
${userIndexCss ? "import './index.css';" : ''}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}`,
      };
    }

    // ── STEP 3: Always guarantee a valid index.html ───────────────────────────
    // Without a proper index.html the preview iframe has no entry point.
    if (!result['/index.html']) {
      result['/index.html'] = {
        code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Genesis Studio</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      };
    }

    // ── STEP 4: Figma bridge ──────────────────────────────────────────────────
    result['/src/figma-bridge.js'] = { code: figmaBridgeCode };
    
    // ── STEP 5: Merge dependencies ────────────────────────────────────────────
    const baseDependencies = {
      'react': '^18.0.0', 'react-dom': '^18.0.0', 'lucide-react': '^0.468.0',
      'clsx': '^2.0.0', 'tailwind-merge': '^2.0.0', 'framer-motion': '^11.0.0',
      'react-router-dom': '^6.0.0', 'recharts': '^2.0.0', 'axios': '^1.0.0', 'zustand': '^4.0.0',
      '@headlessui/react': '^2.0.0', '@heroicons/react': '^2.0.0',
      ...(supabaseConfig ? { '@supabase/supabase-js': '^2.0.0' } : {}),
    };

    const finalDeps = customPackageJson?.dependencies
      ? { ...baseDependencies, ...customPackageJson.dependencies }
      : baseDependencies;

    result['/package.json'] = {
      code: JSON.stringify({
        name: customPackageJson?.name || 'genesis-studio-app',
        type: 'module',
        dependencies: finalDeps,
        devDependencies: customPackageJson?.devDependencies || {
          "vite": "^5.0.0",
          "tailwindcss": "^3.4.0",
          "autoprefixer": "^10.4.0",
          "postcss": "^8.4.0",
          "@vitejs/plugin-react": "^4.2.0"
        }
      }, null, 2)
    };
  }

  return result;
}

