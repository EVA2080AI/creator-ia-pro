import { useState, useMemo, useEffect, useRef } from 'react';
import {
  RotateCcw, Monitor, Smartphone, Tablet, ExternalLink,
  Loader2, ZoomIn, ZoomOut,
} from 'lucide-react';
import type { StudioFile } from '@/hooks/useStudioProjects';
import type { SupabaseConfig } from './StudioCloud';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface StudioPreviewProps {
  files: Record<string, StudioFile>;
  deviceMode?: DeviceMode;
  onDeviceModeChange?: (mode: DeviceMode) => void;
  isGenerating?: boolean;
  supabaseConfig?: SupabaseConfig | null;
}

// ─── Common Lucide icon names to expose in the preview ───────────────────────
const ICONS = [
  'ArrowRight','ArrowLeft','ArrowUp','ArrowDown','ArrowUpRight',
  'Check','X','Menu','ChevronDown','ChevronUp','ChevronLeft','ChevronRight',
  'Star','Heart','Share2','Github','Twitter','Linkedin','Instagram','Facebook','Youtube',
  'Zap','Shield','Users','Globe','Code2','Sparkles','Rocket','Crown','Coins','Bolt',
  'Video','Type','Upload','Download','Copy','Trash2','Edit','Edit2','Plus','Minus',
  'Search','Mail','Phone','MapPin','Clock','Calendar','Bell','Settings','User','LogOut',
  'Play','Pause','Loader2','AlertCircle','CheckCircle','Info','AlertTriangle',
  'Home','Folder','FolderOpen','FileText','Database','Server','Cloud',
  'Moon','Sun','Palette','LayoutTemplate','BarChart2','BarChart','Activity',
  'DollarSign','CreditCard','Briefcase','Building2','Store','ShoppingCart','ShoppingBag',
  'Lock','Unlock','Eye','EyeOff','Send','MessageSquare','MessageCircle','Mic','Camera',
  'Monitor','Smartphone','Tablet','Cpu','Package','Code','Layers','Workflow',
  'TrendingUp','TrendingDown','PieChart','LineChart','Target','Award','Badge',
  'Wifi','Battery','Bluetooth','Radio','Headphones','Volume2','VolumeX',
  'Navigation','Compass','Anchor','Flag','Tag','Bookmark','Paperclip',
  'Grid','List','Filter','SortAsc','SortDesc','RefreshCw','RotateCcw',
  'ExternalLink','Link','Hash','AtSign','Feather','Pen','PenTool',
  'Key','Fingerprint','ShieldCheck','ShieldAlert',
  'HardDrive','Terminal','GitBranch','GitCommit','GitMerge',
  // NOTE: Map, Image, File intentionally excluded — they shadow JS/browser built-ins
  // (Map constructor, Image constructor, File API). Accessed via _iconProxy instead.
].join(',\n  ');

// ─── Strip imports / exports so code runs inline ─────────────────────────────
function stripImportsExports(content: string): string {
  let code = content;
  code = code.replace(/^import\s+type\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*\n?/gm, '');
  code = code.replace(/^import\s+(?:\*\s+as\s+\w+|\{[^}]*\}|\w+(?:\s*,\s*\{[^}]*\})?)\s+from\s+['"][^'"]+['"];?\s*\n?/gm, '');
  code = code.replace(/^import\s+['"][^'"]+['"];?\s*\n?/gm, '');
  code = code.replace(/export\s+default\s+function\s+(\w+)/g, 'function $1');
  code = code.replace(/export\s+default\s+class\s+(\w+)/g, 'class $1');
  code = code.replace(/^export\s+default\s+\w+;?\s*\n?/gm, '');
  code = code.replace(/export\s+const\s+/g, 'const ');
  code = code.replace(/export\s+function\s+/g, 'function ');
  code = code.replace(/export\s+class\s+/g, 'class ');
  code = code.replace(/export\s+interface\s+/g, 'interface ');
  code = code.replace(/export\s+type\s+/g, 'type ');
  code = code.replace(/^export\s+\{[^}]*\}[^;]*;?\s*\n?/gm, '');
  code = code.replace(/^['"]use (client|server)['"];?\s*\n?/gm, '');
  return code;
}

// ─── Find the entry file regardless of how it's named ────────────────────────
function findEntryFile(files: Record<string, StudioFile>): StudioFile | null {
  // Priority order for known entry names
  const ENTRY_NAMES = [
    'App.tsx', 'app.tsx', 'App.jsx', 'app.jsx',
    'index.tsx', 'index.jsx', 'main.tsx', 'main.jsx',
    'src/App.tsx', 'src/main.tsx', 'src/index.tsx',
  ];
  for (const name of ENTRY_NAMES) {
    if (files[name]) return files[name];
  }

  // Fallback: first TSX/JSX file that looks like a React component (has JSX)
  const JSX_HINT = /<[A-Z][A-Za-z]|<div|<section|<main|<header|<footer|<span|<p\s|<h[1-6]|<button|<input|<form|<nav|<ul|<li/;
  for (const [, f] of Object.entries(files)) {
    if ((f.language === 'tsx' || f.language === 'jsx') && JSX_HINT.test(f.content)) {
      return f;
    }
  }
  // Last resort: any JS/TS file
  for (const [, f] of Object.entries(files)) {
    if (['tsx', 'jsx', 'ts', 'js'].includes(f.language)) return f;
  }
  return null;
}

// ─── Build fully self-contained HTML ─────────────────────────────────────────
function buildPreviewHtml(
  files: Record<string, StudioFile>,
  supabaseConfig?: SupabaseConfig | null,
): string | null {
  // Pure HTML shortcut
  const htmlFile = files['index.html'];
  if (htmlFile && !Object.keys(files).some(n => ['App.tsx','app.tsx','index.tsx'].includes(n))) {
    // Inject Supabase if configured
    if (supabaseConfig) {
      return htmlFile.content.replace(
        '</head>',
        `  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
  <script>
    const { createClient } = window.supabase;
    window.supabaseClient = createClient(${JSON.stringify(supabaseConfig.url)}, ${JSON.stringify(supabaseConfig.anonKey)});
  </script>
</head>`,
      );
    }
    return htmlFile.content;
  }

  const appFile = findEntryFile(files);
  if (!appFile) return null;

  // Collect supporting files (not the entry itself)
  const appContent = appFile.content;
  const supportingFiles = Object.entries(files).filter(([, f]) => {
    if (f === appFile) return false;
    if (['tsx', 'jsx', 'ts', 'js'].includes(f.language)) return true;
    return false;
  });

  const combinedCode = [
    ...supportingFiles.map(([, f]) => stripImportsExports(f.content)),
    stripImportsExports(appContent),
  ].join('\n\n// ──────────────────────────────────────────────────────────\n\n');

  const cssFile = files['index.css'] || files['styles.css'] || files['globals.css'] || files['app.css'];
  const customCss = cssFile
    ? cssFile.content
        .replace(/@tailwind[^;]+;/g, '')
        .replace(/@import[^;]+;/g, '')
        .replace(/@apply[^;]+;/g, '')
    : '';

  const supabaseBlock = supabaseConfig
    ? `  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
  <script>
    (function() {
      const { createClient } = window.supabase;
      window.supabaseClient = createClient(${JSON.stringify(supabaseConfig.url)}, ${JSON.stringify(supabaseConfig.anonKey)});
    })();
  </script>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/lucide-react@0.468.0/dist/umd/lucide-react.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.0/babel.min.js"></script>
  ${supabaseBlock}
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #fff; }
    #root { min-height: 100vh; }
    #__err {
      display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
      padding: 12px 16px; color: #f87171; font-family: monospace; font-size: 11px;
      white-space: pre-wrap; background: rgba(15,15,20,0.96);
      border-top: 1px solid rgba(248,113,113,0.3);
    }
    #__err.visible { display: block; }
    ${customCss}
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="__err"></div>
  <script type="text/babel" data-presets="react,typescript">
const {
  useState, useEffect, useCallback, useRef, useMemo, useReducer,
  createContext, useContext, Fragment, forwardRef, memo, useId,
  useLayoutEffect, useTransition, useDeferredValue,
} = React;
const { createRoot } = ReactDOM;
const LR = window.LucideReact || {};
const {
  ${ICONS}
} = LR;
// Expose Lucide icons whose names clash with JS/browser built-ins (Map, Image, File).
// We alias them so generated code using <MapIcon/> etc. still works,
// AND the native Map/Image/File constructors remain intact.
const MapIcon    = LR.Map    || null;
const ImageIcon  = LR.Image  || null;
const FileIcon   = LR.File   || null;

// Icon proxy — unknown icons render a placeholder instead of crashing
const _iconProxy = new Proxy(LR, {
  get(target, prop) {
    if (prop in target) return target[prop];
    return function FallbackIcon({ className = '', size = 16 }) {
      return React.createElement('span', {
        className,
        style: { display: 'inline-block', width: size, height: size,
          background: 'rgba(255,255,255,0.1)', borderRadius: 3 }
      });
    };
  }
});
${combinedCode}
// ── Mount ──────────────────────────────────────────────────────────────────
(function mount() {
  try {
    const rootEl = document.getElementById('root');
    if (!rootEl) return;
    // Try common export names
    const AppComponent =
      (typeof App !== 'undefined' && App) ||
      (typeof default_1 !== 'undefined' && default_1) ||
      (typeof Page !== 'undefined' && Page) ||
      (typeof Component !== 'undefined' && Component) ||
      (() => React.createElement('div', { style: { padding: '2rem', color: '#888', fontFamily: 'monospace', fontSize: 13 } },
        'No exportable React component found. Make sure your main component is named App, Page, or Component.'));
    createRoot(rootEl).render(React.createElement(AppComponent));
  } catch (e) {
    showError(e.message + (e.stack ? '\\n' + e.stack.split('\\n').slice(1,4).join('\\n') : ''));
  }
})();
function showError(msg) {
  const el = document.getElementById('__err');
  if (el) { el.textContent = '⚠ ' + msg; el.className = 'visible'; }
}
window.addEventListener('error', e => showError(e.message));
window.addEventListener('unhandledrejection', e => showError(String(e.reason)));
  </script>
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function StudioPreview({
  files,
  deviceMode = 'desktop',
  onDeviceModeChange,
  isGenerating,
  supabaseConfig,
}: StudioPreviewProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [zoom, setZoom]             = useState(100);
  const iframeRef                   = useRef<HTMLIFrameElement>(null);

  const previewHtml = useMemo(
    () => buildPreviewHtml(files, supabaseConfig),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files, supabaseConfig],
  );

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!previewHtml) { setBlobUrl(null); return; }
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewHtml, refreshKey]);

  const handleRefresh = () => setRefreshKey(k => k + 1);
  const openInTab = () => {
    if (!previewHtml) return;
    const blob = new Blob([previewHtml], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
  };

  const hasContent = !!blobUrl;

  // Width per device
  const deviceWidths: Record<DeviceMode, number | string> = {
    desktop: '100%',
    tablet:  768,
    mobile:  375,
  };
  const frameWidth = deviceWidths[deviceMode];

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: '#13141a' }}>

      {/* ── Minimal toolbar ─────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center gap-1 px-3 py-1.5"
        style={{ background: '#16171e', borderBottom: '1px solid rgba(255,255,255,0.06)', height: 40 }}
      >
        {/* Device switcher */}
        <div className="flex items-center gap-0.5">
          {(['desktop', 'tablet', 'mobile'] as DeviceMode[]).map((m) => {
            const Icon = m === 'desktop' ? Monitor : m === 'tablet' ? Tablet : Smartphone;
            return (
              <button
                key={m}
                onClick={() => { onDeviceModeChange?.(m); setZoom(100); }}
                title={m}
                className="h-7 w-7 flex items-center justify-center rounded-md transition-all"
                style={
                  deviceMode === m
                    ? { background: 'rgba(138,180,248,0.15)', color: '#8AB4F8' }
                    : { color: 'rgba(255,255,255,0.25)' }
                }
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>

        <div className="w-px h-4 mx-1.5" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* Zoom */}
        <button
          onClick={() => setZoom(z => Math.max(25, z - 10))}
          className="h-7 w-7 flex items-center justify-center rounded-md text-white/20 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <ZoomOut className="h-3 w-3" />
        </button>
        <span className="text-[10px] text-white/25 font-mono w-8 text-center select-none">{zoom}%</span>
        <button
          onClick={() => setZoom(z => Math.min(200, z + 10))}
          className="h-7 w-7 flex items-center justify-center rounded-md text-white/20 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <ZoomIn className="h-3 w-3" />
        </button>

        <div className="flex-1" />

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="h-7 w-7 flex items-center justify-center rounded-md text-white/20 hover:text-white hover:bg-white/[0.06] transition-all"
          title="Recargar"
        >
          <RotateCcw className="h-3 w-3" />
        </button>

        {/* Open in tab */}
        <button
          onClick={openInTab}
          disabled={!hasContent}
          className="h-7 w-7 flex items-center justify-center rounded-md text-white/20 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-20"
          title="Abrir en nueva pestaña"
        >
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      {/* ── Canvas ─────────────────────────────────────────────────────────── */}
      <div
        className="flex flex-1 items-start justify-center overflow-auto relative"
        style={{
          background:
            deviceMode === 'desktop'
              ? '#13141a'
              : 'radial-gradient(ellipse at center, #1c1d26 0%, #13141a 70%)',
        }}
      >
        {/* Dot grid for device modes */}
        {deviceMode !== 'desktop' && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: 0.04,
              backgroundImage: 'radial-gradient(circle, #8AB4F8 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />
        )}

        {/* Generating overlay */}
        {isGenerating && (
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5"
            style={{ background: 'rgba(13,14,20,0.9)', backdropFilter: 'blur(6px)' }}
          >
            <div className="flex flex-col items-center gap-4">
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(138,180,248,0.1)', border: '1px solid rgba(138,180,248,0.2)' }}
              >
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
          </div>
        )}

        {/* Content */}
        {hasContent ? (
          <div
            className="relative flex-shrink-0"
            style={{
              // For desktop: fill the canvas completely
              width: deviceMode === 'desktop' ? '100%' : undefined,
              height: deviceMode === 'desktop' ? '100%' : undefined,
              // For device modes: apply frame
              padding: deviceMode === 'desktop' ? 0 : deviceMode === 'tablet' ? '24px 20px' : '28px 16px',
            }}
          >
            {/* Device bezel */}
            {deviceMode !== 'desktop' && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  border: '8px solid #232430',
                  borderRadius: deviceMode === 'mobile' ? 44 : 20,
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 32px 80px rgba(0,0,0,0.7)',
                  zIndex: 5,
                }}
              >
                {/* Notch */}
                {deviceMode === 'mobile' && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 z-10"
                    style={{
                      top: 10, height: 20, width: 90,
                      background: '#232430', borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  />
                )}
                {/* Home indicator */}
                {deviceMode === 'mobile' && (
                  <div
                    className="absolute bottom-2 left-1/2 -translate-x-1/2"
                    style={{ height: 4, width: 80, background: 'rgba(255,255,255,0.18)', borderRadius: 4 }}
                  />
                )}
              </div>
            )}

            {/* Scrollable iframe wrapper — zoom applied here */}
            <div
              style={{
                width: deviceMode === 'desktop' ? '100%' : frameWidth,
                height: deviceMode === 'desktop' ? '100%' : undefined,
                minHeight: deviceMode === 'desktop' ? '100%' : 600,
                transformOrigin: 'top left',
                transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
                // When scaled down, shrink the outer footprint too
                ...(zoom !== 100 && deviceMode !== 'desktop' ? {
                  width: (typeof frameWidth === 'number' ? frameWidth : 0) * (zoom / 100),
                  height: 600 * (zoom / 100),
                } : {}),
              }}
            >
              <iframe
                ref={iframeRef}
                key={blobUrl}
                src={blobUrl!}
                title="Genesis Preview"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                style={{
                  display: 'block',
                  width: deviceMode === 'desktop' ? '100%' : (typeof frameWidth === 'number' ? `${frameWidth}px` : frameWidth),
                  height: '100%',
                  minHeight: deviceMode === 'desktop' ? '100%' : 600,
                  border: 'none',
                  borderRadius: deviceMode === 'mobile' ? 36 : deviceMode === 'tablet' ? 12 : 0,
                  background: 'transparent',
                }}
              />
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center text-center p-10 gap-5">
            <div className="relative">
              <div
                className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: 'rgba(138,180,248,0.07)', border: '1px solid rgba(138,180,248,0.13)' }}
              >
                <Monitor className="h-7 w-7 text-[#8AB4F8]/30" />
              </div>
              <div
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px]"
                style={{ background: '#13141a', border: '1px solid rgba(138,180,248,0.2)' }}
              >
                ⚡
              </div>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-white/40 mb-1.5">Preview en vivo</h3>
              <p className="text-[12px] text-white/18 max-w-[200px] leading-relaxed">
                Genera código con Genesis y aparecerá aquí automáticamente
              </p>
            </div>
            {Object.keys(files).length > 0 && (
              <div
                className="text-[10px] text-white/20 px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {Object.keys(files).length} archivo{Object.keys(files).length !== 1 ? 's' : ''} · sin componente React detectado
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
