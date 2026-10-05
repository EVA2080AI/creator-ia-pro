import { TrendingUp, Users2, Layers, Zap, Loader2, BarChart2, Activity } from "lucide-react";
import { OpenRouterProjection, type TierRow } from "../components/OpenRouterProjection";

interface AnalyticsData {
  totalSpend: number;
  recentUsers: number;
  totalUsers: number;
  payingUsers: number;
  conversionRate: number;
  toolUsage: { name: string; count: number; color: string }[];
  dailyCredits: { name: string; credits: number }[];
  /** Opcional durante el despliegue: la función vieja todavía no lo manda. */
  tiers?: TierRow[];
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Calculando Métricas Generativas</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* ¿Cuánto cargar en OpenRouter? — va primero: es la decisión de plata que este
          panel existe para responder (pedido 2026-10-05). */}
      {data.tiers && <OpenRouterProjection tiers={data.tiers} totalSpend30d={data.totalSpend} />}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="h-12 w-12 text-foreground" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Gasto 30d (Créditos)</p>
          <h3 className="text-3xl font-black text-foreground font-mono tracking-tighter">
            {data.totalSpend.toLocaleString()}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-2 font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-muted-foreground" /> Últimos 30 días
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users2 className="h-12 w-12 text-foreground" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Nuevos Usuarios (7d)</p>
          <h3 className="text-3xl font-black text-foreground font-mono tracking-tighter">
            {data.recentUsers}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-2 font-medium flex items-center gap-1">
            Crecimiento orgánico activo
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Layers className="h-12 w-12 text-foreground" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Tasa de Conversión</p>
          <h3 className="text-3xl font-black text-foreground font-mono tracking-tighter">
            {data.conversionRate}%
          </h3>
          <p className="text-[10px] text-muted-foreground mt-2 font-medium flex items-center gap-1">
            Free a plan pago
          </p>
        </div>

        {/* Deliberately always-dark spotlight card, like Dashboard's ChartSection
            "Top Herramientas" — not toggled with the app theme. */}
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900 p-6 shadow-xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Usuarios de Pago</p>
          <h3 className="text-3xl font-black text-white font-mono tracking-tighter">
            {data.payingUsers.toLocaleString()}
          </h3>
          <p className="text-[10px] text-zinc-400 mt-2 font-medium flex items-center gap-1">
            de {data.totalUsers.toLocaleString()} usuarios totales
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage by Tool */}
        <div className="rounded-3xl border border-border bg-card p-1 shadow-sm">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Uso por Herramienta</h4>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {data.toolUsage.map((tool) => (
              <div key={tool.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-muted-foreground">{tool.name}</span>
                  <span className="text-foreground font-mono">{tool.count.toLocaleString()} ops</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
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
        <div className="rounded-3xl border border-border bg-card p-1 shadow-sm">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Actividad de Red (7d)</h4>
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
                       {/* Tooltip bubble — deliberately always-dark, same convention as the
                           spotlight card above. */}
                       <div className="absolute -top-6 hidden group-hover:block bg-zinc-900 text-white text-[9px] font-bold px-2 py-1 rounded-md whitespace-nowrap z-10">
                        {day.credits.toLocaleString()} pts
                      </div>
                      <div
                        className="w-full max-w-[32px] bg-muted group-hover:bg-primary/20 rounded-lg transition-all duration-700"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">{day.name}</span>
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
