import { X, Zap, Sparkles } from 'lucide-react';

interface AutoFixAlertProps {
  runtimeError: string | null;
  isGenerating: boolean;
  onClear: () => void;
  onApply: () => Promise<void>;
}

export function AutoFixAlert({ runtimeError, isGenerating, onClear, onApply }: AutoFixAlertProps) {
  if (!runtimeError || isGenerating) return null;

  return (
    <div className="mx-6 my-4 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="group relative overflow-hidden rounded-3xl border border-rose-200 bg-rose-50/80 p-6 backdrop-blur-xl shadow-2xl shadow-rose-200/20">
        <div className="absolute top-0 right-0 p-2">
          <button onClick={onClear} className="p-2 text-rose-300 hover:text-rose-500 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-inner">
              <Zap className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-rose-900">Señal de Error Detectada</h4>
              <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Génesis Engine está listo para intervenir</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white/50 p-4 border border-rose-100">
             <code className="text-[10px] font-mono text-rose-700 leading-relaxed block break-words">
               {runtimeError}
             </code>
          </div>
          <button 
            onClick={onApply}
            className="flex items-center justify-center gap-2 w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-lg hover:shadow-rose-600/30 active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4" />
            Analizar y Corregir Automáticamente
          </button>
        </div>
      </div>
    </div>
  );
}
