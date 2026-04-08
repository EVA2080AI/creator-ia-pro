import React from "react";

interface StatProps {
  label: string;
  value: string | number;
  icon: any;
  colorClass: string;
}

export function StatCard({ label, value, icon: Icon, colorClass }: StatProps) {
  return (
    <div className="p-5 bg-white border border-zinc-200 rounded-[2rem] shadow-sm flex items-center gap-4">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-zinc-50 border border-zinc-100 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-zinc-900">{value}</p>
      </div>
    </div>
  );
}
