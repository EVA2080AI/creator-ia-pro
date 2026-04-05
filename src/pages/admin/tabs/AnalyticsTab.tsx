import { TrendingUp, Users2, Layers, Zap, Loader2, BarChart2, Activity } from "lucide-react";

interface AnalyticsData {
  totalSpend: number;
  recentUsers: number;
  toolUsage: { name: string; count: number; color: string }[];
  dailyCredits: { name: string; credits: number }[];
}

export function AnalyticsTab({ 
  data, 
  loading 
}: { 
  data: AnalyticsData | null; 
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Calculando Métricas Generativas</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="h-12 w-12 text-zinc-900" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Gasto 30d (Créditos)</p>
          <h3 className="text-3xl font-black text-zinc-900 font-mono tracking-tighter">
            {data.totalSpend.toLocaleString()}
          </h3>
          <p className="text-[10px] text-zinc-400 mt-2 font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-500" /> +12.4% vs mes anterior
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users2 className="h-12 w-12 text-zinc-900" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Nuevos Usuarios (7d)</p>
          <h3 className="text-3xl font-black text-zinc-900 font-mono tracking-tighter">
            {data.recentUsers}
          </h3>
          <p className="text-[10px] text-zinc-400 mt-2 font-medium flex items-center gap-1">
            Crecimiento orgánico activo
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Layers className="h-12 w-12 text-zinc-900" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Tasa de Conversión</p>
          <h3 className="text-3xl font-black text-zinc-900 font-mono tracking-tighter">
            4.2%
          </h3>
          <p className="text-[10px] text-zinc-400 mt-2 font-medium flex items-center gap-1">
            Free to Paid (Creator +)
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-100 bg-zinc-900 p-6 shadow-xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400/60 mb-1">Retención Semanal</p>
          <h3 className="text-3xl font-black text-white font-mono tracking-tighter">
            86%
          </h3>
          <p className="text-[10px] text-zinc-500 mt-2 font-medium flex items-center gap-1">
            Usuarios recurrentes activos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage by Tool */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-1 shadow-sm">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-zinc-400" />
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900">Uso por Herramienta</h4>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {data.toolUsage.map((tool) => (
              <div key={tool.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-zinc-600">{tool.name}</span>
                  <span className="text-zinc-900 font-mono">{tool.count.toLocaleString()} ops</span>
                </div>
                <div className="h-2 w-full bg-zinc-50 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${Math.min(100, (tool.count / Math.max(...data.toolUsage.map(t => t.count))) * 100)}%`,
                      backgroundColor: tool.color 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Spending */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-1 shadow-sm">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-zinc-400" />
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900">Actividad de Red (7d)</h4>
            </div>
          </div>
          <div className="p-6">
             <div className="h-48 flex items-end justify-between gap-1 mt-4">
              {data.dailyCredits.map((day) => {
                const max = Math.max(...data.dailyCredits.map(d => d.credits));
                const height = max > 0 ? (day.credits / max) * 100 : 0;
                return (
                  <div key={day.name} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className="relative w-full flex flex-col items-center justify-end h-full">
                       <div className="absolute -top-6 hidden group-hover:block bg-zinc-900 text-white text-[9px] font-bold px-2 py-1 rounded-md whitespace-nowrap z-10">
                        {day.credits.toLocaleString()} pts
                      </div>
                      <div 
                        className="w-full max-w-[32px] bg-zinc-100 group-hover:bg-primary/20 rounded-lg transition-all duration-700" 
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">{day.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
