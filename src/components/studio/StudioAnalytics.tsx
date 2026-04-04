import React from 'react';
import { Activity, Users, Zap, TrendingUp, Clock, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string;
  trend: string;
  isPositive?: boolean;
  icon: React.ElementType;
}

function MetricCard({ title, value, trend, isPositive = true, icon: Icon }: MetricCardProps) {
  return (
    <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-primary/40 transition-all text-left shadow-2xl backdrop-blur-sm relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-primary/10 flex items-center justify-center transition-all duration-500 group-hover:rotate-6">
          <Icon className="w-5 h-5 text-zinc-500 group-hover:text-primary transition-colors" />
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {trend}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-black text-white mb-1 font-display tracking-tighter">{value}</h3>
        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{title}</p>
      </div>
    </div>
  );
}

export function StudioAnalytics({ projectId }: { projectId: string | null }) {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-[#080808] p-8 h-full">
      <div className="max-w-6xl mx-auto space-y-8 pb-32">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter font-display uppercase mb-2">Analytics</h1>
            <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Rendimiento en tiempo real</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Live</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Visitas Únicas" value="12,450" trend="+14.5%" icon={Users} />
          <MetricCard title="Tiempo Activo" value="4m 12s" trend="+2.4%" icon={Clock} />
          <MetricCard title="Tasa de Error" value="0.12%" trend="-0.05%" icon={Activity} isPositive={true} />
          <MetricCard title="Uso de IA (Tokens)" value="1.2M" trend="+45%" icon={Zap} isPositive={false} />
        </div>

        {/* Main Chart Area (Placeholder) */}
        <div className="mt-8 p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 relative overflow-hidden h-[400px]">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
           <div className="relative z-10 h-full flex flex-col">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-sm font-black text-white uppercase tracking-widest">Trafico Global</h3>
                 <div className="flex gap-2">
                    <button className="px-4 py-1.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">7D</button>
                    <button className="px-4 py-1.5 rounded-full bg-white/5 text-zinc-400 text-[10px] font-black uppercase hover:bg-white/10 transition-colors tracking-widest">30D</button>
                    <button className="px-4 py-1.5 rounded-full bg-white/5 text-zinc-400 text-[10px] font-black uppercase hover:bg-white/10 transition-colors tracking-widest">3M</button>
                 </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                 <div className="text-center space-y-4">
                    <Globe className="w-12 h-12 text-white/10 mx-auto" />
                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Gráfico de Tráfico en construcción</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
