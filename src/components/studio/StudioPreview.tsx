import { useState, useMemo, useEffect } from 'react';
import {
  SandpackProvider,
  SandpackPreview,
  SandpackLayout,
  useSandpackConsole,
} from '@codesandbox/sandpack-react';
import {
  RotateCcw, Monitor, Smartphone, Tablet, ExternalLink,
  ZoomIn, ZoomOut, Zap, Code, Cloud
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
    } else {
      // Fallback for purely non-React projects (like a single index.html)
      for (const [name, file] of Object.entries(files)) {
        const abs = (name.startsWith('/') ? name : `/${name}`).replace(/^\/src\//, '/');
        result[abs] = { code: file.content, active: name.endsWith('.html') };
      }
    }
  }

  // High-fidelity Figma Extractor Bridge (Resilient Version)
  const figmaBridgeCode = `(function() {
    console.log('[FigmaBridge] Iniciando...');
    
    window.addEventListener('message', async (e) => {
      if (e.data.type === 'FIGMA_EXTRACT') {
        console.log('[FigmaBridge] FIGMA_EXTRACT recibido');
        try {
          const root = document.getElementById('root') || document.body;
          const data = extractNode(root);
          window.parent.postMessage({ type: 'FIGMA_EXTRACT_RESULT', data }, '*');
        } catch (err) {
          console.error('[FigmaBridge] Error Crítico:', err);
          window.parent.postMessage({ type: 'FIGMA_EXTRACT_ERROR', error: err.message }, '*');
        }
      }
    });

    function rgbToFigma(rgb) {
      if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return null;
      const m = rgb.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
      if(!m) {
        // Fallback for HEX
        if (rgb.startsWith('#')) {
          const hex = rgb.slice(1);
          if (hex.length === 3) return { r: parseInt(hex[0]+hex[0], 16)/255, g: parseInt(hex[1]+hex[1], 16)/255, b: parseInt(hex[2]+hex[2], 16)/255, a: 1 };
          if (hex.length === 6) return { r: parseInt(hex.slice(0,2), 16)/255, g: parseInt(hex.slice(2,4), 16)/255, b: parseInt(hex.slice(4,6), 16)/255, a: 1 };
        }
        return null;
      }
      return { r: m[1]/255, g: m[2]/255, b: m[3]/255, a: m[4] ? parseFloat(m[4]) : 1 };
    }

    function extractNode(el) {
      try {
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

        const bgColor = rgbToFigma(style.backgroundColor);
        if (bgColor) node.fills.push({ type: 'SOLID', color: bgColor, opacity: bgColor.a });
        
        if (el.tagName === 'IMG' && el.src) {
          node.fills.push({ type: 'IMAGE', scaleMode: 'FILL', imageHash: el.src });
        }

        if (parseInt(style.borderWidth) > 0) {
          const borderColor = rgbToFigma(style.borderColor);
          if (borderColor) {
            node.strokes.push({ type: 'SOLID', color: borderColor, opacity: borderColor.a });
            node.strokeWeight = parseInt(style.borderWidth);
          }
        }

        if (style.boxShadow && style.boxShadow !== 'none') {
          const shadowParts = style.boxShadow.split(/,(?![^(]*\\))/);
          shadowParts.forEach(s => {
            const coords = s.match(/(-?\\d+)px\\s+(-?\\d+)px\\s+(-?\\d+)px(?:\\s+(-?\\d+)px)?/);
            const color = s.match(/rgba?\\([^)]+\\)|#[a-fA-F0-9]+/);
            if (coords && color) {
              node.effects.push({
                type: 'DROP_SHADOW',
                color: rgbToFigma(color[0]) || { r: 0, g: 0, b: 0 },
                offset: { x: parseInt(coords[1]), y: parseInt(coords[2]) },
                radius: parseInt(coords[3]),
                spread: parseInt(coords[4]) || 0,
                visible: true
              });
            }
          });
        }

        const layoutProps = ['flex', 'grid'].includes(style.display);
        if (layoutProps) {
          node.layoutMode = style.flexDirection === 'column' ? 'VERTICAL' : 'HORIZONTAL';
          node.itemSpacing = parseInt(style.gap) || 0;
          node.paddingTop = parseInt(style.paddingTop) || 0;
          node.paddingRight = parseInt(style.paddingRight) || 0;
          node.paddingBottom = parseInt(style.paddingBottom) || 0;
          node.paddingLeft = parseInt(style.paddingLeft) || 0;
          const alignMap = { 'center': 'CENTER', 'flex-start': 'MIN', 'flex-end': 'MAX', 'space-between': 'SPACE_BETWEEN', 'stretch':'STRETCH' };
          node.primaryAxisAlignItems = alignMap[style.justifyContent] || 'MIN';
          node.counterAxisAlignItems = alignMap[style.alignItems] || 'MIN';
        }

        Array.from(el.childNodes).forEach(child => {
          const extracted = extractNode(child);
          if (extracted) node.children.push(extracted);
        });
        return node;
      } catch (e) {
        console.warn('[FigmaBridge] Fallo nodo individual:', el, e);
        return null;
      }
    }
    
    // Handshake
    console.log('[FigmaBridge] Listo');
    window.parent.postMessage({ type: 'FIGMA_BRIDGE_READY' }, '*');
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

// ─── Error Bridge: captures Sandpack console errors and reports them ─────────
function SandpackErrorBridge({ onError }: { onError?: (error: string) => void }) {
  const { logs } = useSandpackConsole({ maxMessageCount: 50, showSyntaxError: true, resetOnPreviewRestart: true });
  const lastReportedRef = useState({ current: '' })[0];

  useEffect(() => {
    if (!onError || logs.length === 0) return;
    // Find the latest error log
    const errorLogs = logs.filter(log => log.method === 'error' || log.method === 'warn');
    if (errorLogs.length === 0) return;

    const latestError = errorLogs[errorLogs.length - 1];
    const errorText = (latestError.data ?? []).map((d: any) => {
      if (typeof d === 'string') return d;
      if (d?.message) return d.message;
      try { return JSON.stringify(d); } catch { return String(d); }
    }).join(' ').slice(0, 500);

    // Avoid reporting the same error repeatedly
    if (errorText && errorText !== lastReportedRef.current && errorText.length > 10) {
      lastReportedRef.current = errorText;
      onError(errorText);
    }
  }, [logs, onError, lastReportedRef]);

  return null; // Invisible component — just a hook bridge
}

export function StudioPreview({
  files,
  deviceMode = 'desktop',
  onDeviceModeChange,
  isGenerating,
  streamChars = 0,
  streamPreview = '',
  supabaseConfig,
  onError,
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
  const [isBridgeReady, setIsBridgeReady] = useState(false);
  const figmaTimeoutRef = useMemo(() => ({ current: null as ReturnType<typeof setTimeout> | null }), []);

  const sandpackFiles = useMemo(() => toSandpackFiles(files, supabaseConfig), [files, supabaseConfig]);
  
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data) return;

      if (e.data.type === 'FIGMA_BRIDGE_READY') {
        setIsBridgeReady(true);
      }

      if (e.data.type === 'FIGMA_EXTRACT_RESULT' || e.data.type === 'FIGMA_EXTRACT_ERROR') {
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
    return () => {
      window.removeEventListener('message', handleMessage);
      if (figmaTimeoutRef.current) clearTimeout(figmaTimeoutRef.current);
    };
  }, [figmaTimeoutRef]);

  const hasContent    = !!sandpackFiles;
  const pages = useMemo(() => detectPages(files), [files]);
  const isMultiPage = pages.length >= 2;

  const isVanillaHtml = Object.values(files).some(f => f.language === 'html') && !Object.keys(sandpackFiles || {}).some(k => k.endsWith('.tsx') || k.endsWith('.jsx') || k.endsWith('.ts'));
  const sandpackTemplate = isVanillaHtml ? 'vanilla' : 'react-ts';

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
    <div className="flex h-full flex-col overflow-hidden" style={{ background: '#030303' }}>

      <div
        className="flex flex-1 items-start justify-center overflow-auto relative"
        style={{
          background: deviceMode === 'desktop' ? '#0d0e14' : 'radial-gradient(ellipse at center, #1c1d26 0%, #0d0e14 70%)',
        }}
      >
        {deviceMode !== 'desktop' && (
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04, backgroundImage: 'radial-gradient(circle, #8AB4F8 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        )}

        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 bg-[#0d0e14]/95 backdrop-blur-xl"
          >
            {/* Ambient Background Pulse */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            <div className="relative flex flex-col items-center w-full max-w-md z-10">
              {/* Construction Icon & Progress Circle */}
              <div className="relative mb-12">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-white/5"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={377}
                    initial={{ strokeDashoffset: 377 }}
                    animate={{ strokeDashoffset: 377 - (Math.min(streamChars / 2500, 1) * 377) }}
                    className="text-primary transition-all duration-300 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-zinc-900 border border-white/10 rounded-3xl p-5 shadow-2xl">
                    <Zap className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Status Text & Phase Switching */}
              <div className="text-center mb-10 w-full">
                <motion.h3 
                  key={Math.floor(streamChars / 500)}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg font-black text-white mb-2 uppercase tracking-widest"
                >
                  {streamChars < 500 ? 'Analizando Arquitectura' : 
                   streamChars < 1200 ? 'Estructurando Componentes' : 
                   streamChars < 2500 ? 'Diseñando Estilos UI' : 
                   'Finalizando Compilación'}
                </motion.h3>
                <div className="flex items-center justify-center gap-2 text-zinc-500 font-bold text-[10px] uppercase tracking-tighter">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  Code Stream: {streamChars.toLocaleString()} caracteres analizados
                </div>
              </div>

              {/* Ghost Code View (Streaming Preview) */}
              <div className="w-full h-32 overflow-hidden bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-end backdrop-blur-sm relative">
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-zinc-900 to-transparent z-10" />
                <div className="font-mono text-[10px] text-zinc-400 whitespace-pre font-bold leading-relaxed opacity-50">
                  {streamPreview.slice(-400)}
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Genesis Cloud Core v9.0</span>
                <div className="w-1 h-1 rounded-full bg-zinc-800" />
                <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">High Fidelity Output</span>
              </div>
            </div>
          </motion.div>
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
                key={JSON.stringify(sandpackFiles) + sandpackTemplate}
                template={sandpackTemplate as any}
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
                <SandpackErrorBridge onError={onError} />
              </SandpackProvider>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center p-6 relative overflow-hidden bg-[#050505]">
            {/* Cinematic Background Elements */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
               <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[70%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
               <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[60%] bg-blue-500/5 rounded-full blur-[100px]" />
               <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
            </div>
            
            <div className="relative z-10 flex flex-col items-center max-w-4xl w-full">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-purple-500/20 border border-white/10 flex items-center justify-center mb-10 shadow-2xl relative"
               >
                 <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse opacity-50" />
                 <Zap className="h-10 w-10 text-primary relative z-10" />
               </motion.div>

               <motion.h2 
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.1 }}
                 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6 selection:bg-primary/40"
               >
                 Génesis <span className="text-zinc-600">Studio Engine</span>
               </motion.h2>
               
               <motion.p 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
                 className="text-zinc-500 text-lg max-w-xl mx-auto mb-16 leading-relaxed font-medium"
               >
                 Tu lienzo de alta fidelidad está listo. Describe tu visión en el chat de la izquierda para comenzar la construcción autónoma.
               </motion.p>

               {/* Feature Grid Onboarding */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full px-4">
                  {[
                    { icon: <Monitor className="w-5 h-5" />, title: 'Previsualización Real', desc: 'Interactúa con tu código en tiempo real con soporte multidispositivo.' },
                    { icon: <Code className="w-5 h-5" />, title: 'Arquitectura Pura', desc: 'React, Tailwind y TypeScript optimizados para rendimientos extremos.' },
                    { icon: <Cloud className="w-5 h-5" />, title: 'Despliegue Instantáneo', desc: 'Un solo clic para lanzar tu proyecto a producción en la nube.' }
                  ].map((feat, i) => (
                    <motion.div
                      key={feat.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + (i * 0.1) }}
                      className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] hover:border-primary/20 transition-all text-left group shadow-xl backdrop-blur-sm"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 text-zinc-400 group-hover:text-primary">
                        {feat.icon}
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">{feat.title}</h3>
                      <p className="text-[12px] text-zinc-500 leading-relaxed font-bold">{feat.desc}</p>
                    </motion.div>
                  ))}
               </div>

               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 0.8 }}
                 className="mt-16 flex items-center gap-3 px-5 py-2 rounded-full bg-white/[0.02] border border-white/[0.03]"
               >
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em]">Deep Reasoning Enabled • Genesis v9.2 LTS</p>
               </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
