import { useState } from 'react';
import { Sparkles, ChevronDown, Lock, Zap, Eye } from 'lucide-react';
import { MODELS } from './constants';
import type { ModelOption } from './types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ModelSelectorProps {
  selectedModel: string;
  onSelect: (modelId: string) => void;
}

export function ModelSelector({ selectedModel, onSelect }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentModel = MODELS.find(m => m.id === selectedModel) ?? MODELS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 border border-transparent group relative overflow-hidden bg-transparent hover:bg-white hover:border-zinc-200 hover:shadow-[0_2px_10px_rgba(0,0,0,0.02)]",
          isOpen && "bg-white border-zinc-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
        )}
      >
        <Sparkles className={cn("h-3.5 w-3.5 transition-colors shrink-0", isOpen ? "text-primary flex-none" : "text-zinc-400 group-hover:text-primary flex-none")} />
        <span className={cn(
          "text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap leading-none mt-0.5",
          isOpen ? "text-zinc-900" : "text-zinc-500 group-hover:text-zinc-800"
        )}>
          {currentModel.label}
        </span>
        <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform duration-300", isOpen ? "rotate-180 text-primary" : "text-zinc-400")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 bottom-full mb-3 w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden z-[100] bg-white border border-zinc-200 shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
            >
              <div className="px-5 py-4 bg-zinc-50/80 border-b border-zinc-100 backdrop-blur-xl">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] relative flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
                  IA_NEURAL_ENGINE_V21.0
                </span>
              </div>
              
              <div className="p-2 space-y-1">
                {MODELS.map(m => (
                  <button 
                    key={m.id} 
                    onClick={() => { onSelect(m.id); setIsOpen(false); }}
                    className={cn(
                      "w-full flex flex-col gap-1.5 px-4 py-3 text-left transition-all rounded-xl border group/item relative overflow-hidden",
                      selectedModel === m.id 
                        ? "bg-primary/[0.04] border-primary/20 text-zinc-900" 
                        : "text-zinc-600 border-transparent hover:bg-zinc-50 hover:text-zinc-900"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full transition-colors",
                          selectedModel === m.id ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)] animate-pulse" : "bg-zinc-300"
                        )} />
                        <span className="text-[12px] font-black uppercase tracking-tight">{m.label}</span>
                        {m.premium && <Lock className="h-2.5 w-2.5 text-amber-500/80" />}
                      </div>
                      <div className="flex items-center gap-2">
                        {m.vision && <Eye className="h-3 w-3 text-emerald-500/60" />}
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                          m.premium ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        )}>
                          {m.badge.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                    {m.description && (
                      <p className={cn("text-[11px] font-medium leading-relaxed pl-4 transition-colors", selectedModel === m.id ? "text-primary/70" : "text-zinc-400 group-hover/item:text-zinc-500")}>
                        {m.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
