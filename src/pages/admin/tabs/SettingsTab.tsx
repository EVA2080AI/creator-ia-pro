import { useState } from "react";
import { toast } from "sonner";
import { adminService } from "@/services/billing-service";
import { 
  Shield, KeyRound, Eye, EyeOff, Save, Loader2, 
  Terminal, Database, Globe, Zap, Image, Video, Code2, 
  DollarSign, Settings
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
  const [boldApiKey, setBoldApiKey] = useState("");
  const [boldWebhookSecret, setBoldWebhookSecret] = useState("");
  const [showBoldKeys, setShowBoldKeys] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const handleSaveBoldSettings = async () => {
    if (!boldApiKey.trim() && !boldWebhookSecret.trim()) { toast.error("Ingresa al menos una clave"); return; }
    setSavingSettings(true);
    try {
      if (boldApiKey.trim()) await adminService.saveSettings("BOLD_API_KEY", boldApiKey);
      if (boldWebhookSecret.trim()) await adminService.saveSettings("BOLD_WEBHOOK_SECRET", boldWebhookSecret);
      toast.success("Configuración de Bold guardada");
      setBoldApiKey("");
      setBoldWebhookSecret("");
    } catch (err: any) {
      toast.error(err.message || "Error guardando");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bold.co Configuration */}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
             <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">API KEY (PROD)</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showBoldKeys ? "text" : "password"}
                  value={boldApiKey}
                  onChange={(e) => setBoldApiKey(e.target.value)}
                  placeholder="m_prod_..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-10 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-300 transition-colors"
                />
                <button onClick={() => setShowBoldKeys(!showBoldKeys)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  {showBoldKeys ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
             <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">WEBHOOK SECRET</label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showBoldKeys ? "text" : "password"}
                  value={boldWebhookSecret}
                  onChange={(e) => setBoldWebhookSecret(e.target.value)}
                  placeholder="whsec_..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-10 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-300 transition-colors"
                />
              </div>
            </div>
            <button
               onClick={handleSaveBoldSettings}
               disabled={savingSettings}
               className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black text-white hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {savingSettings ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Guardar Configuración
            </button>
          </div>
          
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-6 flex flex-col justify-center">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Las claves de API de Bold se almacenan de forma segura en las variables de entorno de Supabase. Una vez guardadas, no podrán ser visualizadas de nuevo por seguridad, solo podrán ser sobrescritas.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-white border border-zinc-100 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Shield className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-bold text-zinc-600">Encriptación AES-256 Activa</p>
            </div>
          </div>
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
