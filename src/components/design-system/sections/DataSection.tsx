import React from 'react';
import { Database, User, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DataSection: React.FC = () => {
  return (
    <section id="data" className="scroll-mt-24">
      <div className="flex items-center gap-4 mb-12">
        <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
          <Database className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Datos & Visualización</h2>
          <p className="text-zinc-500 font-medium">Componentes para estados y gestión de entidades.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Badges and Tags */}
        <div className="space-y-6 p-8 rounded-3xl bg-zinc-50 border border-zinc-200">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Badges de Estado</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { l: 'PRODUCCIÓN', c: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
              { l: 'BETA', c: 'bg-blue-50 text-blue-600 border-blue-100' },
              { l: 'ERROR', c: 'bg-red-50 text-red-600 border-red-100' },
              { l: 'PAGADO', c: 'bg-violet-50 text-violet-600 border-violet-100' },
            ].map(b => (
              <div key={b.l} className={cn("px-2.5 py-1 rounded-full border text-[9px] font-black tracking-widest uppercase", b.c)}>
                {b.l}
              </div>
            ))}
          </div>
        </div>

        {/* User Row (Pattern Admin) */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">User Card (Admin Style)</h3>
          <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center gap-4 transition-all hover:border-blue-600">
            <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200 overflow-hidden">
              <User className="h-6 w-6 text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-zinc-900 truncate">Juan Másmela</h4>
              <p className="text-xs text-zinc-500 truncate font-medium">juan@aether.ai</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 rounded-lg bg-blue-600/10 text-blue-600 text-[9px] font-black uppercase">CREATOR</div>
              <button className="p-2 hover:bg-zinc-50 rounded-lg text-zinc-400 hover:text-zinc-900 transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
