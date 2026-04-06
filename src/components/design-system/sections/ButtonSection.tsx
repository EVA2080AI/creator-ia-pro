import React from 'react';
import { MousePointer2, Sparkles, Layers, Box, Monitor, Send, Zap, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ButtonSection: React.FC = () => {
  return (
    <section id="buttons" className="scroll-mt-24">
      <div className="flex items-center gap-4 mb-12">
        <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
          <MousePointer2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Interacciones Primarias</h2>
          <p className="text-zinc-500 font-medium">Botones táctiles con respuestas dinámicas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="p-10 rounded-[32px] bg-zinc-50 border border-zinc-200 space-y-10">
          <div className="space-y-6">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Main Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-zinc-900/20">
                Explorar Proyectos
              </button>
              <button className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-600/20">
                Crear App
              </button>
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Outline & Subtle</h3>
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-4 border-2 border-zinc-900 text-zinc-900 rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all">
                Documentación
              </button>
              <button className="px-8 py-4 bg-white border border-zinc-200 text-zinc-500 rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-zinc-50 transition-all">
                Ajustes
              </button>
            </div>
          </div>
        </div>

        <div className="p-10 rounded-[32px] border border-zinc-200 space-y-10">
          <div className="space-y-6">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Floating Toolbars</h3>
            <div className="inline-flex items-center gap-1.5 p-2 bg-white rounded-2xl border border-zinc-200 shadow-2xl">
              {[Sparkles, Layers, Box, Monitor, Send].map((Icon, i) => (
                <button key={i} className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-xl transition-all",
                  i === 0 ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900"
                )}>
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Icon Tags</h3>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 pl-2 pr-4 py-2 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 font-bold text-xs">
                <div className="h-6 w-6 rounded-lg bg-violet-200/50 flex items-center justify-center">
                  <Zap className="h-4 w-4" />
                </div>
                Generative Pack
              </div>
              <div className="flex items-center gap-2 pl-2 pr-4 py-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 font-bold text-xs">
                <div className="h-6 w-6 rounded-lg bg-amber-200/50 flex items-center justify-center">
                  <Shield className="h-4 w-4" />
                </div>
                Secured API
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
