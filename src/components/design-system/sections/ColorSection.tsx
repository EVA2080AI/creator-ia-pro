import React from 'react';
import { Palette, Copy } from 'lucide-react';
import { COLORS } from '../constants';

export const ColorSection: React.FC = () => {
  return (
    <section id="colors" className="scroll-mt-24">
      <div className="flex items-center gap-4 mb-12">
        <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
          <Palette className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Paleta Semántica</h2>
          <p className="text-zinc-500 font-medium">Colores cuidadosamente curados para cada función.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {COLORS.map((c) => (
          <div key={c.name} className="group flex flex-col rounded-2xl border border-zinc-200 hover:shadow-2xl hover:shadow-zinc-200 transition-all duration-500 overflow-hidden">
            <div className="h-32 w-full p-4 flex flex-col justify-between" style={{ backgroundColor: c.hex }}>
              <div className="flex justify-between items-start">
                <div className="px-2 py-0.5 rounded bg-white/20 backdrop-blur-md border border-white/20">
                  <span className="text-[10px] font-black text-white uppercase">{c.hex}</span>
                </div>
                <button className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="p-6 bg-white flex-1">
              <h3 className="font-bold text-zinc-900 mb-1">{c.name}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
