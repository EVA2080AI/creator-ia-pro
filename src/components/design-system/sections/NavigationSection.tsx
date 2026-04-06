import React from 'react';
import { Layers, Github, Monitor, Code, Search, GitBranch, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export const NavigationSection: React.FC = () => {
  return (
    <section id="navigation" className="scroll-mt-24">
      <div className="flex items-center gap-4 mb-12">
        <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Navegación & Paneles</h2>
          <p className="text-zinc-500 font-medium">Sistemas de acceso y organización de herramientas.</p>
        </div>
      </div>

      <div className="space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest">Patrón Global</div>
            <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Sidebar Principal (Global)</h3>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium">
              Utilizada en la raíz de la aplicación para navegación macro. Diseñada para ser minimalista, con iconos Lucide y estados activos en la marca principal.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-xs font-bold text-zinc-600">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                Ancho estándar: 280px (Expandido) / 80px (Colapsado)
              </li>
              <li className="flex items-center gap-3 text-xs font-bold text-zinc-600">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                Fondo: Zinc 50 con bordes Zinc 200
              </li>
            </ul>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 overflow-hidden">
            <div className="w-48 bg-white border border-zinc-200 rounded-xl shadow-sm p-4 space-y-4 font-sans">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-blue-600 rounded shadow-sm flex items-center justify-center text-[10px] text-white">C</div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-900">Creator IA</span>
              </div>
              {[
                { l: 'Dashboard', i: Layers, a: true },
                { l: 'Studio', i: Code, a: false },
                { l: 'Assets', i: Package, a: false },
              ].map((item, i) => (
                <div key={i} className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold",
                  item.a ? "bg-blue-600/5 text-blue-600 border border-blue-600/10" : "text-zinc-400"
                )}>
                  <item.i className="h-3.5 w-3.5" />
                  {item.l}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start pt-12 border-t border-zinc-100">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest">Patrón IDE</div>
            <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Barra de Actividad & Paneles de Dev</h3>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium">
              Sistemas densos optimizados para el editor de código. Incluye la barra vertical de iconos y el nuevo panel de utilidades derecho.
            </p>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-zinc-200 bg-white">
                <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest mb-2">Panel de Control de Versiones</h4>
                <p className="text-[11px] text-zinc-500 mb-3">Refactorizado para ser un menú de lista con iconos integrados:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 p-1.5 rounded bg-zinc-50 border border-zinc-100 text-zinc-600">
                    <Github className="h-3 w-3" />
                    <span className="text-[10px] font-bold">Sync GitHub</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-50 text-zinc-400">
                    <Monitor className="h-3 w-3" />
                    <span className="text-[10px] font-bold">Publicar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900 rounded-[32px] p-8 flex justify-center items-center shadow-2xl relative overflow-hidden">
            <div className="flex gap-4 items-stretch h-64">
              <div className="w-[48px] bg-zinc-800/50 backdrop-blur-md rounded-2xl flex flex-col items-center py-4 gap-4 border border-white/5">
                {[Code, Search, GitBranch, Package].map((I, i) => (
                  <div key={i} className={cn("text-zinc-600", i === 0 && "text-white")}>
                    <I className="h-5 w-5" />
                  </div>
                ))}
              </div>
              <div className="w-32 bg-white rounded-2xl border border-white/10 p-4">
                <div className="h-2 w-[60%] bg-zinc-100 rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-zinc-50 rounded" />
                  <div className="h-1.5 w-[80%] bg-zinc-50 rounded" />
                  <div className="h-1.5 w-full bg-zinc-50 rounded" />
                </div>
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-600/20 rounded-full blur-[60px]" />
          </div>
        </div>
      </div>
    </section>
  );
};
