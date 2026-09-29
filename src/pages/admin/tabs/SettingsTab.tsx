import {
  Shield, Terminal, Database, Globe,
} from "lucide-react";

export function SettingsTab({
  routes,
  tables,
  edgeFunctions
}: {
  routes: { path: string, desc: string }[],
  tables: { name: string, desc: string, rows: number | null }[],
  edgeFunctions: { name: string, desc: string, icon: any, color: string }[]
}) {
  return (
    <div className="space-y-6">
      {/* Bold.co Configuration — informativo: las claves reales viven en Vercel, no aquí.
          Este panel escribía antes a una función de Supabase que nadie lee (api/billing/checkout.ts
          solo lee process.env.BOLD_API_KEY en Vercel), así que guardar algo aquí no tenía ningún efecto. */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground tracking-tight">Integración de Pagos (Bold.co)</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pasarela Industrial</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/50 p-6">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <code className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">BOLD_API_KEY</code> y{" "}
            <code className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">BOLD_WEBHOOK_SECRET</code> ya no se configuran desde aquí.
            El checkout de producción las lee directamente de las variables de entorno del proyecto en Vercel — cambiarlas ahí es lo único que tiene efecto real.
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3">
            Vercel → creator-ia-pro → Settings → Environment Variables
          </p>
        </div>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Meta */}
        <div className="space-y-6">
          {/* Edge Functions */}
          <div className="rounded-3xl border border-border bg-card p-1 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Motores Generativos (Edge)</h4>
              </div>
            </div>
            <div className="divide-y divide-border">
              {edgeFunctions.map((ef) => {
                const Icon = ef.icon;
                return (
                  <div key={ef.name} className="px-5 py-3 flex items-center justify-between hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: ef.color + '10', color: ef.color }}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-foreground">{ef.name}</p>
                        <p className="text-[10px] text-muted-foreground">{ef.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 border border-emerald-100/50 dark:border-emerald-500/30">
                      <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase">Live</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Database Info */}
          <div className="rounded-3xl border border-border bg-card p-1 shadow-sm overflow-hidden">
             <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Arquitectura de Datos</h4>
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto divide-y divide-border scrollbar-thin">
              {tables.map((table) => (
                <div key={table.name} className="px-5 py-3 flex items-center justify-between hover:bg-muted transition-colors">
                  <div>
                    <p className="text-[11px] font-bold text-foreground">{table.name}</p>
                    <p className="text-[10px] text-muted-foreground">{table.desc}</p>
                  </div>
                  {table.rows !== null && (
                    <span className="text-[10px] font-mono font-bold text-muted-foreground">{table.rows} filas</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sitemap / Routing */}
        <div className="rounded-3xl border border-border bg-card p-1 shadow-sm overflow-hidden">
           <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Mapa del Ecosistema</h4>
            </div>
          </div>
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto scrollbar-thin">
            {routes.map((route) => (
              <div key={route.path} className="px-5 py-3 hover:bg-muted transition-colors group">
                <p className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors">{route.path}</p>
                <p className="text-[10px] text-muted-foreground">{route.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
