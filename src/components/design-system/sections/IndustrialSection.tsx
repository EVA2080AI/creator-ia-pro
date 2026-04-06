import React from 'react';
import { Shield, Sparkles, Zap, Layout, CreditCard, Crown } from 'lucide-react';

export const IndustrialSection: React.FC = () => {
  return (
    <section id="industrial" className="scroll-mt-24 p-12 rounded-[48px] bg-zinc-900 text-white relative overflow-hidden border border-white/5">
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-16">
          <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tight text-white uppercase italic">Soberanía Industrial v19.5</h2>
            <p className="text-white/40 font-medium">Arquitectura de Orquestación y Gestión Comercial de Élite.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
          {/* Hybrid Intelligence Switcher */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Inteligencia Híbrida (Modo Dual)</h3>
              <div className="inline-flex p-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative">
                <div className="flex items-center relative z-10 h-10">
                  <button className="px-6 h-full flex items-center gap-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all">
                    Plan <Sparkles className="h-3 w-3" />
                  </button>
                  <button className="px-6 h-full flex items-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
                    Agent <Zap className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic font-sans">status: Planificación estratégica activa</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-[45%] bg-blue-600 shadow-lg shadow-blue-600/20" />
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed italic">"Génesis está analizando las dependencias críticas antes de proceder a la construcción."</p>
              </div>
            </div>
          </div>

          {/* Credit & Commercial Management */}
          <div className="space-y-12">
            <div className="space-y-6">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Monitor de Recursos (Créditos)</h3>
              <div className="p-6 rounded-[2rem] bg-white text-zinc-900 shadow-2xl space-y-4 border border-zinc-100">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Saldo de Inteligencia</p>
                    <p className="text-[14px] font-black tracking-tight">Créditos de Workspace</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[18px] font-black italic text-blue-600">120 / 150</p>
                  </div>
                </div>
                <div className="h-4 w-full bg-zinc-50 rounded-full border border-zinc-100 overflow-hidden p-1">
                  <div className="h-full w-[80%] rounded-full bg-gradient-to-r from-blue-600 via-indigo-400 to-blue-600 shadow-sm" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-1.5 p-1 px-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                    <CreditCard className="h-3 w-3 text-zinc-400" />
                    <span className="text-[9px] font-black uppercase text-zinc-500">Auto-Refill: OFF</span>
                  </div>
                  <button className="text-[10px] font-black uppercase text-blue-600 tracking-widest hover:underline italic">Recargar →</button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Tiers de Soberanía (Badges)</h3>
              <div className="flex flex-wrap gap-4">
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="h-6 w-6 rounded-lg bg-blue-600/20 text-blue-600 flex items-center justify-center">
                    <Layout className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Pro Architect</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="h-6 w-6 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
                    <Crown className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Business Swarm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
