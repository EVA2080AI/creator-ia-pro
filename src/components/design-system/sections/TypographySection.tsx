import React from 'react';
import { Type } from 'lucide-react';

export const TypographySection: React.FC = () => {
  return (
    <section id="typography" className="scroll-mt-24">
      <div className="flex items-center gap-4 mb-12">
        <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
          <Type className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Voz & Branding</h2>
          <p className="text-zinc-500 font-medium">Tipografía Inter para una claridad absoluta.</p>
        </div>
      </div>

      <div className="space-y-16 bg-white border border-zinc-200 p-12 rounded-[40px] shadow-sm">
        <div className="space-y-4">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">H1 / Inter Black</span>
          <h1 className="text-7xl font-black text-zinc-900 tracking-tight leading-[0.9]">Transformamos ideas en productos digitales.</h1>
        </div>
        <div className="space-y-4">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">H2 / Inter Bold</span>
          <h2 className="text-4xl font-bold text-zinc-900 tracking-tight">El mejor editor para desarrolladores de IA.</h2>
        </div>
        <div className="space-y-4">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Body / Inter Medium</span>
          <p className="text-xl text-zinc-500 leading-relaxed max-w-4xl font-medium">
            En Creator IA Pro, creemos que el diseño es la inteligencia hecha invisible. Cada píxel debe servir a un propósito, eliminando la fricción entre el pensamiento y la ejecución técnica.
          </p>
        </div>
      </div>
    </section>
  );
};
