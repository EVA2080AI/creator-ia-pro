import { useState, useEffect, useRef } from 'react';
import { UserCircle, Image, Video, Layout, Megaphone, Sparkles, Search } from 'lucide-react';

const NODE_CATALOG = [
  { type: 'characterBreakdown', label: 'Personaje / Brief',   desc: 'Define tono, voz y perfil de marca',    icon: UserCircle, color: 'text-blue-500', bg: 'bg-blue-50 border border-blue-100' },
  { type: 'modelView',          label: 'Imagen IA',           desc: 'Genera imágenes con inteligencia artificial', icon: Image,       color: 'text-rose-500',     bg: 'bg-rose-50 border border-rose-100'      },
  { type: 'videoModel',         label: 'Video IA',            desc: 'Genera videos y secuencias animadas',    icon: Video,       color: 'text-blue-500',  bg: 'bg-blue-50 border border-blue-100'   },
  { type: 'layoutBuilder',      label: 'Diseño UI',           desc: 'Construye interfaces y páginas web',     icon: Layout,      color: 'text-emerald-500',  bg: 'bg-emerald-50 border border-emerald-100'   },
  { type: 'campaignManager',    label: 'Campaña',             desc: 'Gestiona distribución y paid media',     icon: Megaphone,   color: 'text-amber-500',    bg: 'bg-amber-50 border border-amber-100'     },
  { type: 'antigravityBridge',  label: 'Antigravity AI',      desc: 'Chat avanzado y razonamiento IA',        icon: Sparkles,    color: 'text-zinc-500',        bg: 'bg-zinc-100 border border-zinc-200'          },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: string, label: string) => void;
}

export function CommandPalette({ open, onClose, onSelect }: CommandPaletteProps) {
  const [query, setQuery]             = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = NODE_CATALOG.filter(n =>
    !query ||
    n.label.toLowerCase().includes(query.toLowerCase()) ||
    n.desc.toLowerCase().includes(query.toLowerCase()) ||
    n.type.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setHighlighted(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  useEffect(() => { setHighlighted(0); }, [query]);

  const pick = (type: string, label: string) => { onSelect(type, label); onClose(); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown')  { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    if (e.key === 'Enter' && filtered[highlighted]) pick(filtered[highlighted].type, filtered[highlighted].label);
    if (e.key === 'Escape') onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[20vh] bg-zinc-900/10 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-4 bg-white/95 backdrop-blur-xl border border-zinc-200/60 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Search */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-zinc-100/80 bg-zinc-50/40">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Añadir nodo..."
            className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
          />
          <kbd className="text-[10px] text-zinc-400 font-mono border border-zinc-200 px-1.5 py-0.5 rounded shadow-sm bg-white">Esc</kbd>
        </div>

        {/* Results */}
        <div className="py-1.5 max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-8">Sin resultados para "{query}"</p>
          ) : (
            filtered.map((node, i) => {
              const Icon = node.icon;
              return (
                <button
                  key={node.type}
                  onClick={() => pick(node.type, node.label)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group ${i === highlighted ? 'bg-zinc-50' : 'hover:bg-zinc-50'}`}
                >
                  <div className={`w-9 h-9 rounded-xl ${node.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${node.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 group-hover:text-primary transition-colors">{node.label}</p>
                    <p className="text-xs text-zinc-500 truncate">{node.desc}</p>
                  </div>
                  <kbd className="text-[9px] font-mono text-zinc-400 border border-zinc-200 px-1.5 py-0.5 rounded shrink-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm">
                    ↵
                  </kbd>
                </button>
              );
            })
          )}
        </div>

        {/* Footer hints */}
        <div className="px-6 py-3 border-t border-zinc-100/80 flex items-center gap-5 bg-zinc-50/40">
          <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5"><kbd className="font-mono border border-zinc-200/60 px-1.5 py-0.5 rounded-lg bg-white shadow-sm">↑↓</kbd> navegar</span>
          <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5"><kbd className="font-mono border border-zinc-200/60 px-1.5 py-0.5 rounded-lg bg-white shadow-sm">↵</kbd> añadir</span>
          <span className="ml-auto text-[10px] text-zinc-300">Espacio / Shift+A</span>
        </div>
      </div>
    </div>
  );
}
