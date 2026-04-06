import React from 'react';
import { Box, ChevronRight, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ComponentSection: React.FC = () => {
  return (
    <section id="components" className="scroll-mt-24">
      <div className="flex items-center gap-4 mb-12">
        <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
          <Box className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Componentes Especiales</h2>
          <p className="text-zinc-500 font-medium">Contexto, navegación profunda y control avanzado.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Tabs System */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Sistema de Pestañas</h3>
          <div className="flex items-center gap-1 p-1 bg-zinc-50 border border-zinc-200 rounded-2xl h-12">
            {['Archivos', 'Configuración', 'API'].map((t, i) => (
              <button key={t} className={cn(
                "flex-1 px-4 py-2 rounded-[14px] text-xs font-bold transition-all",
                i === 0 ? "bg-white text-zinc-900 shadow-sm border border-zinc-200" : "text-zinc-400 hover:text-zinc-600"
              )}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Breadcrumbs (Ruta)</h3>
          <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 px-2 py-4 bg-zinc-50/50 rounded-2xl border border-zinc-100">
            <span className="hover:text-zinc-900 cursor-pointer transition-colors">Proyectos</span>
            <ChevronRight className="h-3 w-3" />
            <span className="hover:text-zinc-900 cursor-pointer transition-colors">Workspace</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-900 font-black">Main.tsx</span>
          </div>
        </div>

        {/* Modals Showcase */}
        <div className="col-span-1 lg:col-span-2 bg-zinc-900 rounded-[40px] p-12 text-center space-y-8 relative overflow-hidden group">
           <div className="relative z-10 max-w-md mx-auto space-y-6">
             <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto text-white">
               <Shield className="h-8 w-8" />
             </div>
             <h3 className="text-2xl font-black text-white tracking-tight leading-tight">Mockup de Dialog / Modal</h3>
             <p className="text-sm text-white/40 font-medium">Los modales en Aether usan paneles centrados con altos niveles de blur y tipografía robusta para acciones críticas.</p>
             <div className="flex flex-col sm:flex-row gap-3 pt-4">
               <button className="flex-1 py-3 bg-white text-zinc-900 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-zinc-100 transition-all">Confirmar Operación</button>
               <button className="flex-1 py-3 bg-white/10 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-white/20 transition-all">Cancelar</button>
             </div>
           </div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px]" />
        </div>
      </div>
    </section>
  );
};
