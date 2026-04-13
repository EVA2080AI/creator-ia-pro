import { useState } from 'react';
import { Sparkles, ChevronDown, Lock, Zap, Eye, DollarSign, Cpu } from 'lucide-react';
import { MODELS } from './constants';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ModelSelectorProps {
  selectedModel: string;
  onSelect: (modelId: string) => void;
}

const FREE_MODELS = MODELS.filter(m => m.free);
const PAID_MODELS = MODELS.filter(m => !m.free);

const PROVIDER_COLORS: Record<string, string> = {
  Google: 'text-blue-500',
  Anthropic: 'text-amber-500',
  OpenAI: 'text-emerald-500',
  Meta: 'text-indigo-500',
  Microsoft: 'text-sky-500',
  DeepSeek: 'text-violet-500',
};

function ModelRow({
  m,
  isSelected,
  onSelect,
}: {
  m: typeof MODELS[0];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const providerColor = PROVIDER_COLORS[m.provider] ?? 'text-zinc-400';

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-xl border transition-all group/item relative",
        isSelected
          ? "bg-primary/[0.05] border-primary/25"
          : "border-transparent hover:bg-zinc-50 hover:border-zinc-200"
      )}
    >
      {/* Active indicator */}
      {isSelected && (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-primary" />
      )}

      <div className="flex items-center justify-between gap-2 pl-3">
        {/* Left: name + desc */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-[11.5px] font-black tracking-tight", isSelected ? "text-zinc-900" : "text-zinc-700 group-hover/item:text-zinc-900")}>
              {m.label}
            </span>
            <span className={cn("text-[8.5px] font-bold uppercase tracking-widest", providerColor)}>
              {m.provider}
            </span>
            {m.vision && (
              <span className="flex items-center gap-0.5 text-[8px] font-bold text-emerald-500 uppercase tracking-wider">
                <Eye className="h-2.5 w-2.5" />Vision
              </span>
            )}
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug truncate pr-2">{m.description}</p>
        </div>

        {/* Right: badge + cost */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={cn(
            "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
            m.free
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : m.badge === 'PRO'
              ? "bg-amber-50 text-amber-600 border-amber-200"
              : "bg-violet-50 text-violet-600 border-violet-200"
          )}>
            {m.free ? '✓ FREE' : m.badge}
          </span>
          {!m.free && (
            <span className="text-[8px] font-mono text-zinc-400">
              ${m.inputCost}/${ m.outputCost}/M
            </span>
          )}
          {m.free && (
            <span className="text-[8px] text-emerald-500 font-bold">Sin coste</span>
          )}
        </div>
      </div>
    </button>
  );
}

export function ModelSelector({ selectedModel, onSelect }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentModel = MODELS.find(m => m.id === selectedModel) ?? MODELS[0];
  const isFree = currentModel.free;

  return (
    <div className="relative">
      <button
        id="model-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all duration-200 border group",
          isOpen
            ? "bg-white border-zinc-200 shadow-sm"
            : "border-transparent hover:bg-white hover:border-zinc-200 bg-transparent"
        )}
      >
        {isFree
          ? <Zap className="h-3 w-3 text-emerald-500 shrink-0" />
          : <Cpu className="h-3 w-3 text-amber-500 shrink-0" />
        }
        <span className={cn(
          "text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap leading-none",
          isOpen ? "text-zinc-900" : "text-zinc-500 group-hover:text-zinc-800"
        )}>
          {currentModel.label}
        </span>
        {isFree && (
          <span className="text-[7px] font-black text-emerald-500 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
            FREE
          </span>
        )}
        <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform duration-200", isOpen ? "rotate-180 text-primary" : "text-zinc-400")} />
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
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-2 w-[26rem] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden z-[100] bg-white border border-zinc-200 shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Seleccionar Modelo</span>
                </div>
                <span className="text-[9px] text-zinc-400 font-medium">Precios por millón de tokens</span>
              </div>

              <div className="overflow-y-auto max-h-[70vh] custom-scrollbar">
                {/* FREE section */}
                <div className="px-3 pt-3 pb-1">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">
                      ✓ Gratis — Sin coste OpenRouter
                    </span>
                    <div className="flex-1 h-px bg-emerald-100" />
                  </div>
                  <div className="space-y-0.5">
                    {FREE_MODELS.map(m => (
                      <ModelRow
                        key={m.id}
                        m={m}
                        isSelected={selectedModel === m.id}
                        onSelect={() => { onSelect(m.id); setIsOpen(false); }}
                      />
                    ))}
                  </div>
                </div>

                {/* PAID section */}
                <div className="px-3 pt-2 pb-3">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <DollarSign className="h-3 w-3 text-amber-500" />
                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-[0.2em]">
                      Premium — Consume créditos OpenRouter
                    </span>
                    <div className="flex-1 h-px bg-amber-100" />
                  </div>
                  <div className="space-y-0.5">
                    {PAID_MODELS.map(m => (
                      <ModelRow
                        key={m.id}
                        m={m}
                        isSelected={selectedModel === m.id}
                        onSelect={() => { onSelect(m.id); setIsOpen(false); }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-zinc-100 bg-zinc-50">
                <p className="text-[9px] text-zinc-400 text-center">
                  💡 El modelo predeterminado siempre es <strong className="text-emerald-600">Gemini 2.0 Flash (gratis)</strong>
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
