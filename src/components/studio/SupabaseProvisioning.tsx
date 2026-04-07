import { useState, useEffect } from 'react';
import { Database, Loader2, Key, AlertCircle, CheckCircle, ChevronRight, Zap } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
}

interface SupabaseProvisioningProps {
  onProvisioned: (config: { url: string; anonKey: string }) => void;
  onCancel: () => void;
}

interface SupabaseApiKey {
  name: string;
  api_key: string;
}

export function SupabaseProvisioning({ onProvisioned, onCancel }: SupabaseProvisioningProps) {
  const [pat, setPat] = useState(localStorage.getItem('supabase_pat') || '');
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [projectName, setProjectName] = useState('genesis-project-' + Math.floor(Math.random() * 1000));
  const [dbPass, setDbPass] = useState(
    Array(16).fill(0).map(() => Math.random().toString(36).charAt(2)).join('') + 'A1!'
  );
  
  const [step, setStep] = useState<'pat' | 'org' | 'creating' | 'polling' | 'keys' | 'done'>(pat ? 'org' : 'pat');
  const [error, setError] = useState('');

  useEffect(() => {
    if (pat && step === 'org' && orgs.length === 0) {
      loadOrgs();
    }
  }, [pat, step]);

  const loadOrgs = async () => {
    setError('');
    try {
      const res = await fetch('https://api.supabase.com/v1/organizations', {
        headers: { 'Authorization': `Bearer ${pat}` }
      });
      if (!res.ok) throw new Error('Token inválido o expirado.');
      const data = await res.json();
      setOrgs(data);
      if (data.length > 0) setSelectedOrg(data[0].id);
      localStorage.setItem('supabase_pat', pat);
      setStep('org');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar organizaciones';
      setError(msg);
      setStep('pat');
    }
  };

  const createProject = async () => {
    setError('');
    setStep('creating');
    try {
      const res = await fetch('https://api.supabase.com/v1/projects', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${pat}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: selectedOrg,
          name: projectName,
          db_pass: dbPass,
          region: 'us-east-1',
          plan: 'free'
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Error creando proyecto');
      }
      
      const project = await res.json();
      setStep('polling');
      pollProjectReady(project.ref);
      
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al provisionar';
      setError(msg);
      setStep('org');
    }
  };

  const pollProjectReady = async (ref: string) => {
    const check = async () => {
      try {
        const res = await fetch(`https://api.supabase.com/v1/projects/${ref}`, {
          headers: { 'Authorization': `Bearer ${pat}` }
        });
        const data = await res.json();
        if (data.status === 'ACTIVE_HEALTHY') {
          fetchApiKeys(ref);
        } else {
          setTimeout(check, 5000);
        }
      } catch (err) {
        setTimeout(check, 5000);
      }
    };
    check();
  };

  const fetchApiKeys = async (ref: string) => {
    setStep('keys');
    try {
      const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, {
        headers: { 'Authorization': `Bearer ${pat}` }
      });
      const data = await res.json() as SupabaseApiKey[];
      const anonKeyObj = data.find((k) => k.name === 'anon');
      
      if (anonKeyObj) {
        setStep('done');
        setTimeout(() => {
          onProvisioned({
            url: `https://${ref}.supabase.co`,
            anonKey: anonKeyObj.api_key
          });
        }, 1500);
      } else {
        throw new Error('No se encontró clave anon');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error obteniendo claves API';
      setError(msg);
      setStep('org');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="h-4 w-4 text-[#8AB4F8]" />
        <h2 className="text-[13px] font-bold text-white/90">Aprovisionamiento IA</h2>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-xl text-[11px]" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {step === 'pat' && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <p className="text-[11px] text-white/40 mb-3 leading-relaxed">
            Ingresa tu "Personal Access Token" de la API de administración de Supabase.
          </p>
          <div>
            <label className="text-[10px] font-bold text-white/25 uppercase tracking-widest block mb-1">Access Token</label>
            <input
              type="password"
              value={pat}
              onChange={e => setPat(e.target.value)}
              placeholder="sbp_xxxxxxxxxxxxxxxxx"
              className="w-full text-[12px] text-white placeholder:text-white/15 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 outline-none focus:border-[#8AB4F8]/50 transition-colors font-mono"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={onCancel} className="flex-1 py-2 rounded-xl text-[11px] font-semibold text-white/40 hover:text-white transition-colors" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Cancelar</button>
            <button onClick={loadOrgs} disabled={!pat} className="flex-1 py-2 rounded-xl text-[11px] font-semibold text-black bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 transition-colors">Continuar</button>
          </div>
        </div>
      )}

      {step === 'org' && (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
          <div>
            <label className="text-[10px] font-bold text-white/25 uppercase tracking-widest block mb-1">Organización</label>
            <select
              value={selectedOrg}
              onChange={e => setSelectedOrg(e.target.value)}
              className="w-full text-[12px] text-white bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 outline-none focus:border-[#8AB4F8]/50 transition-colors"
            >
              <option value="" disabled>Selecciona una organización</option>
              {orgs.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-white/25 uppercase tracking-widest block mb-1">Nombre del Proyecto</label>
            <input
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              className="w-full text-[12px] text-white bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 outline-none focus:border-[#8AB4F8]/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-white/25 uppercase tracking-widest block mb-1">Constraseña DB (Auto-generada)</label>
            <div className="w-full text-[12px] text-white/50 bg-white/[0.02] border border-white/[0.04] rounded-xl px-3 py-2 font-mono">
              ••••••••••••••••
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={onCancel} className="flex-1 py-2 rounded-xl text-[11px] font-semibold text-white/40 hover:bg-white/[0.04] transition-colors">Cancelar</button>
            <button onClick={createProject} disabled={!selectedOrg || !projectName} className="flex-1 py-2 rounded-xl text-[11px] font-semibold text-[#8AB4F8] hover:text-white" style={{ background: 'rgba(138,180,248,0.15)' }}>Crear Base de Datos</button>
          </div>
        </div>
      )}

      {(step === 'creating' || step === 'polling' || step === 'keys') && (
        <div className="flex flex-col items-center justify-center py-6 animate-in fade-in duration-300">
          <Loader2 className="h-8 w-8 text-[#8AB4F8] mb-4 animate-spin" />
          <p className="text-[12px] font-semibold text-white/80">
            {step === 'creating' && 'Inicializando infraestructura...'}
            {step === 'polling' && 'Levantando la base de datos Postgres (puede tardar ~1-2 min)...'}
            {step === 'keys' && 'Extrayendo credenciales API...'}
          </p>
          <div className="mt-6 w-full max-w-[200px] h-1 bg-white/[0.05] rounded-full overflow-hidden">
            <div className="h-full bg-[#8AB4F8] animate-pulse rounded-full" style={{ width: step === 'creating' ? '25%' : step === 'polling' ? '65%' : '90%', transition: 'width 1s ease' }} />
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="flex flex-col items-center justify-center py-6 animate-in zoom-in-95">
          <div className="h-10 w-10 bg-emerald-400/20 text-emerald-400 rounded-full flex items-center justify-center mb-3 border border-emerald-400/30">
            <CheckCircle className="h-5 w-5" />
          </div>
          <h3 className="text-[14px] font-bold text-white/90">Proyecto Aprovisionado</h3>
          <p className="text-[11px] text-white/50 mt-1">Conectando las credenciales al cliente...</p>
        </div>
      )}

    </div>
  );
}
