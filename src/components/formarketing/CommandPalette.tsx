import React, { useState, useEffect, useRef } from 'react';
import {
  Type, Braces, Brain, Image as ImageIcon, Video, MessageSquare,
  LayoutGrid, Share2, FileOutput, Rocket, Search, Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types & Constants ---
interface NodeDef {
  label: string;
  icon: React.ElementType;
  type: string;
  color: string;
  description: string;
}

interface Category {
  id: string;
  label: string;
  nodes: NodeDef[];
}

const CATEGORIES: Category[] = [
  {
    id: 'entrada',
    label: 'Entrada de Datos',
    nodes: [
      { label: 'Texto Libre',     icon: Type,          type: 'textInput',          color: '#facc15', description: 'Bloque de texto sin formato para instrucciones directas' },
      { label: 'Personaje / Brief', icon: Braces,        type: 'characterBreakdown', color: '#a78bfa', description: 'Define la identidad de marca, tono y voz (System Prompt)' },
      { label: 'Prompt Builder',  icon: Braces,        type: 'promptBuilder',      color: '#fb923c', description: 'Construye prompts dinámicos inyectando variables' },
    ],
  },
  {
    id: 'ia',
    label: 'Inteligencia Artificial',
    nodes: [
      { label: 'LLM · Generador', icon: Brain,         type: 'llmNode',            color: '#60a5fa', description: 'Motor de texto inteligente (DeepSeek, Claude, Gemini)' },
      { label: 'Generador Visual', icon: ImageIcon,      type: 'modelView',          color: '#8AB4F8', description: 'Sintetizador de imágenes de alta fidelidad (Flux)' },
      { label: 'Actor de Video',  icon: Video,         type: 'videoModel',         color: '#f472b6', description: 'Generador de secuencias de video automáticas' },
      { label: 'Caption Writer',  icon: MessageSquare, type: 'captionNode',        color: '#34d399', description: 'Redactor especializado en formatos cortos (Redes/Ads)' },
    ],
  },
  {
    id: 'flujo',
    label: 'Orquestación',
    nodes: [
      { label: 'Layout Architect', icon: LayoutGrid,    type: 'layoutBuilder',      color: '#94a3b8', description: 'Estructura el árbol visual de interfaces generadas' },
      { label: 'Campaign Manager', icon: Share2,        type: 'campaignManager',    color: '#f87171', description: 'Orquesta y distribuye en canales de Paid Media' },
      { label: 'Módulo Export',    icon: FileOutput,    type: 'exportNode',         color: '#34d399', description: 'Empaqueta y expone endpoints finales del nodo' },
      { label: 'Antigravity Core', icon: Rocket,        type: 'antigravityBridge',  color: '#a1a1aa', description: 'Puente directo con la unidad inteligente y memoria' },
    ],
  },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: string, label: string) => void;
}

export function CommandPalette({ open, onClose, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten options for easy arrow-key navigation
  const flatNodes = React.useMemo(() => {
    return CATEGORIES.flatMap(cat => 
      cat.nodes.map(node => ({ ...node, categoryLabel: cat.label }))
    ).filter(n =>
      !query ||
      n.label.toLowerCase().includes(query.toLowerCase()) ||
      n.description.toLowerCase().includes(query.toLowerCase()) ||
      n.categoryLabel.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setHighlightedIndex(0);
      // Small timeout ensures the modal is fully visible before focusing
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    // Reset selection when search changes
    setHighlightedIndex(0);
  }, [query]);

  const pick = (type: string, label: string) => {
    onSelect(type, label);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(h => Math.min(h + 1, flatNodes.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(h => Math.max(h - 1, 0));
    }
    if (e.key === 'Enter' && flatNodes[highlightedIndex]) {
      e.preventDefault();
      pick(flatNodes[highlightedIndex].type, flatNodes[highlightedIndex].label);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[500] flex items-start justify-center pt-[15vh] px-4 sm:px-0 bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[600px] flex flex-col bg-[#0f0f11] shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-white/10 rounded-[1.5rem] overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header / Input */}
        <div className="relative flex items-center px-5 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <Terminal className="absolute left-6 w-5 h-5 text-primary/70 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Añadir módulo al lienzo..."
            className="w-full bg-transparent pl-10 pr-14 text-[15px] font-medium text-white placeholder:text-white/30 focus:outline-none selection:bg-primary/30"
            autoComplete="off"
            spellCheck="false"
          />
          <kbd className="absolute right-6 flex items-center h-6 px-2 text-[10px] font-mono font-bold text-white/40 bg-white/5 border border-white/10 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto max-h-[50vh] p-3 scroll-smooth no-scrollbar">
          {flatNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="w-8 h-8 text-white/10 mb-3" />
              <p className="text-sm font-semibold text-white/60">No se encontraron módulos</p>
              <p className="text-[11px] text-white/30 mt-1 uppercase tracking-widest">Intenta buscar "IA" o "Texto"</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {CATEGORIES.map(category => {
                const categoryNodes = flatNodes.filter(n => n.categoryLabel === category.label);
                if (categoryNodes.length === 0) return null;

                return (
                  <div key={category.id} className="mb-2 last:mb-0">
                    <div className="px-3 pb-1.5 pt-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                        {category.label}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {categoryNodes.map((node) => {
                        const globalIndex = flatNodes.findIndex(n => n.type === node.type);
                        const isHighlighted = globalIndex === highlightedIndex;
                        const Icon = node.icon;

                        return (
                          <button
                            key={node.type}
                            onClick={() => pick(node.type, node.label)}
                            onMouseMove={() => setHighlightedIndex(globalIndex)}
                            className={cn(
                              "w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all duration-150 group",
                              isHighlighted ? "bg-primary/10 border-primary/20" : "bg-transparent border-transparent hover:bg-white/[0.03]"
                            )}
                            style={{ border: isHighlighted ? `1px solid ${node.color}30` : '1px solid transparent' }}
                          >
                            <div 
                              className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300", isHighlighted ? "scale-110" : "")}
                              style={{ backgroundColor: `${node.color}15`, boxShadow: isHighlighted ? `0 0 20px ${node.color}20` : 'none' }}
                            >
                              <Icon className="w-5 h-5" style={{ color: node.color }} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-[13px] font-bold transition-colors truncate", isHighlighted ? "text-white" : "text-white/80")}>
                                {node.label}
                              </p>
                              <p className={cn("text-[11px] mt-0.5 truncate transition-colors", isHighlighted ? "text-white/60" : "text-white/40")}>
                                {node.description}
                              </p>
                            </div>
                            
                            <kbd className={cn(
                              "flex items-center justify-center h-6 min-w-[24px] px-1.5 text-[10px] font-mono text-white/50 bg-black/40 border border-white/10 rounded-md transition-all",
                              isHighlighted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
                            )}>
                              ↵
                            </kbd>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.05] bg-black/20">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30">
              <span className="flex items-center justify-center w-4 h-4 bg-white/10 border border-white/10 rounded uppercase text-white/60">↑</span>
              <span className="flex items-center justify-center w-4 h-4 bg-white/10 border border-white/10 rounded uppercase text-white/60">↓</span>
              Navegar
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30">
              <span className="flex items-center justify-center h-4 px-1.5 bg-white/10 border border-white/10 rounded uppercase text-white/60 text-[9px]">Enter</span>
              Confirmar
            </span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-[#4ADE80]/80">Aether System v9</span>
        </div>
      </div>
    </div>
  );
}
