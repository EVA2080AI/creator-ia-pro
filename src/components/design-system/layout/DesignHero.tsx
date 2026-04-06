import React from 'react';
import { Sparkles } from 'lucide-react';

export const DesignHero: React.FC = () => {
  return (
    <header className="px-8 lg:px-20 py-20 bg-zinc-50 border-b border-zinc-200 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-purple-500 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-5xl relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-600 mb-8 transition-transform hover:scale-105 cursor-pointer">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Actualización 2026</span>
        </div>
        <h1 className="text-6xl md:text-7xl font-black text-zinc-900 tracking-tighter mb-8 leading-[0.9]">
          Diseñando el <br />
          <span className="text-blue-600 italic">Futuro del Software.</span>
        </h1>
        <p className="text-xl text-zinc-500 max-w-2xl leading-relaxed font-medium">
          Aether V8.0 es un lenguaje visual unificado de alta fidelidad, optimizado para flujos de trabajo de IA, colaboración en tiempo real y experiencias de usuario premium.
        </p>
      </div>
    </header>
  );
};
