import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, FileCode, FileText, Globe, History, Download,
  Github, Settings, Zap, Code2, Home, X, Layers,
} from 'lucide-react';
import type { StudioFile, StudioProject } from '@/hooks/useStudioProjects';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  files: Record<string, StudioFile>;
  projects: StudioProject[];
  onSelectFile: (name: string) => void;
  onSelectProject: (project: StudioProject) => void;
  onAction: (action: string) => void;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  category: 'files' | 'projects' | 'actions';
  action: () => void;
}

export function CommandPalette({
  open,
  onClose,
  files,
  projects,
  onSelectFile,
  onSelectProject,
  onAction,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build command items
  const items = useMemo<CommandItem[]>(() => {
    const result: CommandItem[] = [];

    // File items
    for (const name of Object.keys(files)) {
      const Icon = name.endsWith('.css') ? FileText : name.endsWith('.json') ? FileText : FileCode;
      result.push({
        id: `file:${name}`,
        label: name,
        description: `${files[name].content.split('\n').length} líneas`,
        icon: Icon,
        category: 'files',
        action: () => { onSelectFile(name); onClose(); },
      });
    }

    // Project items
    for (const p of projects.slice(0, 8)) {
      result.push({
        id: `project:${p.id}`,
        label: p.name,
        description: `${Object.keys(p.files).length} archivos`,
        icon: Code2,
        category: 'projects',
        action: () => { onSelectProject(p); onClose(); },
      });
    }

    // Action items
    const actions: { id: string; label: string; icon: React.ElementType; desc: string }[] = [
      { id: 'preview',  label: 'Preview',             icon: Globe,    desc: 'Ver preview en vivo' },
      { id: 'code',     label: 'Editor de código',     icon: Code2,    desc: 'Abrir editor' },
      { id: 'sitemap',  label: 'Sitemap',             icon: Layers,   desc: 'Ver estructura del proyecto' },
      { id: 'history',  label: 'Historial',           icon: History,  desc: 'Ver versiones anteriores' },
      { id: 'zip',      label: 'Descargar ZIP',       icon: Download, desc: 'Exportar proyecto' },
      { id: 'github',   label: 'Push a GitHub',       icon: Github,   desc: 'Enviar a repositorio' },
      { id: 'home',     label: 'Ir a proyectos',      icon: Home,     desc: 'Pantalla de inicio' },
      { id: 'pricing',  label: 'Ver planes',          icon: Zap,      desc: 'Actualizar tu plan' },
      { id: 'settings', label: 'Configuración',       icon: Settings, desc: 'Ajustes del proyecto' },
    ];

    for (const a of actions) {
      result.push({
        id: `action:${a.id}`,
        label: a.label,
        description: a.desc,
        icon: a.icon,
        category: 'actions',
        action: () => { onAction(a.id); onClose(); },
      });
    }

    return result;
  }, [files, projects, onSelectFile, onSelectProject, onAction, onClose]);

  // Filter by query
  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
  }, [items, query]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx(i => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filtered[selectedIdx]) {
        e.preventDefault();
        filtered[selectedIdx].action();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, selectedIdx, onClose]);

  // Reset selection when query changes
  useEffect(() => { setSelectedIdx(0); }, [query]);

  if (!open) return null;

  // Group by category
  const fileItems   = filtered.filter(i => i.category === 'files');
  const projectItems = filtered.filter(i => i.category === 'projects');
  const actionItems = filtered.filter(i => i.category === 'actions');

  let globalIdx = 0;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[61] flex items-start justify-center pt-[15vh] pointer-events-none">
        <div
          className="w-full max-w-lg rounded-2xl overflow-hidden pointer-events-auto shadow-2xl"
          style={{ background: '#1a1b22', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
            <Search className="h-4 w-4 text-white/30 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar archivos, proyectos, acciones…"
              className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/30 outline-none"
            />
            <kbd className="text-[10px] text-white/20 font-mono px-1.5 py-0.5 rounded border border-white/[0.08]">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto py-2">
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-[12px] text-white/30">No se encontraron resultados para "{query}"</p>
              </div>
            )}

            {actionItems.length > 0 && (
              <>
                <p className="px-4 pt-2 pb-1 text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">Acciones</p>
                {actionItems.map(item => {
                  const idx = globalIdx++;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                      style={selectedIdx === idx
                        ? { background: 'rgba(138,180,248,0.1)', color: 'white' }
                        : { color: 'rgba(255,255,255,0.6)' }}
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-[#8AB4F8]/60" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium">{item.label}</span>
                        {item.description && <span className="ml-2 text-[11px] text-white/25">{item.description}</span>}
                      </div>
                    </button>
                  );
                })}
              </>
            )}

            {fileItems.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-1 text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">Archivos</p>
                {fileItems.map(item => {
                  const idx = globalIdx++;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left transition-all"
                      style={selectedIdx === idx
                        ? { background: 'rgba(138,180,248,0.1)', color: 'white' }
                        : { color: 'rgba(255,255,255,0.5)' }}
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-[12px] font-mono flex-1 truncate">{item.label}</span>
                      <span className="text-[10px] text-white/20">{item.description}</span>
                    </button>
                  );
                })}
              </>
            )}

            {projectItems.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-1 text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">Proyectos</p>
                {projectItems.map(item => {
                  const idx = globalIdx++;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left transition-all"
                      style={selectedIdx === idx
                        ? { background: 'rgba(138,180,248,0.1)', color: 'white' }
                        : { color: 'rgba(255,255,255,0.5)' }}
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0 text-[#8AB4F8]/50" />
                      <span className="text-[12px] font-medium flex-1 truncate">{item.label}</span>
                      <span className="text-[10px] text-white/20">{item.description}</span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
