import { useState } from 'react';
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

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface StudioPreviewProps {
  files: Record<string, StudioFile>;
  deviceMode?: DeviceMode;
  onDeviceModeChange?: (mode: DeviceMode) => void;
  isGenerating?: boolean;
  supabaseConfig?: SupabaseConfig | null;
}

// Map our file language → Sandpack-friendly extension
function toSandpackFiles(
  files: Record<string, StudioFile>,
  supabaseConfig?: SupabaseConfig | null,
): Record<string, { code: string; active?: boolean }> | null {
  if (Object.keys(files).length === 0) return null;

  const result: Record<string, { code: string; active?: boolean }> = {};

  // Inject Supabase client singleton if config present
  const supabaseSetup = supabaseConfig
    ? `import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  '${supabaseConfig.url}',
  '${supabaseConfig.anonKey}'
);\n`
    : null;

  if (supabaseSetup) {
    result['/supabaseClient.ts'] = { code: supabaseSetup };
  }

  let hasEntry = false;

  for (const [name, file] of Object.entries(files)) {
    // Normalise path to absolute
    const path = name.startsWith('/') ? name : `/${name}`;
    result[path] = { code: file.content };

    if (
      name === 'App.tsx' || name === 'app.tsx' ||
      name === 'App.jsx' || name === 'index.tsx' ||
      name === 'index.jsx' || name === 'main.tsx'
    ) {
      hasEntry = true;
    }
  }

  // Sandpack needs /App.tsx as entry; if missing, use first TSX file
  if (!hasEntry) {
    const firstTsx = Object.entries(files).find(([, f]) =>
      f.language === 'tsx' || f.language === 'jsx'
    );
    if (firstTsx) {
      const [origName, file] = firstTsx;
      // Add a thin App.tsx wrapper that re-exports it
      const compName = origName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_') || 'Component';
      result['/App.tsx'] = {
        code: `export { default } from './${origName}';\n`,
        active: true,
      };
      // Keep original too
      if (!result[`/${origName}`]) {
        result[`/${origName}`] = { code: file.content };
      }
    } else {
      return null; // Nothing previewable
    }
  }

  return result;
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

  const sandpackFiles = toSandpackFiles(files, supabaseConfig);
  const hasContent    = !!sandpackFiles;

  // Device preview widths
  const frameWidth: Record<DeviceMode, string> = {
    desktop: '100%',
    tablet:  '768px',
    mobile:  '375px',
  };

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: '#13141a' }}>

      {/* ── Minimal toolbar ─────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center gap-1 px-3"
        style={{ background: '#16171e', borderBottom: '1px solid rgba(255,255,255,0.06)', height: 40 }}
      >
        {/* Device switcher */}
        {(['desktop', 'tablet', 'mobile'] as DeviceMode[]).map((m) => {
          const Icon = m === 'desktop' ? Monitor : m === 'tablet' ? Tablet : Smartphone;
          return (
            <button
              key={m}
              onClick={() => { onDeviceModeChange?.(m); setZoom(100); }}
              title={m}
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
          onClick={() => setRefreshKey(k => k + 1)}
          className="h-7 w-7 flex items-center justify-center rounded-md text-white/20 hover:text-white hover:bg-white/[0.06] transition-all"
          title="Recargar"
        >
          <RotateCcw className="h-3 w-3" />
        </button>

        {/* Open in new tab — Sandpack exposes a URL we can use */}
        <button
          onClick={() => {
            const frame = document.querySelector<HTMLIFrameElement>('.sp-preview-iframe');
            if (frame?.src) window.open(frame.src, '_blank');
          }}
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
          background: deviceMode === 'desktop'
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
        )}

        {hasContent ? (
          /* ── Device frame wrapper ─────────────────────────────────── */
          <div
            className="relative flex-shrink-0"
            style={{
              width: deviceMode === 'desktop' ? '100%' : undefined,
              height: deviceMode === 'desktop' ? '100%' : undefined,
              padding: deviceMode === 'desktop' ? 0
                : deviceMode === 'tablet' ? '24px 20px'
                : '28px 16px',
            }}
          >
            {/* Phone / tablet bezel */}
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
                {deviceMode === 'mobile' && (
                  <div style={{
                    position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                    height: 20, width: 90, background: '#232430',
                    borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)',
                  }} />
                )}
                {deviceMode === 'mobile' && (
                  <div style={{
                    position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                    height: 4, width: 80, background: 'rgba(255,255,255,0.18)', borderRadius: 4,
                  }} />
                )}
              </div>
            )}

            {/* Sandpack — no editor, just preview */}
            <div
              key={refreshKey}
              style={{
                width: frameWidth[deviceMode],
                height: deviceMode === 'desktop' ? '100%' : undefined,
                minHeight: deviceMode === 'desktop' ? '100%' : 620,
                transformOrigin: 'top left',
                transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
                borderRadius: deviceMode === 'mobile' ? 36 : deviceMode === 'tablet' ? 12 : 0,
                overflow: 'hidden',
              }}
            >
              <SandpackProvider
                key={JSON.stringify(sandpackFiles)}
                template="react-ts"
                files={sandpackFiles!}
                customSetup={{
                  dependencies: {
                    'lucide-react': '^0.468.0',
                    'react': '^18.0.0',
                    'react-dom': '^18.0.0',
                    'clsx': '^2.0.0',
                    'class-variance-authority': '^0.7.0',
                    'tailwind-merge': '^2.0.0',
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
                <SandpackLayout style={{ border: 'none', borderRadius: 0, height: deviceMode === 'desktop' ? '100%' : 620 }}>
                  <SandpackPreview
                    showOpenInCodeSandbox={false}
                    showRefreshButton={false}
                    style={{ height: '100%', flex: 1 }}
                  />
                </SandpackLayout>
              </SandpackProvider>
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
              <p className="text-[12px] text-white/20 max-w-[200px] leading-relaxed">
                Genera código con Genesis y aparecerá aquí automáticamente
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
