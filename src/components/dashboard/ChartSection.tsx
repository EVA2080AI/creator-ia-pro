import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from "framer-motion";
import { TrendingUp, Activity, Sparkles } from "lucide-react";

interface ChartSectionProps {
  usageData: any[];
  toolData: any[];
}

export function ChartSection({ usageData, toolData }: ChartSectionProps) {
  // Calculate maximum value dynamically to prevent progress bar overflow
  const maxToolValue = useMemo(() => {
    const max = Math.max(...(toolData?.map(t => t.value) || [0]), 1);
    return max * 1.15; // Give headroom so the highest bar isn't 100% full
  }, [toolData]);

  // Ensure toolData is an array to avoid map errors
  const safeToolData = toolData || [];

  return (
    <section className="grid lg:grid-cols-3 gap-6">
      {/* ─────────────────────────────────────────────────────────────
          LEFT CARD: ACCOUNT ACTIVITY
      ───────────────────────────────────────────────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="lg:col-span-2 p-8 bg-white/70 backdrop-blur-xl border border-zinc-200/60 rounded-[2.5rem] shadow-sm relative overflow-hidden group"
      >
        {/* Ambient glow in corner */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -z-10 group-hover:bg-primary/10 transition-colors duration-700" />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-zinc-100 border border-zinc-200/80 text-zinc-600 shadow-sm">
               <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Actividad de la Cuenta</h3>
              <p className="text-[15px] font-bold text-zinc-900 mt-0.5 tracking-tight">Evolución de uso en el mes</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 border border-emerald-100 shadow-sm">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-600">+14% vs mes anterior</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[240px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={usageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUsagePremium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '1.25rem', 
                  border: '1px solid #e4e4e7', 
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                  padding: '12px 16px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)'
                }}
                itemStyle={{ color: '#18181b', fontWeight: '900', fontSize: '14px' }}
                animationDuration={200}
                cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#8b5cf6" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorUsagePremium)" 
                activeDot={{ r: 6, strokeWidth: 3, fill: '#fff', stroke: '#8b5cf6' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT CARD: TOP TOOLS
      ───────────────────────────────────────────────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="p-8 bg-zinc-950 rounded-[2.5rem] text-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col group border border-zinc-800/80"
      >
        {/* Subtle dynamic glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/10 to-transparent blur-[100px] -z-10 group-hover:from-primary/20 transition-all duration-1000 rotate-12" />
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-zinc-900/80 border border-zinc-800 text-primary shadow-inner">
             <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Top Herramientas</h3>
            <p className="text-[15px] font-bold text-zinc-100 mt-0.5 tracking-tight">Uso por módulo</p>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-7 flex-1 justify-center flex flex-col relative z-10 mt-2">
          {safeToolData.length === 0 ? (
            <div className="text-center text-zinc-500 text-sm font-medium">No hay datos disponibles</div>
          ) : (
            safeToolData.map((tool, index) => (
              <motion.div 
                key={tool.name} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (index * 0.1) }}
                className="group/item flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-zinc-400 group-hover/item:text-white transition-colors">{tool.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{tool.value}</span>
                    <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">usos</span>
                  </div>
                </div>
                
                {/* Track */}
                <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80 relative shadow-inner">
                  {/* Animated Bar */}
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(tool.value / maxToolValue) * 100}%` }}
                    transition={{ duration: 1.2, delay: 0.4 + (index * 0.1), ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-purple-400 rounded-full"
                    style={{ 
                      boxShadow: '0 0 12px 0px rgba(168,85,247,0.4)',
                    }}
                  />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </section>
  );
}
