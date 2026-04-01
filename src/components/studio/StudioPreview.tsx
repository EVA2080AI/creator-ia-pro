import { useState, useMemo, useEffect } from 'react';
import {
  SandpackProvider,
  SandpackPreview,
  SandpackLayout,
} from '@codesandbox/sandpack-react';
import {
  RotateCcw, Monitor, Smartphone, Tablet, ExternalLink,
  ZoomIn, ZoomOut,
} from 'lucide-react';
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
  supabaseConfig?: SupabaseConfig | null;
  
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
    // Sandpack paths need to start with /
    const importPath = './' + p.file.replace(/^(src\/)?/, '').replace(/\.(tsx|jsx)$/, '');
    return `import Page${i} from '${importPath}';`;
  }).join('\n');

  const routes = pages.map((p, i) =>
    `          <Route path="${p.path}" element={<Page${i} />} />`
  ).join('\n');

  const navLinks = pages.map(p =>
    `            <NavLink to="${p.path}" className={({ isActive }) => \`nav-link \${isActive ? 'active' : ''}\`}>${p.name}</NavLink>`
  ).join('\n');

  // Check if there's a Layout component
  const hasLayout = files['components/Layout.tsx'] || files['Layout.tsx'] || files['src/components/Layout.tsx'];

  return `import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
${imports}

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
        <Route path="*" element={<Page0 />} />
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
): Record<string, { code: string; active?: boolean }> | null {
  if (Object.keys(files).length === 0) return null;

  const result: Record<string, { code: string; active?: boolean }> = {};

  // Supabase client file when connected
  if (supabaseConfig) {
    result['/supabaseClient.ts'] = {
      code: `import { createClient } from '@supabase/supabase-js';\nexport const supabase = createClient('${supabaseConfig.url}', '${supabaseConfig.anonKey}');\n`,
    };
  }

  // Detect multi-page structure
  const pages = detectPages(files);
  const isMultiPage = pages.length >= 2;

  if (isMultiPage) {
    // Multi-page mode: generate router wrapper as App.tsx
    for (const [name, file] of Object.entries(files)) {
      const abs = (name.startsWith('/') ? name : `/${name}`).replace(/^\/src\//, '/');
      result[abs] = { code: file.content };
    }
    result['/App.tsx'] = { code: generateRouterWrapper(pages, files), active: true };
  } else {
    // Single-page mode
    let entryContent: string | null = null;
    let entryOrigName: string | null = null;

    for (const name of ENTRY_NAMES) {
      if (files[name]) { entryContent = files[name].content; entryOrigName = name; break; }
    }
    if (!entryContent) {
      const candidate = Object.entries(files).find(
        ([, f]) => (f.language === 'tsx' || f.language === 'jsx') && JSX_HINT.test(f.content)
      );
      if (candidate) { entryContent = candidate[1].content; entryOrigName = candidate[0]; }
    }
    if (!entryContent) {
      const candidate = Object.entries(files).find(
        ([, f]) => f.language === 'tsx' || f.language === 'jsx'
      );
      if (candidate) { entryContent = candidate[1].content; entryOrigName = candidate[0]; }
    }
    
    if (entryContent) {
      for (const [name, file] of Object.entries(files)) {
        if (name === entryOrigName) continue;
        const abs = (name.startsWith('/') ? name : `/${name}`).replace(/^\/src\//, '/');
        result[abs] = { code: file.content };
      }
      result['/App.tsx'] = { code: entryContent, active: true };
    }
  }

  // High-fidelity Figma Extractor Bridge (Pro Version)
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
          fontWeight: parentStyle.fontWeight,
          lineHeight: { value: parseInt(parentStyle.lineHeight) || 0, unit: 'PIXELS' },
          letterSpacing: { value: parseFloat(parentStyle.letterSpacing) || 0, unit: 'PIXELS' },
          fills: [{ type: 'SOLID', color: rgbToFigma(parentStyle.color) || { r: 0, g: 0, b: 0 }, opacity: rgbToFigma(parentStyle.color)?.a ?? 1 }]
        };
      }

      if (el.nodeType !== 1) return null;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return null;
      
      const rect = el.getBoundingClientRect();
      const node = {
        type: 'FRAME',
        name: el.id || el.className || el.tagName,
        x: rect.x, y: rect.y, width: rect.width, height: rect.height,
        fills: [],
        strokes: [],
        effects: [],
        cornerRadius: parseInt(style.borderRadius) || 0,
        children: []
      };

      // Fills & Images
      const bgColor = rgbToFigma(style.backgroundColor);
      if (bgColor) node.fills.push({ type: 'SOLID', color: bgColor, opacity: bgColor.a });
      
      if (el.tagName === 'IMG' && el.src) {
        node.fills.push({ type: 'IMAGE', scaleMode: 'FILL', imageHash: el.src });
      }

      // Borders
      if (parseInt(style.borderWidth) > 0) {
        const borderColor = rgbToFigma(style.borderColor);
        if (borderColor) {
          node.strokes.push({ type: 'SOLID', color: borderColor, opacity: borderColor.a });
          node.strokeWeight = parseInt(style.borderWidth);
        }
      }

      // Shadows
      if (style.boxShadow && style.boxShadow !== 'none') {
        const m = style.boxShadow.match(/rgba?\\([^)]+\\)\\s+(-?\\d+)px\\s+(-?\\d+)px\\s+(-?\\d+)px\\s+(-?\\d+)px/);
        if (m) {
          node.effects.push({
            type: 'DROP_SHADOW',
            color: rgbToFigma(m[0].match(/rgba?\\([^)]+\\)/)[0]),
            offset: { x: parseInt(m[2]), y: parseInt(m[3]) },
            radius: parseInt(m[4]),
            spread: parseInt(m[5]) || 0,
            visible: true
          });
        }
      }

      const layoutProps = ['flex', 'grid'].includes(style.display);
      if (layoutProps) {
        node.layoutMode = style.flexDirection === 'column' ? 'VERTICAL' : 'HORIZONTAL';
        node.itemSpacing = parseInt(style.gap) || 0;
        node.paddingTop = parseInt(style.paddingTop) || 0;
        node.paddingRight = parseInt(style.paddingRight) || 0;
        node.paddingBottom = parseInt(style.paddingBottom) || 0;
        node.paddingLeft = parseInt(style.paddingLeft) || 0;
        const alignMap = { 'center': 'CENTER', 'flex-start': 'MIN', 'flex-end': 'MAX', 'space-between': 'SPACE_BETWEEN' };
        node.primaryAxisAlignItems = alignMap[style.justifyContent] || 'MIN';
        node.counterAxisAlignItems = alignMap[style.alignItems] || 'MIN';
      }

      Array.from(el.childNodes).forEach(child => {
        try {
          const extracted = extractNode(child);
          if (extracted) node.children.push(extracted);
        } catch(e) {}
      });
      return node;
    }
  })()`;

  result['/public/index.html'] = {
    code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Genesis Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script>${figmaBridgeCode}</script>
  </body>
</html>`
  };

  return result;
}

export function StudioPreview({
  files,
  deviceMode = 'desktop',
  onDeviceModeChange,
  isGenerating,
  supabaseConfig,
  viewMode,
  onToggleViewMode,
  isSidebarCollapsed,
  onToggleSidebar,
  isFullscreen,
  onToggleFullscreen,
  onShare,
}: StudioPreviewProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [zoom, setZoom]             = useState(100);
  const figmaTimeoutRef = useMemo(() => ({ current: null as any }), []);

  const sandpackFiles = useMemo(() => toSandpackFiles(files, supabaseConfig), [files, supabaseConfig]);
  
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && (e.data.type === 'FIGMA_EXTRACT_RESULT' || e.data.type === 'FIGMA_EXTRACT_ERROR')) {
        if (figmaTimeoutRef.current) {
          clearTimeout(figmaTimeoutRef.current);
          figmaTimeoutRef.current = null;
        }
        
        toast.dismiss('figma-export');

        if (e.data.type === 'FIGMA_EXTRACT_RESULT') {
          const json = JSON.stringify(e.data.data, null, 2);
          navigator.clipboard.writeText(json).then(() => {
             toast.success('¡Copiado para Figma con éxito!', {
               description: 'Pega los datos usando el plugin "html.to.design" o Builder.io en Figma.',
               duration: 6000
             });
          });
        } else {
          toast.error('Error al exportar capas: ' + e.data.error);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [figmaTimeoutRef]);

  const hasContent    = !!sandpackFiles;
  const pages = useMemo(() => detectPages(files), [files]);
  const isMultiPage = pages.length >= 2;

  const frameWidth: Record<DeviceMode, string> = {
    desktop: '100%',
    tablet:  '768px',
    mobile:  '375px',
  };

  const frameHeight: Record<DeviceMode, string | undefined> = {
    desktop: undefined,
    tablet:  '1024px',
    mobile:  '812px',
  };

  const currentView = pages.find(p => p.path === window.location.hash.split('#')[1] || p.path === '/') || pages[0];

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: '#13141a' }}>
      <StudioViewToolbar 
        viewMode={viewMode}
        onToggleViewMode={onToggleViewMode}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        onRefresh={() => setRefreshKey(k => k + 1)}
        currentViewName={currentView?.name || 'Dashboard'}
        onViewChange={(v) => { toast.info(`Navegando a ${v}`); }}
        onCopyToFigma={() => {
          const frame = document.querySelector<HTMLIFrameElement>('.sp-preview-iframe');
          if (frame && frame.contentWindow) {
            toast.loading('Preparando capas para Figma (Auto Layout)...', { id: 'figma-export' });
            
            // Timeout safety
            if (figmaTimeoutRef.current) clearTimeout(figmaTimeoutRef.current);
            figmaTimeoutRef.current = setTimeout(() => {
              toast.dismiss('figma-export');
              toast.error('La extracción está tardando demasiado', {
                description: 'Asegúrate de que el preview haya cargado completamente o intenta con un layout más simple.'
              });
              figmaTimeoutRef.current = null;
            }, 10000);

            frame.contentWindow.postMessage({ type: 'FIGMA_EXTRACT' }, '*');
          } else {
            toast.error('No se pudo encontrar el preview para exportar');
          }
        }}
        onDownload={() => toast.info('Descargando assets...')}
        onRun={() => {
          setRefreshKey(k => k + 1);
          toast.success('Proyecto ejecutado con éxito');
        }}
        onShare={onShare || (() => toast.success('Enlace de colaboración copiado'))}
      />

      <div
        className="shrink-0 flex items-center gap-1 px-3"
        style={{ background: '#16171e', borderBottom: '1px solid rgba(255,255,255,0.06)', height: 36 }}
      >
        {(['desktop', 'tablet', 'mobile'] as DeviceMode[]).map((m) => {
          const Icon = m === 'desktop' ? Monitor : m === 'tablet' ? Tablet : Smartphone;
          return (
            <button
              key={m}
              onClick={() => { onDeviceModeChange?.(m); setZoom(100); }}
              className="h-7 w-7 flex items-center justify-center rounded-md transition-all"
              style={deviceMode === m
                ? { background: 'rgba(138,180,248,0.15)', color: '#8AB4F8' }
                : { color: 'rgba(255,255,255,0.25)' }}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
        <div className="w-px h-4 mx-1.5" style={{ background: 'rgba(255,255,255,0.07)' }} />
        {isMultiPage && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ background: 'rgba(138,180,248,0.08)', border: '1px solid rgba(138,180,248,0.15)' }}>
            <span className="text-[9px] font-bold text-[#8AB4F8] uppercase tracking-widest">{pages.length} páginas</span>
          </div>
        )}
        <div className="flex items-center gap-0.5 ml-auto">
          <button onClick={() => setZoom(z => Math.max(25, z - 10))} className="h-7 w-7 flex items-center justify-center rounded-md text-white/20 hover:text-white hover:bg-white/[0.06]">
            <ZoomOut className="h-3 w-3" />
          </button>
          <span className="text-[10px] text-white/25 font-mono w-8 text-center">{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="h-7 w-7 flex items-center justify-center rounded-md text-white/20 hover:text-white hover:bg-white/[0.06]">
            <ZoomIn className="h-3 w-3" />
          </button>
        </div>
        <div className="w-px h-4 mx-1.5" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <button
          onClick={() => {
            const frame = document.querySelector<HTMLIFrameElement>('.sp-preview-iframe');
            if (frame?.src) window.open(frame.src, '_blank');
          }}
          disabled={!hasContent}
          className="h-7 w-7 flex items-center justify-center rounded-md text-white/20 hover:text-white hover:bg-white/[0.06] disabled:opacity-20"
        >
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      <div
        className="flex flex-1 items-start justify-center overflow-auto relative"
        style={{
          background: deviceMode === 'desktop' ? '#13141a' : 'radial-gradient(ellipse at center, #1c1d26 0%, #13141a 70%)',
        }}
      >
        {deviceMode !== 'desktop' && (
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04, backgroundImage: 'radial-gradient(circle, #8AB4F8 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        )}

        {isGenerating && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5" style={{ background: 'rgba(13,14,20,0.9)', backdropFilter: 'blur(6px)' }}>
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(138,180,248,0.1)', border: '1px solid rgba(138,180,248,0.2)' }}>
              <svg className="h-7 w-7 text-[#8AB4F8] animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5"/>
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[14px] font-semibold text-white/80 mb-1">Generando interfaz…</p>
              <p className="text-[11px] text-white/30">El preview aparecerá automáticamente</p>
            </div>
          </div>
        )}

        {hasContent ? (
          <div className={deviceMode === 'desktop' ? 'w-full h-full' : 'relative flex-shrink-0 flex items-start justify-center'}>
            <div
              key={refreshKey}
              style={{
                width: deviceMode === 'desktop' ? '100%' : frameWidth[deviceMode],
                height: deviceMode === 'desktop' ? '100%' : frameHeight[deviceMode],
                transformOrigin: 'top center',
                transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
                overflow: 'hidden',
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
                    'lucide-react': '^0.468.0', 'react-icons': '^5.0.0',
                    'clsx': '^2.0.0', 'class-variance-authority': '^0.7.0', 'tailwind-merge': '^2.0.0',
                    'react-router-dom': '^6.0.0', 'framer-motion': '^11.0.0',
                    '@chakra-ui/react': '^2.0.0', '@chakra-ui/icons': '^2.0.0',
                    '@emotion/react': '^11.0.0', '@emotion/styled': '^11.0.0',
                    'recharts': '^2.0.0', 'react-hook-form': '^7.0.0', 'zod': '^3.0.0',
                    '@hookform/resolvers': '^3.0.0', 'axios': '^1.0.0', 'date-fns': '^3.0.0',
                    'zustand': '^4.0.0', 'sonner': '^1.0.0', '@tanstack/react-query': '^5.0.0',
                    ...(supabaseConfig ? { '@supabase/supabase-js': '^2.0.0' } : {}),
                  },
                }}
                options={{
                  externalResources: [
                    'https://cdn.tailwindcss.com',
                    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
                  ],
                }}
                theme="dark"
              >
                <style>{`.sp-wrapper { height: 100% !important; flex: 1; }`}</style>
                <SandpackLayout style={{ border: 'none', borderRadius: 0, height: '100%' }}>
                  <SandpackPreview showOpenInCodeSandbox={false} showRefreshButton={false} style={{ height: '100%', minHeight: '100%', flex: 1 }} />
                </SandpackLayout>
              </SandpackProvider>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center p-10 gap-5">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'rgba(138,180,248,0.07)', border: '1px solid rgba(138,180,248,0.13)' }}>
                <Monitor className="h-7 w-7 text-[#8AB4F8]/30" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: '#13141a', border: '1px solid rgba(138,180,248,0.2)' }}>⚡</div>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-white/40 mb-1.5">Preview en vivo</h3>
              <p className="text-[12px] text-white/20 max-w-[200px] leading-relaxed">Genera código con Genesis y aparecerá aquí automáticamente</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
