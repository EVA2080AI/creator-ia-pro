import { useState, useEffect, useRef } from 'react';
import { UserCircle, Image, Video, Layout, Megaphone, Sparkles, Search } from 'lucide-react';

const NODE_CATALOG = [
  { type: 'characterBreakdown', label: 'Personaje / Brief',   desc: 'Define tono, voz y perfil de marca',    icon: UserCircle, color: 'text-[#8AB4F8]', bg: 'bg-[#8AB4F8]/10' },
  { type: 'modelView',          label: 'Imagen IA',           desc: 'Genera imágenes con inteligencia artificial', icon: Image,       color: 'text-rose-400',     bg: 'bg-rose-500/10'      },
  { type: 'videoModel',         label: 'Video IA',            desc: 'Genera videos y secuencias animadas',    icon: Video,       color: 'text-[#8AB4F8]',  bg: 'bg-[#8AB4F8]/10'   },
  { type: 'layoutBuilder',      label: 'Diseño UI',           desc: 'Construye interfaces y páginas web',     icon: Layout,      color: 'text-emerald-400',  bg: 'bg-emerald-500/10'   },
  { type: 'campaignManager',    label: 'Campaña',             desc: 'Gestiona distribución y paid media',     icon: Megaphone,   color: 'text-amber-400',    bg: 'bg-amber-500/10'     },
  { type: 'antigravityBridge',  label: 'Antigravity AI',      desc: 'Chat avanzado y razonamiento IA',        icon: Sparkles,    color: 'text-white',        bg: 'bg-white/5'          },
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
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[20vh]" onClick={onClose}>
      <div
        className="w-full max-w-md mx-4 bg-[#191a1f] border border-white/10 rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <Search className="w-4 h-4 text-white/25 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Añadir nodo..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none"
          />
          <kbd className="text-[10px] text-white/20 font-mono border border-white/[0.08] px-1.5 py-0.5 rounded">Esc</kbd>
        </div>

        {/* Results */}
        <div className="py-1.5 max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-white/20 text-center py-8">Sin resultados para "{query}"</p>
          ) : (
            filtered.map((node, i) => {
              const Icon = node.icon;
              return (
                <button
                  key={node.type}
                  onClick={() => pick(node.type, node.label)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group ${i === highlighted ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}
                >
                  <div className={`w-9 h-9 rounded-xl ${node.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${node.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{node.label}</p>
                    <p className="text-xs text-white/30 truncate">{node.desc}</p>
                  </div>
                  <kbd className="text-[9px] font-mono text-white/15 border border-white/[0.06] px-1.5 py-0.5 rounded shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    ↵
                  </kbd>
                </button>
              );
            })
          )}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2 border-t border-white/[0.06] flex items-center gap-4 bg-white/[0.01]">
          <span className="text-[10px] text-white/20 flex items-center gap-1"><kbd className="font-mono border border-white/[0.08] px-1 rounded">↑↓</kbd> navegar</span>
          <span className="text-[10px] text-white/20 flex items-center gap-1"><kbd className="font-mono border border-white/[0.08] px-1 rounded">↵</kbd> añadir</span>
          <span className="ml-auto text-[10px] text-white/15">Espacio / Shift+A</span>
        </div>
      </div>
    </div>
  );
}
