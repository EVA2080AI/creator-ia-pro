import { useState, useMemo } from 'react';
import { RotateCcw, Monitor, Smartphone, Tablet, ExternalLink } from 'lucide-react';
import type { StudioFile } from '@/hooks/useStudioProjects';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface StudioPreviewProps {
  files: Record<string, StudioFile>;
  deviceMode?: DeviceMode;
  onDeviceModeChange?: (mode: DeviceMode) => void;
}

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

function jsxToHtml(jsx: string): string {
  let html = jsx;
  html = html.replace(/className=/g, 'class=');
  html = html.replace(/\s+on[A-Z]\w+={[^}]*}/g, '');
  html = html.replace(/<(\w+)([^>]*?)\/>/g, '<$1$2></$1>');
  html = html.replace(/{`([^`]*)`}/g, '$1');
  html = html.replace(/{["']([^"']*)["']}/g, '$1');
  html = html.replace(/class={`([^`]*)`}/g, 'class="$1"');
  html = html.replace(/class={"([^"]*)"}/g, 'class="$1"');
  html = html.replace(/\$\{[^}]*\}/g, '');
  html = html.replace(/{\w+(\.\w+)*}/g, '');
  html = html.replace(/={([^}"'][^}]*)}/g, '="$1"');
  return html;
}

export function StudioPreview({ files, deviceMode = 'desktop', onDeviceModeChange }: StudioPreviewProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const previewHtml = useMemo(() => {
    const appFile = files['App.tsx'] || files['app.tsx'];
    const cssFile = files['index.css'] || files['styles.css'];
    if (!appFile) return null;

    const returnMatch = appFile.content.match(/return\s*\(\s*([\s\S]*?)\s*\);\s*\}[\s\S]*$/);
    const bodyHtml = returnMatch ? jsxToHtml(returnMatch[1]) : '<div style="padding:2rem;text-align:center;color:#fff"><p>Preview disponible</p></div>';

    const extraCss = (cssFile?.content || '').replace(/@tailwind[^;]+;/g, '').replace(/@apply[^;]+;/g, '');

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; }
    ${extraCss}
  </style>
</head>
<body>
  <div id="root">${bodyHtml}</div>
</body>
</html>`;
  }, [files, refreshKey]);

  return (
    <div className="flex h-full flex-col bg-[#1c1c22]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-white/[0.05] px-3 py-2 bg-[#16161b]">
        <div className="flex items-center gap-1">
          {(['desktop', 'tablet', 'mobile'] as DeviceMode[]).map((mode) => {
            const Icon = mode === 'desktop' ? Monitor : mode === 'tablet' ? Tablet : Smartphone;
            return (
              <button
                key={mode}
                onClick={() => onDeviceModeChange?.(mode)}
                className={`p-1.5 rounded-lg transition-all ${
                  deviceMode === mode
                    ? 'bg-aether-purple/20 text-aether-purple border border-aether-purple/30'
                    : 'text-white/20 hover:text-white hover:bg-white/5'
                }`}
                title={mode}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 ml-2">
          <div className="flex items-center rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-1 text-[11px] text-white/20 font-mono">
            <span className="text-green-500 mr-1.5">●</span>
            localhost:3000
          </div>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1.5 rounded-lg text-white/20 hover:text-white hover:bg-white/5 transition-all"
            title="Refrescar"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          {previewHtml && (
            <button
              onClick={() => {
                const blob = new Blob([previewHtml], { type: 'text/html' });
                window.open(URL.createObjectURL(blob), '_blank');
              }}
              className="p-1.5 rounded-lg text-white/20 hover:text-white hover:bg-white/5 transition-all"
              title="Abrir en nueva pestaña"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="flex flex-1 items-center justify-center bg-[#16161b] p-3 overflow-hidden">
        <div
          key={refreshKey}
          className="h-full rounded-2xl border border-white/[0.06] bg-white shadow-2xl overflow-hidden transition-all duration-300"
          style={{ width: DEVICE_WIDTHS[deviceMode], maxWidth: '100%' }}
        >
          {previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              title="Preview"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-center p-8">
              <div className="text-5xl mb-4">⚡</div>
              <h2 className="text-xl font-bold text-white mb-2">BuilderAI Studio</h2>
              <p className="text-gray-400 text-sm max-w-xs">Describe lo que quieres construir en el chat y la IA generará el código automáticamente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
