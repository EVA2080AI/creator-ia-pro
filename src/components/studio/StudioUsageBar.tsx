import React from 'react';

interface UsageItem {
  id: string;
  label: string;
  percentage: number;
  color: string;
}

interface StudioUsageBarProps {
  items: UsageItem[];
  totalLabel?: string;
  totalValue?: string;
}

export function StudioUsageBar({ items, totalLabel, totalValue }: StudioUsageBarProps) {
  return (
    <div className="space-y-3">
      {/* Header with totals */}
      <div className="flex items-end justify-between px-1">
        <div>
          <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{totalLabel || 'Consumo Total'}</h4>
          <div className="text-[20px] font-black text-white mt-0.5">{totalValue || '$0.00'}</div>
        </div>
        <div className="flex items-center gap-3">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: item.color }} />
              <span className="text-[9px] text-white/40 font-medium">{item.label} ({item.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Segmented Bar */}
      <div className="h-2.5 w-full rounded-full overflow-hidden bg-white/[0.03] flex items-stretch border border-white/[0.05]">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="transition-all duration-700 ease-out"
            style={{ 
              width: `${item.percentage}%`, 
              background: item.color,
              boxShadow: `0 0 10px ${item.color}33`,
              marginLeft: idx === 0 ? 0 : '1px'
            }}
          />
        ))}
      </div>
      
      <p className="text-[9px] text-white/15 px-1 leading-relaxed">
        El balance de Cloud se utiliza para el hosting y servicios del backend. 
        Se actualiza diariamente a las 10:00 CET.
      </p>
    </div>
  );
}
