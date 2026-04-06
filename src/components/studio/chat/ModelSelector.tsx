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
          "flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all duration-500 border group",
          "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 shadow-2xl"
        )}
      >
        <Sparkles className={cn("h-3.5 w-3.5 transition-colors", isOpen ? "text-primary" : "text-zinc-500 group-hover:text-primary")} />
        <span className="text-[10px] font-black uppercase tracking-widest italic">{currentModel.label}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-500", isOpen ? "rotate-180 text-primary" : "text-zinc-600")} />
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
              className="absolute left-0 bottom-full mb-4 w-80 rounded-2xl overflow-hidden z-50 bg-[#0A0A0C] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl"
            >
              <div className="px-5 py-4 bg-white/5 border-b border-white/5">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">IA_NEURAL_ENGINE_V21.0</span>
              </div>
              
              <div className="p-2 space-y-1">
                {MODELS.map(m => (
                  <button 
                    key={m.id} 
                    onClick={() => { onSelect(m.id); setIsOpen(false); }}
                    className={cn(
                      "w-full flex flex-col gap-1.5 px-4 py-3 text-left transition-all rounded-xl border group/item",
                      selectedModel === m.id 
                        ? "bg-primary/10 border-primary/20 text-white font-bold" 
                        : "text-zinc-500 border-transparent hover:bg-white/5 hover:text-zinc-200"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          selectedModel === m.id ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),1)] animate-pulse" : "bg-zinc-700"
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
                      <p className="text-[10px] text-zinc-500 font-medium leading-tight pl-4 group-hover/item:text-zinc-400">
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
