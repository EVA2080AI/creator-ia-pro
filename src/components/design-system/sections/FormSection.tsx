import React from 'react';
import { Layout, Search, Bell, Layers } from 'lucide-react';

export const FormSection: React.FC = () => {
  return (
    <section id="forms" className="scroll-mt-24">
      <div className="flex items-center gap-4 mb-12">
        <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 border border-zinc-200">
          <Layout className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Formularios & Controles</h2>
          <p className="text-zinc-500 font-medium">Inputs responsivos y estados de interacción.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-[0.15em] ml-1">Label Estándar</label>
            <input 
              type="text"
              placeholder="Ingrese su nombre..."
              className="w-full h-12 bg-white border border-zinc-200 rounded-xl px-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-[0.15em] ml-1">Búsqueda con Icono</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input 
                type="text"
                placeholder="Buscar en el sistema..."
                className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-zinc-400 transition-all"
              />
            </div>
          </div>
        </div>
        
        <div className="p-8 rounded-3xl bg-zinc-50 border border-zinc-200 space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-zinc-200">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <Bell className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-zinc-900">Notificaciones</span>
            </div>
            <button className="h-6 w-11 rounded-full bg-blue-600 relative transition-colors">
              <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-zinc-200">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-zinc-900">Modo Desarrollador</span>
            </div>
            <button className="h-6 w-11 rounded-full bg-zinc-200 relative transition-colors">
              <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
