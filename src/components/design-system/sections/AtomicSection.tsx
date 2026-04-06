import React from 'react';
import { Command, Plus } from 'lucide-react';

export const AtomicSection: React.FC = () => {
  return (
    <section id="atomic" className="scroll-mt-24 border-t-4 border-blue-600 pt-24">
      <div className="flex items-center gap-4 mb-12">
        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
          <Command className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Estructura Atómica & Studio V7</h2>
          <p className="text-zinc-500 font-medium">Documentación técnica de la evolución Aether V8.0.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Atomic Tokens */}
        <div className="space-y-8">
          <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest border-l-2 border-blue-600 pl-4">Tokens de Diseño (HSL)</h3>
          <div className="bg-zinc-900 rounded-[32px] p-8 text-zinc-300 font-mono text-[11px] leading-relaxed shadow-2xl">
            <span className="text-zinc-500">// globals.css — Tokens Atómicos</span><br />
            <span className="text-blue-400">--primary</span>: <span className="text-emerald-400">221.2 83.2% 53.3%</span>; <span className="text-zinc-600">/* #3B82F6 */</span><br />
            <span className="text-blue-400">--background</span>: <span className="text-emerald-400">0 0% 100%</span>;<br />
            <span className="text-blue-400">--radius</span>: <span className="text-emerald-400">1rem</span>;<br />
            <span className="text-blue-400">--sidebar-w</span>: <span className="text-emerald-400">410px</span>; <span className="text-zinc-600">/* Studio Chat Width */</span>
          </div>
          <div className="space-y-4 text-left">
            <h4 className="text-sm font-bold text-zinc-900">Reglas de Espaciado "Magnetic"</h4>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium">
              En la versión V7, los elementos flotantes deben mantener un margen de <span className="text-zinc-900 font-black">32px (8rem)</span> desde los bordes de la pantalla.
            </p>
          </div>
        </div>

        {/* Functional Specs */}
        <div className="space-y-8 text-left">
          <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest border-l-2 border-blue-600 pl-4">Funcionalidades Studio V7</h3>
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Plus className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Universal Plus Menu</h4>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">Sistema de ingesta centralizado para archivos, código y URLs.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
