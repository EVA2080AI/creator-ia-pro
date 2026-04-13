import { useState, useEffect } from "react";
import { 
  Shield, KeyRound, Eye, EyeOff, Save, Loader2, 
  Database, Github, Cloud, Zap, CheckCircle2, 
  ExternalLink, Copy, Lock, Edit2, X
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { adminService } from "@/services/billing-service";

interface Credential {
  id: string;
  envKey: string;
  service: string;
  name: string;
  key: string;
  status: 'active' | 'expired' | 'pending';
  icon: any;
  color: string;
}

export function CredentialsTab() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [credentials, setCredentials] = useState<Credential[]>([]);

  const initialTemplate: Omit<Credential, 'key' | 'status'>[] = [
    { 
      id: 'antigravity', 
      envKey: 'OPENROUTER_API_KEY',
      service: 'Antigravity AI', 
      name: 'Neural Core (OpenRouter)', 
      icon: Zap, 
      color: 'text-amber-500' 
    },
    { 
      id: 'vercel', 
      envKey: 'VERCEL_TOKEN',
      service: 'Vercel', 
      name: 'Deployment Edge', 
      icon: Cloud, 
      color: 'text-zinc-900' 
    },
    { 
      id: 'supabase', 
      envKey: 'SUPABASE_SERVICE_ROLE_KEY',
      service: 'Supabase', 
      name: 'Service Role Key', 
      icon: Database, 
      color: 'text-emerald-500' 
    },
    { 
      id: 'github', 
      envKey: 'GITHUB_ACCESS_TOKEN',
      service: 'GitHub', 
      name: 'VCS Automation Account', 
      icon: Github, 
      color: 'text-zinc-600' 
    }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setFetching(true);
    try {
      const settings = await adminService.getSettings();
      const mapped = initialTemplate.map(t => ({
        ...t,
        key: settings[t.envKey] || 'No configurada',
        status: settings[t.envKey] ? 'active' : 'pending' as any
      }));
      setCredentials(mapped);
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setFetching(false);
    }
  };

  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEdit = (cred: Credential) => {
    setEditingId(cred.id);
    setEditValue(cred.key === 'No configurada' ? '' : cred.key);
  };

  const handleSave = async (cred: Credential) => {
    if (!editValue.trim()) {
      toast.error("La clave no puede estar vacía");
      return;
    }
    setLoading(true);
    try {
      await adminService.saveSettings(cred.envKey, editValue);
      toast.success(`${cred.service} actualizada`);
      setEditingId(null);
      await loadSettings();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Copiado al portapapeles");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase">Bóveda de Credenciales</h2>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Gestión en tiempo real de llaves de infraestructura</p>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        {fetching ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Sincronizando Núcleo...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Servicio / Plataforma</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Identificador</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Clave de Acceso (Token)</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {credentials.map((cred) => {
                  const Icon = cred.icon;
                  const isVisible = showKeys[cred.id];
                  const isEditing = editingId === cred.id;

                  return (
                    <tr key={cred.id} className="hover:bg-zinc-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-9 w-9 rounded-xl bg-zinc-50 flex items-center justify-center border border-zinc-100", cred.color)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-zinc-900 uppercase tracking-tight">{cred.service}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{cred.envKey}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-zinc-600 italic">"{cred.name}"</p>
                      </td>
                      <td className="px-6 py-5">
                        {isEditing ? (
                          <div className="relative">
                            <input 
                              type="password"
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full h-8 px-3 rounded-lg bg-zinc-50 border border-zinc-300 pr-16 text-xs font-mono outline-none focus:ring-2 ring-primary/20"
                              placeholder="sk_..."
                            />
                            <div className="absolute right-1 top-1 flex gap-1">
                              <button onClick={() => setEditingId(null)} className="h-6 w-6 rounded-md bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-red-500">
                                <X className="h-3 w-3" />
                              </button>
                              <button onClick={() => handleSave(cred)} disabled={loading} className="h-6 w-6 rounded-md bg-zinc-900 flex items-center justify-center text-white hover:bg-black disabled:opacity-50">
                                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 font-mono text-[10px] text-zinc-500 min-w-[200px] flex items-center justify-between group/key">
                              <span>{isVisible ? cred.key : '••••••••••••••••'}</span>
                              <div className="flex gap-1 overflow-hidden opacity-0 group-hover/key:opacity-100 transition-all">
                                <button 
                                  onClick={() => toggleKeyVisibility(cred.id)}
                                  className="text-zinc-400 hover:text-zinc-600 p-0.5 rounded transition-colors"
                                >
                                  {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </button>
                                <button onClick={() => handleCopy(cred.key)} className="text-zinc-400 hover:text-zinc-600 p-0.5 rounded transition-colors">
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          {cred.status === 'active' ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-black uppercase">
                              <CheckCircle2 className="h-3 w-3" />
                              Activo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-[9px] font-black uppercase">
                              <Shield className="h-3 w-3" />
                              Pendiente
                            </span>
                          ) }
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          {!isEditing && (
                            <button 
                              onClick={() => handleEdit(cred)}
                              className="h-8 w-8 rounded-lg bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:border-zinc-300 shadow-sm transition-all flex items-center justify-center"
                              title="Editar Credencial"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button className="h-8 w-8 rounded-lg bg-white border border-zinc-200 text-zinc-400 flex items-center justify-center hover:text-zinc-900 hover:border-zinc-300 shadow-sm transition-all" title="Ver en Consola">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl bg-zinc-100 border border-zinc-200 p-6 space-y-3">
          <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-zinc-400 shadow-sm">
            <Shield className="h-5 w-5" />
          </div>
          <h4 className="text-xs font-black text-zinc-900 uppercase italic">Control de Infraestructura</h4>
          <p className="text-[10px] text-zinc-500 leading-relaxed font-bold">
            Estos tokens permiten al sistema interactuar con nubes externas. Mantenerlos actualizados asegura que Genesis y el Canvas IA funcionen sin interrupciones.
          </p>
        </div>
        <div className="md:col-span-2 rounded-3xl bg-zinc-900 p-8 text-white relative overflow-hidden flex flex-col justify-center">
           <Zap className="absolute -right-8 -bottom-8 h-48 w-48 text-white/5 rotate-12" />
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="h-16 w-16 rounded-[2rem] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight mb-2 uppercase italic leading-none">Guardado Persistente</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4 font-medium opacity-80">
                  Cada vez que guardas, el sistema actualiza la tabla `app_settings` en Supabase de forma segura. Estos valores son consumidos en tiempo real por los Proxies de IA y Automatización.
                </p>
                <p className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" />
                  Conexión encriptada establecida
                </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
