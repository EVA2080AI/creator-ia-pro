import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartSectionProps {
  usageData: any[];
  toolData: any[];
}

export function ChartSection({ usageData, toolData }: ChartSectionProps) {
  return (
    <section className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 p-8 bg-white border border-zinc-200 rounded-[2.5rem] shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">Actividad de la Cuenta</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={usageData}>
              <defs>
                <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsage)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-white shadow-xl shadow-zinc-200">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-300/50 mb-6">Top Herramientas</h3>
        <div className="space-y-4">
          {toolData.map((tool) => (
            <div key={tool.name} className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400">{tool.name}</span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(tool.value / 40) * 100}%` }} />
                </div>
                <span className="text-[10px] font-black">{tool.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
