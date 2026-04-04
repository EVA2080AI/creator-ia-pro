import { useState, useMemo, useEffect, useRef } from 'react';
import {
  SandpackProvider,
  SandpackPreview,
  SandpackLayout,
  useSandpackConsole,
} from '@codesandbox/sandpack-react';
import {
  RotateCcw, Monitor, Smartphone, Tablet, ExternalLink,
  ZoomIn, ZoomOut, Zap, Code, Cloud, Bot
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { StudioFile } from '@/hooks/useStudioProjects';
import type { SupabaseConfig } from './StudioCloud';
import { toast } from 'sonner';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

import { StudioViewToolbar } from './StudioViewToolbar';

interface StudioPreviewProps {
  files: Record<string, StudioFile>;
  deviceMode?: DeviceMode;
  onDeviceModeChange?: (mode: DeviceMode) => void;
  isGenerating?: boolean;
  streamChars?: number;
  streamPreview?: string;
  supabaseConfig?: SupabaseConfig | null;
  onError?: (error: string) => void;
  
  // Toolbar Props
  viewMode: 'preview' | 'code';
  onToggleViewMode: (mode: 'preview' | 'code') => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onRefreshProject?: () => void;
  onShare?: () => void;
}

// Known entry file names in priority order
const ENTRY_NAMES = [
  'App.tsx','app.tsx','App.jsx','app.jsx',
  'index.tsx','index.jsx','main.tsx','main.jsx',
  'src/App.tsx','src/app.tsx','src/index.tsx','src/main.tsx',
];

// Hint that a file contains JSX / React
const JSX_HINT = /return\s*\(?\s*<|useState\s*\(|useEffect\s*\(|React\.|<[A-Z][A-Za-z]/;

// Detect page files — files that look like individual pages/routes
const PAGE_PATTERNS = [
  /^pages\/(\w+)\.(tsx|jsx)$/,
  /^src\/pages\/(\w+)\.(tsx|jsx)$/,
  /^routes\/(\w+)\.(tsx|jsx)$/,
  /^views\/(\w+)\.(tsx|jsx)$/,
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function detectPages(files: Record<string, StudioFile>): { path: string; name: string; file: string }[] {
  const pages: { path: string; name: string; file: string }[] = [];
  for (const filename of Object.keys(files)) {
    for (const pattern of PAGE_PATTERNS) {
      const match = filename.match(pattern);
      if (match) {
        const name = match[1];
        const isHome = name.toLowerCase() === 'home' || name.toLowerCase() === 'index';
        pages.push({
          path: isHome ? '/' : `/${slugify(name)}`,
          name: name,
          file: filename,
        });
        break;
      }
    }
  }
  // Sort: home first
  pages.sort((a, b) => (a.path === '/' ? -1 : b.path === '/' ? 1 : a.name.localeCompare(b.name)));
  return pages;
}

// Generate a wrapper main.tsx that sets up routing for multi-page projects
function generateRouterWrapper(
  pages: { path: string; name: string; file: string }[],
  files: Record<string, StudioFile>,
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
      display: 'flex', alignItems: 'center', gap: '4px',
      padding: '0 16px', height: '48px',
      background: 'rgba(15,16,20,0.95)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <style>{\`
        .nav-link {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          transition: all 0.15s;
        }
        .nav-link:hover { color: white; background: rgba(255,255,255,0.08); }
        .nav-link.active { color: white; background: rgba(138,180,248,0.15); }
      \`}</style>
${navLinks}
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
${routes}
        <Route path="*" element={<RouteElement0 />} />
      </Routes>
    </BrowserRouter>
  );
}
`;
}

// Map our file records → Sandpack files, with multi-page routing support
function toSandpackFiles(
  files: Record<string, StudioFile>,
  supabaseConfig?: SupabaseConfig | null,
  isVanilla?: boolean,
): Record<string, { code: string; active?: boolean }> | null {
  if (Object.keys(files).length === 0) return null;

  const result: Record<string, { code: string; active?: boolean }> = {};

  if (supabaseConfig) {
    result['/supabaseClient.ts'] = {
      code: `import { createClient } from '@supabase/supabase-js';\nexport const supabase = createClient('${supabaseConfig.url}', '${supabaseConfig.anonKey}');\n`,
    };
  }

  const pages = detectPages(files);
  const isMultiPage = pages.length >= 2;

  if (isMultiPage) {
    Object.entries(files).forEach(([name, file]) => {
      const abs = (name.startsWith('/') ? name : `/${name}`).replace(/^\/src\//, '/src/');
      result[abs] = { code: file.content };
    });
    result['/App.tsx'] = { code: generateRouterWrapper(pages, files), active: true };
  } else {
    let entryContent: string | null = null;
    let entryOrigName: string | null = null;

    for (const name of ENTRY_NAMES) {
      if (files[name]) { entryContent = files[name].content; entryOrigName = name; break; }
    }
    
    if (entryContent) {
      Object.entries(files).forEach(([name, file]) => {
        if (name === entryOrigName) return;
        const abs = (name.startsWith('/') ? name : `/${name}`).replace(/^\/src\//, '/src/');
        result[abs] = { code: file.content };
      });
      result['/App.tsx'] = { code: entryContent, active: true };
    } else {
      Object.entries(files).forEach(([name, file]) => {
        const abs = (name.startsWith('/') ? name : `/${name}`).replace(/^\/src\//, '/src/');
        result[abs] = { code: file.content, active: name.endsWith('.html') };
      });
    }
  }

  const figmaBridgeCode = `(function() {
    window.addEventListener('message', async (e) => {
      if (e.data.type === 'FIGMA_EXTRACT') {
        try {
          const root = document.getElementById('root') || document.body;
          const data = extractNode(root);
          window.parent.postMessage({ type: 'FIGMA_EXTRACT_RESULT', data }, '*');
        } catch (err) {
          window.parent.postMessage({ type: 'FIGMA_EXTRACT_ERROR', error: err.message }, '*');
        }
      }
    });
    function rgbToFigma(rgb) {
      if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return null;
      const m = rgb.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
      if(!m) return null;
      return { r: m[1]/255, g: m[2]/255, b: m[3]/255, a: m[4] ? parseFloat(m[4]) : 1 };
    }
    function extractNode(el) {
      if (el.nodeType === 3) {
        const text = el.textContent.trim();
        if (!text) return null;
        const parentStyle = window.getComputedStyle(el.parentElement);
        const range = document.createRange();
        range.selectNode(el);
        const rect = range.getBoundingClientRect();
        return {
          type: 'TEXT',
          name: text.substring(0, 30),
          characters: text,
          x: rect.x, y: rect.y, width: rect.width, height: rect.height,
          fontSize: parseInt(parentStyle.fontSize),
          fontFamily: parentStyle.fontFamily,
          fills: [{ type: 'SOLID', color: rgbToFigma(parentStyle.color) || { r: 0, g: 0, b: 0 } }]
        };
      }
      if (el.nodeType !== 1) return null;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const node = { type: 'FRAME', name: el.tagName, x: rect.x, y: rect.y, width: rect.width, height: rect.height, fills: [], children: [] };
      const bgColor = rgbToFigma(style.backgroundColor);
      if (bgColor) node.fills.push({ type: 'SOLID', color: bgColor });
      Array.from(el.childNodes).forEach(child => {
        const extracted = extractNode(child);
        if (extracted) node.children.push(extracted);
      });
      return node;
    }
    window.parent.postMessage({ type: 'FIGMA_BRIDGE_READY' }, '*');
  })()`;

  if (!isVanilla) {
    // 1. Force package.json to trigger Vite environment
    result['/package.json'] = {
      code: JSON.stringify({
        name: "genesis-preview",
        private: true,
        type: "module",
        dependencies: {
          "react": "^18.3.1",
          "react-dom": "^18.3.1",
          "framer-motion": "^11.0.0",
          "lucide-react": "^0.460.0",
          "clsx": "^2.1.1",
          "tailwind-merge": "^2.5.4"
        },
        devDependencies: {
          "vite": "^5.4.10",
          "@vitejs/plugin-react": "^4.3.3",
          "typescript": "^5.6.3",
          "autoprefixer": "^10.4.20",
          "postcss": "^8.4.47",
          "tailwindcss": "^3.4.14"
        },
        scripts: { "dev": "vite", "build": "vite build" }
      }, null, 2)
    };

    // 2. Root index.html
    result['/index.html'] = {
      code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Genesis Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
    <script>${figmaBridgeCode}</script>
  </body>
</html>`
    };

    // 3. vite.config.ts
    result['/vite.config.ts'] = {
      code: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
});`
    };

    // 4. src/main.tsx
    result['/src/main.tsx'] = {
      code: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';
import '../index.css';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
    };

    if (!result['/index.css']) {
      result['/index.css'] = { code: '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody { background: #030303; color: white; margin: 0; font-family: system-ui; }' };
    }
  } else {
    // Vanilla mode
    const hasHtml = result['/index.html'];
    const htmlCode = hasHtml ? hasHtml.code : `<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>`;
    result['/index.html'] = {
      code: htmlCode.replace('</head>', `<script>${figmaBridgeCode}</script></head>`),
      active: true
    };
  }

  return result;
}

function SandpackErrorBridge({ onError }: { onError?: (error: string) => void }) {
  // IMPORTANT: Set showSyntaxError to false to prevent the library from attempting to mutate read-only Error objects,
  // which was causing the "Cannot assign to read only property 'message' of SyntaxError" UI crash.
  const { logs } = useSandpackConsole({ maxMessageCount: 50, showSyntaxError: false, resetOnPreviewRestart: true });
  const lastReportedRef = useRef('');

  useEffect(() => {
    if (!onError || logs.length === 0) return;
    
    // Manual detection of SyntaxErrors/Babel errors without touching the internal object
    const errorLogs = logs.filter(log => log.method === 'error');
    if (errorLogs.length === 0) return;
    
    // Extract only the plain text message to avoid read-only mutation of Error objects
    const latestError = errorLogs[errorLogs.length - 1];
    let errorMessage = '';
    
    if (latestError.data) {
      errorMessage = latestError.data.map(item => {
        if (typeof item === 'string') return item;
        if (item instanceof Error) return item.message;
        try { return JSON.stringify(item); } catch { return String(item); }
      }).join(' ');
    }

    const sanitizedError = errorMessage.slice(0, 500);
    if (sanitizedError && sanitizedError !== lastReportedRef.current) {
      lastReportedRef.current = sanitizedError;
      onError(sanitizedError);
    }
  }, [logs, onError]);
  return null;
}

export function StudioPreview({
  files, deviceMode = 'desktop', onDeviceModeChange, isGenerating, streamChars = 0, streamPreview = '', supabaseConfig, onError, viewMode, onToggleViewMode, isSidebarCollapsed, onToggleSidebar, isFullscreen, onToggleFullscreen, onShare,
}: StudioPreviewProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [zoom, setZoom]             = useState(100);
  const [isBridgeReady, setIsBridgeReady] = useState(false);
  const figmaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isVanillaHtml = useMemo(() => {
    return Object.values(files).some(f => f.language === 'html' || f.language === 'javascript') && 
           !Object.values(files).some(f => f.language === 'tsx' || f.language === 'jsx');
  }, [files]);
  
  const sandpackFiles = useMemo(() => toSandpackFiles(files, supabaseConfig, isVanillaHtml), [files, supabaseConfig, isVanillaHtml]);
  
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data) return;
      if (e.data.type === 'FIGMA_BRIDGE_READY') setIsBridgeReady(true);
      if (e.data.type === 'FIGMA_EXTRACT_RESULT' || e.data.type === 'FIGMA_EXTRACT_ERROR') {
        if (figmaTimeoutRef.current) { clearTimeout(figmaTimeoutRef.current); figmaTimeoutRef.current = null; }
        toast.dismiss('figma-export');
        if (e.data.type === 'FIGMA_EXTRACT_RESULT') {
          const json = JSON.stringify(e.data.data, null, 2);
          navigator.clipboard.writeText(json).then(() => { toast.success('¡Copiado para Figma con éxito!'); });
        } else {
          toast.error('Error al exportar capas: ' + e.data.error);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const hasContent = !!sandpackFiles;
  const frameWidth: Record<DeviceMode, string> = { desktop: '100%', tablet: '768px', mobile: '375px' };
  const frameHeight: Record<DeviceMode, string | undefined> = { desktop: undefined, tablet: '1024px', mobile: '812px' };

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: '#030303' }}>
      <div className="flex flex-1 items-start justify-center overflow-auto relative" style={{ background: '#0d0e14' }}>
        {isGenerating && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 bg-[#0d0e14]/95 backdrop-blur-xl">
             <Bot className="w-12 h-12 text-primary animate-pulse mb-4" />
             <div className="text-white font-medium">Genesis está construyendo...</div>
          </div>
        )}
        {hasContent ? (
          <div
            key={refreshKey}
            style={{
              width: deviceMode === 'desktop' ? '100%' : frameWidth[deviceMode],
              height: deviceMode === 'desktop' ? '100%' : frameHeight[deviceMode],
              transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
              transformOrigin: 'top center',
            }}
            className="flex-shrink-0 flex flex-col"
          >
            <SandpackProvider
              key={JSON.stringify(sandpackFiles)}
              template="react-ts"
              files={sandpackFiles!}
              customSetup={{
                dependencies: {
                  'react': '^18.0.0', 'react-dom': '^18.0.0',
                  'lucide-react': '^0.468.0', 'clsx': '^2.0.0', 'tailwind-merge': '^2.0.0',
                  'react-router-dom': '^6.0.0', 'framer-motion': '^11.0.0',
                  'recharts': '^2.0.0', 'axios': '^1.0.0', 'zustand': '^4.0.0',
                  ...(supabaseConfig ? { '@supabase/supabase-js': '^2.0.0' } : {}),
                }
              }}
              options={{ externalResources: ['https://cdn.tailwindcss.com'] }}
              theme="dark"
            >
              <SandpackLayout style={{ border: 'none', borderRadius: 0, height: '100%' }}>
                <SandpackPreview showOpenInCodeSandbox={false} showRefreshButton={false} style={{ height: '100%' }} />
              </SandpackLayout>
              <SandpackErrorBridge onError={onError} />
            </SandpackProvider>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <Zap className="w-12 h-12 mb-4 opacity-20" />
            <p>Esperando instrucciones...</p>
          </div>
        )}
      </div>
      <StudioViewToolbar 
        viewMode={viewMode} 
        onToggleViewMode={onToggleViewMode} 
        isSidebarCollapsed={isSidebarCollapsed} 
        onToggleSidebar={onToggleSidebar}
      />
    </div>
  );
}
