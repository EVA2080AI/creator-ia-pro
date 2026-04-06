import { useState } from 'react';
import { Sparkles, ChevronDown, Lock } from 'lucide-react';
import { MODELS } from './constants';
import type { ModelOption } from './types';

interface ModelSelectorProps {
  selectedModel: string;
  onSelect: (modelId: string) => void;
}

export function ModelSelector({ selectedModel, onSelect }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentModel = MODELS.find(m => m.id === selectedModel) ?? MODELS[0];

  return (
    <div className="absolute -top-10 left-1/2 -translate-x-1/2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-zinc-200 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 hover:shadow-lg transition-all"
      >
        <Sparkles className="h-3 w-3 text-primary/60" />
        <span>{currentModel.label}</span>
        <ChevronDown className={`h-2.5 w-2.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-72 rounded-2xl overflow-hidden z-50 bg-white border border-zinc-200 shadow-2xl">
            <p className="px-4 pt-3 pb-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">IA Engine</p>
            {MODELS.map(m => (
              <button key={m.id} onClick={() => { onSelect(m.id); setIsOpen(false); }}
                className={`w-full flex flex-col gap-0.5 px-4 py-3 text-left transition-all hover:bg-zinc-50 ${
                  selectedModel === m.id ? 'bg-primary/5 text-zinc-900 font-bold' : 'text-zinc-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {m.premium && <Lock className="h-2.5 w-2.5 text-amber-500 shrink-0" />}
                    <span className="text-[12px]">{m.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {m.vision && <span className="text-[9px] text-emerald-500">👁</span>}
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${m.premium ? 'text-amber-600' : 'text-emerald-600'}`}>{m.badge.split(' ')[0]}</span>
                  </div>
                </div>
                {m.description && (
                  <p className="text-[10px] text-zinc-400 font-medium leading-tight">
                    {m.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
