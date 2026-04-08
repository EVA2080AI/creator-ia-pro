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
  supabaseConfig: any,
  isVanillaHtml: boolean
): Record<string, SandpackFile> {
  const result: Record<string, SandpackFile> = {};
  
  if (!files || typeof files !== 'object' || Array.isArray(files)) {
     console.error("[toSandpackFiles] Invalid files object received:", files);
     return {};
  }
  
  const ROOT_FILES = ['package.json', 'vite.config.js', 'vite.config.ts', 'tailwind.config.js', 'postcss.config.js', 'tsconfig.json', 'index.html', 'index.css'];
  let customPackageJson: any = null;

  Object.entries(files).forEach(([name, file]) => {
    if (!file || typeof file !== 'object') return;
    let cleanName = name.replace(/^\//, '');
    let abs = '/' + cleanName;

    if (isVanillaHtml) {
      result[abs] = { code: file.content };
    } else {
      if (ROOT_FILES.includes(cleanName) || cleanName.startsWith('public/')) {
        // Keep at root
        if (cleanName === 'package.json') {
          try {
            customPackageJson = JSON.parse(file.content);
          } catch(e) {}
        }
      } else {
        if (!abs.startsWith('/src/')) abs = '/src' + abs;
      }
      result[abs] = { code: file.content };
    }
  });

  if (!isVanillaHtml) {
    const pages = Object.entries(files)
      .filter(([name]) => name.startsWith('pages/') || name.startsWith('src/pages/'))
      .map(([name]) => {
        const base = name.replace(/^(src\/)?pages\//, '').replace(/\.(tsx|jsx)$/, '');
        const path = base === 'index' || base === 'Home' ? '/' : '/' + base.toLowerCase();
        return { path, name: base, file: name };
      });

    if (pages.length > 1) {
      result['/src/App.tsx'] = { code: generateRouterWrapper(pages, files), active: true };
    } else if (!result['/src/App.tsx'] && !result['/App.tsx'] && !result['/src/App.jsx']) {
      const mainFile = Object.keys(files).find(n => n.endsWith('index.tsx') || n.endsWith('main.tsx') || n.endsWith('App.tsx') || n.endsWith('App.jsx'));
      if (mainFile) {
         result['/src/App.tsx'] = { code: files[mainFile].content, active: true };
      }
    }
    
    result['/src/figma-bridge.js'] = { code: figmaBridgeCode };
    
    // Merge dependencies intelligently
    const baseDependencies = {
      'react': '^18.0.0', 'react-dom': '^18.0.0', 'lucide-react': '^0.468.0',
      'clsx': '^2.0.0', 'tailwind-merge': '^2.0.0', 'framer-motion': '^11.0.0',
      'react-router-dom': '^6.0.0', 'recharts': '^2.0.0', 'axios': '^1.0.0', 'zustand': '^4.0.0',
      ...(supabaseConfig ? { '@supabase/supabase-js': '^2.0.0' } : {}),
    };

    const finalDeps = customPackageJson?.dependencies ? { ...baseDependencies, ...customPackageJson.dependencies } : baseDependencies;

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
