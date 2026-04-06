import React from 'react';
import { Zap, Monitor } from 'lucide-react';
import { toast } from 'sonner';

export const FeedbackSection: React.FC = () => {
  return (
    <section id="feedback" className="scroll-mt-24">
      <div className="flex items-center gap-4 mb-12">
        <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Feedback & Estados</h2>
          <p className="text-zinc-500 font-medium">Comunicando el estado del sistema con claridad.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Alert Card Progress */}
        <div className="p-8 rounded-[32px] bg-zinc-900 text-white space-y-6 shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                <Monitor className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Server Status</span>
            </div>
            <h4 className="text-xl font-bold mb-1">Optimizando Activos</h4>
            <p className="text-xs text-white/40 mb-6">Procesando modelos de IA en paralelo...</p>
            <div className="space-y-4">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-[65%] bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-white opacity-40 uppercase tracking-widest">65% Completado</span>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse">Running</span>
              </div>
            </div>
          </div>
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-600/20 rounded-full blur-[60px]" />
        </div>

        {/* Profile Skeleton */}
        <div className="p-8 rounded-[32px] border border-zinc-200 bg-white space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-zinc-100 animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-[40%] bg-zinc-100 rounded-lg animate-pulse" />
              <div className="h-3 w-[60%] bg-zinc-50 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-24 w-full bg-zinc-50 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-10 bg-zinc-50 rounded-xl animate-pulse" />
              <div className="h-10 bg-zinc-50 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>

        {/* Toast Example Showcase */}
        <div className="p-8 rounded-[32px] bg-zinc-50 border border-zinc-200 flex flex-col justify-center gap-4">
          <button 
            onClick={() => toast.success('Proyecto guardado', { description: 'Los cambios se sincronizaron con éxito.' })}
            className="w-full py-4 bg-white border border-zinc-200 rounded-2xl text-[11px] font-black uppercase text-zinc-900 tracking-widest hover:border-blue-600 transition-all shadow-sm"
          >
            Probar Toast Éxito
          </button>
          <button 
            onClick={() => toast.error('Error de Conexión', { description: 'No se pudo comunicar con el servidor AI.' })}
            className="w-full py-4 bg-white border border-zinc-200 rounded-2xl text-[11px] font-black uppercase text-zinc-900 tracking-widest hover:border-red-500 transition-all shadow-sm"
          >
            Probar Toast Error
          </button>
          <button 
            onClick={() => toast.info('Nueva Versión', { description: 'Aether V8.0 está lista para explorar.' })}
            className="w-full py-4 bg-white border border-zinc-200 rounded-2xl text-[11px] font-black uppercase text-zinc-900 tracking-widest hover:border-blue-600 transition-all shadow-sm"
          >
            Probar Toast Info
          </button>
        </div>
      </div>
    </section>
  );
};
