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
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-zinc-900 tracking-tight">Integración de Pagos (Bold.co)</h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pasarela Industrial</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-6">
          <p className="text-xs text-zinc-500 leading-relaxed">
            <code className="font-mono text-[11px] bg-zinc-100 px-1.5 py-0.5 rounded">BOLD_API_KEY</code> y{" "}
            <code className="font-mono text-[11px] bg-zinc-100 px-1.5 py-0.5 rounded">BOLD_WEBHOOK_SECRET</code> ya no se configuran desde aquí.
            El checkout de producción las lee directamente de las variables de entorno del proyecto en Vercel — cambiarlas ahí es lo único que tiene efecto real.
          </p>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-3">
            Vercel → creator-ia-pro → Settings → Environment Variables
          </p>
        </div>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Meta */}
        <div className="space-y-6">
          {/* Edge Functions */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-1 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-zinc-400" />
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900">Motores Generativos (Edge)</h4>
              </div>
            </div>
            <div className="divide-y divide-zinc-50">
              {edgeFunctions.map((ef) => {
                const Icon = ef.icon;
                return (
                  <div key={ef.name} className="px-5 py-3 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: ef.color + '10', color: ef.color }}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-zinc-900">{ef.name}</p>
                        <p className="text-[10px] text-zinc-400">{ef.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-100/50">
                      <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-emerald-600 uppercase">Live</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Database Info */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-1 shadow-sm overflow-hidden">
             <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-zinc-400" />
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900">Arquitectura de Datos</h4>
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-50 scrollbar-thin">
              {tables.map((table) => (
                <div key={table.name} className="px-5 py-3 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                  <div>
                    <p className="text-[11px] font-bold text-zinc-900">{table.name}</p>
                    <p className="text-[10px] text-zinc-400">{table.desc}</p>
                  </div>
                  {table.rows !== null && (
                    <span className="text-[10px] font-mono font-bold text-zinc-400">{table.rows} filas</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sitemap / Routing */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-1 shadow-sm overflow-hidden">
           <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-zinc-400" />
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900">Mapa del Ecosistema</h4>
            </div>
          </div>
          <div className="divide-y divide-zinc-50 max-h-[600px] overflow-y-auto scrollbar-thin">
            {routes.map((route) => (
              <div key={route.path} className="px-5 py-3 hover:bg-zinc-50 transition-colors group">
                <p className="text-[11px] font-bold text-zinc-900 group-hover:text-primary transition-colors">{route.path}</p>
                <p className="text-[10px] text-zinc-400">{route.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
