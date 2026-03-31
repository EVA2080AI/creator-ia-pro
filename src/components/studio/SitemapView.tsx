import { useMemo } from 'react';
import { FileCode, FileText, ChevronRight, Globe, Home } from 'lucide-react';
import type { StudioFile } from '@/hooks/useStudioProjects';

interface SitemapViewProps {
  files: Record<string, StudioFile>;
  onSelectFile?: (name: string) => void;
}

// Page detection patterns
const PAGE_PATTERNS = [
  /^pages\/(\w+)\.(tsx|jsx)$/,
  /^src\/pages\/(\w+)\.(tsx|jsx)$/,
  /^routes\/(\w+)\.(tsx|jsx)$/,
  /^views\/(\w+)\.(tsx|jsx)$/,
];

interface PageNode {
  name: string;
  file: string;
  path: string;
  isHome: boolean;
}

interface ComponentNode {
  name: string;
  file: string;
}

function detectPages(files: Record<string, StudioFile>): PageNode[] {
  const pages: PageNode[] = [];
  for (const filename of Object.keys(files)) {
    for (const pattern of PAGE_PATTERNS) {
      const match = filename.match(pattern);
      if (match) {
        const name = match[1];
        const isHome = name.toLowerCase() === 'home' || name.toLowerCase() === 'index';
        pages.push({
          name,
          file: filename,
          path: isHome ? '/' : `/${name.toLowerCase()}`,
          isHome,
        });
        break;
      }
    }
  }
  pages.sort((a, b) => (a.isHome ? -1 : b.isHome ? 1 : a.name.localeCompare(b.name)));
  return pages;
}

function detectComponents(files: Record<string, StudioFile>): ComponentNode[] {
  const comps: ComponentNode[] = [];
  for (const filename of Object.keys(files)) {
    if (/^(components|src\/components)\/\w+\.(tsx|jsx)$/.test(filename)) {
      const name = filename.match(/\/(\w+)\.(tsx|jsx)$/)?.[1] ?? filename;
      comps.push({ name, file: filename });
    }
  }
  return comps.sort((a, b) => a.name.localeCompare(b.name));
}

export function SitemapView({ files, onSelectFile }: SitemapViewProps) {
  const pages = useMemo(() => detectPages(files), [files]);
  const components = useMemo(() => detectComponents(files), [files]);
  const otherFiles = useMemo(() => {
    const pageFiles = new Set(pages.map(p => p.file));
    const compFiles = new Set(components.map(c => c.file));
    return Object.keys(files).filter(f => !pageFiles.has(f) && !compFiles.has(f) && f !== 'App.tsx');
  }, [files, pages, components]);

  const totalFiles = Object.keys(files).length;
  const totalLines = Object.values(files).reduce((sum, f) => sum + f.content.split('\n').length, 0);

  return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-[#0a0a0c]">
      <div className="w-full max-w-3xl h-[80vh] bg-[#111114] rounded-2xl border border-white/[0.05] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.05] flex justify-between items-center">
          <h3 className="text-white text-[14px] font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#8AB4F8]" /> Sitemap del Proyecto
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/30">{totalFiles} archivos · {totalLines.toLocaleString()} líneas</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Pages */}
          <div>
            <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.3em] mb-3 px-1">Páginas / Rutas</p>
            {pages.length === 0 ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(138,180,248,0.06)', border: '1px solid rgba(138,180,248,0.12)' }}>
                <Globe className="h-4 w-4 text-[#8AB4F8]/50" />
                <p className="text-[11px] text-white/40">
                  Proyecto single-page. Pide a Genesis: <em>"Convierte esto en un sitio multi-página"</em>
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {pages.map(page => (
                  <button
                    key={page.file}
                    onClick={() => onSelectFile?.(page.file)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/[0.04] text-left group"
                    style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: page.isHome ? 'rgba(52,211,153,0.12)' : 'rgba(138,180,248,0.1)', border: `1px solid ${page.isHome ? 'rgba(52,211,153,0.25)' : 'rgba(138,180,248,0.2)'}` }}>
                      {page.isHome ? <Home className="h-3.5 w-3.5 text-emerald-400" /> : <FileCode className="h-3.5 w-3.5 text-[#8AB4F8]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-white/80 group-hover:text-white truncate">{page.name}</p>
                      <p className="text-[10px] text-white/30 font-mono">{page.path}</p>
                    </div>
                    <span className="text-[10px] text-white/20 font-mono shrink-0">{page.file}</span>
                    <ChevronRight className="h-3 w-3 text-white/10 group-hover:text-white/30 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* App.tsx entry */}
          {files['App.tsx'] && (
            <div>
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.3em] mb-3 px-1">Entry Point</p>
              <button
                onClick={() => onSelectFile?.('App.tsx')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/[0.04] text-left group"
                style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' }}
              >
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)' }}>
                  <FileCode className="h-3.5 w-3.5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-white/80">App.tsx</p>
                  <p className="text-[10px] text-white/30">Router principal + Layout</p>
                </div>
                <ChevronRight className="h-3 w-3 text-white/10 group-hover:text-white/30" />
              </button>
            </div>
          )}

          {/* Components */}
          {components.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.3em] mb-3 px-1">Componentes</p>
              <div className="grid grid-cols-2 gap-1.5">
                {components.map(comp => (
                  <button
                    key={comp.file}
                    onClick={() => onSelectFile?.(comp.file)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all hover:bg-white/[0.04] text-left"
                    style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <FileText className="h-3.5 w-3.5 text-amber-400/60 shrink-0" />
                    <span className="text-[11px] text-white/60 font-mono truncate">{comp.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Other files */}
          {otherFiles.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.3em] mb-3 px-1">Otros archivos</p>
              <div className="flex flex-wrap gap-1.5">
                {otherFiles.map(name => (
                  <button
                    key={name}
                    onClick={() => onSelectFile?.(name)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] text-white/40 hover:text-white/70 transition-all font-mono"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <FileText className="h-3 w-3 shrink-0" />
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
