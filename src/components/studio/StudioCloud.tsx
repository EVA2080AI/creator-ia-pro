import { useState, useEffect, useCallback } from 'react';
import {
  Cloud, Database, Users, HardDrive, Zap, Activity,
  CheckCircle, AlertCircle, Loader2, ExternalLink,
  Table, RefreshCw, ChevronRight,
} from 'lucide-react';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

interface StudioCloudProps {
  projectId: string | null;
  config: SupabaseConfig | null;
  onConfigChange: (config: SupabaseConfig | null) => void;
}

type CloudSection = 'overview' | 'database' | 'users' | 'storage' | 'functions';

const NAV: { id: CloudSection; label: string; icon: React.ElementType }[] = [
  { id: 'overview',   label: 'Overview',       icon: Activity  },
  { id: 'database',   label: 'Database',        icon: Database  },
  { id: 'users',      label: 'Users',           icon: Users     },
  { id: 'storage',    label: 'Storage',         icon: HardDrive },
  { id: 'functions',  label: 'Edge Functions',  icon: Zap       },
];

export function StudioCloud({ projectId, config, onConfigChange }: StudioCloudProps) {
  const [urlInput,  setUrlInput]  = useState(config?.url ?? '');
  const [keyInput,  setKeyInput]  = useState(config?.anonKey ?? '');
  const [status,    setStatus]    = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [section,   setSection]   = useState<CloudSection>('overview');
  const [tables,    setTables]    = useState<string[]>([]);
  const [errorMsg,  setErrorMsg]  = useState('');

  const testConnection = useCallback(async (url: string, anonKey: string) => {
    setStatus('testing');
    setErrorMsg('');
    try {
      const res = await fetch(`${url}/rest/v1/`, {
        headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const spec = await res.json() as { paths?: Record<string, unknown> };
      const paths = Object.keys(spec?.paths ?? {});
      const tableNames = paths
        .filter(p => p !== '/' && !p.includes('{') && p.startsWith('/'))
        .map(p => p.slice(1))
        .filter(Boolean);
      setTables(tableNames);
      setStatus('connected');
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e?.message || 'No se pudo conectar');
    }
  }, []);

  // Auto-test when config arrives (e.g., switching projects)
  useEffect(() => {
    if (config?.url && config?.anonKey) {
      setUrlInput(config.url);
      setKeyInput(config.anonKey);
      testConnection(config.url, config.anonKey);
    } else {
      setStatus('idle');
      setTables([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.url, config?.anonKey]);

  const handleConnect = () => {
    const url = urlInput.trim().replace(/\/$/, '');
    const anonKey = keyInput.trim();
    if (!url || !anonKey) return;
    onConfigChange({ url, anonKey });
    testConnection(url, anonKey);
  };

  const handleDisconnect = () => {
    onConfigChange(null);
    setStatus('idle');
    setTables([]);
    setUrlInput('');
    setKeyInput('');
  };

  const projectRef = config?.url.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] ?? null;
  const dashboardBase = projectRef ? `https://supabase.com/dashboard/project/${projectRef}` : null;

  const isConnected = status === 'connected';

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Left nav (mini sidebar) ─────────────────────────────────────── */}
      <div className="w-44 shrink-0 flex flex-col" style={{ background: '#0c0d12', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-3 border-b border-white/[0.05]">
          <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.25)' }}>
            <Cloud className="h-3 w-3 text-emerald-400" />
          </div>
          <span className="text-[12px] font-bold text-white/70">Cloud</span>

          {/* Connection dot */}
          <div className="ml-auto h-1.5 w-1.5 rounded-full shrink-0" style={{
            background: status === 'connected' ? '#34d399' : status === 'testing' ? '#f59e0b' : status === 'error' ? '#f87171' : 'rgba(255,255,255,0.15)',
            boxShadow: status === 'connected' ? '0 0 6px #34d399' : 'none',
          }} />
        </div>

        {/* Nav items */}
        <div className="flex flex-col px-1.5 py-2 gap-0.5">
          {NAV.map(item => (
            <button key={item.id}
              onClick={() => setSection(item.id)}
              disabled={!isConnected && item.id !== 'overview'}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all disabled:opacity-25 text-left"
              style={section === item.id
                ? { background: 'rgba(255,255,255,0.07)', color: 'white' }
                : { color: 'rgba(255,255,255,0.38)' }}>
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Dashboard link */}
        {isConnected && dashboardBase && (
          <div className="mt-auto p-2 border-t border-white/[0.05]">
            <a href={dashboardBase} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] text-white/25 hover:text-white transition-colors">
              <ExternalLink className="h-3 w-3" />
              Abrir dashboard
            </a>
          </div>
        )}
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ background: '#10111a' }}>

        {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
        {section === 'overview' && (
          <div className="p-4 space-y-4">
            {!isConnected ? (
              /* Connection form */
              <>
                <div>
                  <h2 className="text-[13px] font-bold text-white/80 mb-0.5">Conectar Supabase</h2>
                  <p className="text-[11px] text-white/30 leading-relaxed">
                    El código generado incluirá automáticamente el cliente de Supabase con tu configuración
                  </p>
                </div>

                {status === 'error' && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-xl text-[11px]"
                    style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                    <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-red-400">{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-white/25 uppercase tracking-widest block mb-1">Project URL</label>
                    <input
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      placeholder="https://xxxx.supabase.co"
                      className="w-full text-[12px] text-white placeholder:text-white/15 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 outline-none focus:border-white/20 transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/25 uppercase tracking-widest block mb-1">Anon Key</label>
                    <input
                      value={keyInput}
                      onChange={e => setKeyInput(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIs…"
                      type="password"
                      className="w-full text-[12px] text-white placeholder:text-white/15 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 outline-none focus:border-white/20 transition-colors font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={handleConnect}
                  disabled={!urlInput || !keyInput || status === 'testing'}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold text-emerald-300 transition-all disabled:opacity-40 active:scale-[0.98]"
                  style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)' }}>
                  {status === 'testing'
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Conectando…</>
                    : <><Cloud className="h-3.5 w-3.5" />Conectar proyecto</>}
                </button>

                <p className="text-[10px] text-white/15 text-center leading-relaxed">
                  Encuéntralos en tu proyecto Supabase → Settings → API
                </p>
              </>
            ) : (
              /* Connected overview */
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-[13px] font-semibold text-white/80">Conectado</span>
                  </div>
                  <button onClick={handleDisconnect}
                    className="text-[10px] text-white/20 hover:text-red-400 transition-colors">
                    Desconectar
                  </button>
                </div>

                {projectRef && (
                  <div className="px-3 py-2 rounded-xl flex items-center gap-2" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
                    <span className="text-[10px] text-white/20 font-mono">ref:</span>
                    <span className="text-[11px] text-emerald-400 font-mono">{projectRef}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Tablas API',   value: tables.length, icon: Database, color: '#8AB4F8' },
                    { label: 'Edge Fns',     value: '—',           icon: Zap,      color: '#f472b6' },
                  ].map(stat => (
                    <div key={stat.label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <stat.icon className="h-3.5 w-3.5 mb-1.5" style={{ color: stat.color }} />
                      <div className="text-[18px] font-black text-white leading-none">{stat.value}</div>
                      <div className="text-[9px] text-white/25 uppercase tracking-widest mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="px-3 py-2.5 rounded-xl text-[11px] leading-relaxed text-white/35" style={{ background: 'rgba(138,180,248,0.06)', border: '1px solid rgba(138,180,248,0.12)' }}>
                  ✓ Genesis incluirá el cliente de Supabase automáticamente en el código generado para este proyecto
                </div>

                <button
                  onClick={() => testConnection(config!.url, config!.anonKey)}
                  className="flex items-center gap-1.5 text-[10px] text-white/20 hover:text-white transition-colors mx-auto">
                  <RefreshCw className="h-3 w-3" />
                  Actualizar
                </button>
              </>
            )}
          </div>
        )}

        {/* ── DATABASE ─────────────────────────────────────────────────── */}
        {section === 'database' && isConnected && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.25em]">Tablas</h3>
              <span className="text-[10px] text-white/20">{tables.length} expuestas en API</span>
            </div>

            {tables.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Database className="h-8 w-8 text-white/10" />
                <p className="text-[11px] text-white/20 max-w-[160px] leading-relaxed">
                  Sin tablas con políticas RLS activas. Actívalas en tu Supabase.
                </p>
                {dashboardBase && (
                  <a href={`${dashboardBase}/database/tables`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[11px] text-[#8AB4F8] hover:underline">
                    <ExternalLink className="h-3 w-3" />
                    Abrir Tables
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {tables.map(t => (
                  <div key={t}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-default transition-all hover:bg-white/[0.03]"
                    style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Table className="h-3.5 w-3.5 text-[#8AB4F8]/50 shrink-0" />
                    <span className="text-[12px] text-white/70 font-mono">{t}</span>
                    <ChevronRight className="h-3 w-3 text-white/15 ml-auto" />
                  </div>
                ))}
              </div>
            )}

            {dashboardBase && (
              <a href={`${dashboardBase}/editor`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-[11px] text-white/30 hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <ExternalLink className="h-3 w-3" />
                Abrir SQL Editor
              </a>
            )}
          </div>
        )}

        {/* ── USERS ─────────────────────────────────────────────────────── */}
        {section === 'users' && isConnected && (
          <div className="p-4 space-y-3">
            <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.25em]">Auth · Users</h3>
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(138,180,248,0.08)', border: '1px solid rgba(138,180,248,0.15)' }}>
                <Users className="h-5 w-5 text-[#8AB4F8]/50" />
              </div>
              <p className="text-[11px] text-white/25 max-w-[160px] leading-relaxed">
                Gestiona los usuarios de tu app desde el dashboard de Supabase
              </p>
              {dashboardBase && (
                <a href={`${dashboardBase}/auth/users`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] text-white/60 hover:text-white transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <ExternalLink className="h-3 w-3" />
                  Ver Users en Supabase
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── STORAGE ───────────────────────────────────────────────────── */}
        {section === 'storage' && isConnected && (
          <div className="p-4 space-y-3">
            <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.25em]">Storage</h3>
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}>
                <HardDrive className="h-5 w-5 text-purple-400/50" />
              </div>
              <p className="text-[11px] text-white/25 max-w-[160px] leading-relaxed">
                Buckets y archivos de tu proyecto
              </p>
              {dashboardBase && (
                <a href={`${dashboardBase}/storage/buckets`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] text-white/60 hover:text-white transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <ExternalLink className="h-3 w-3" />
                  Ver Storage
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── EDGE FUNCTIONS ─────────────────────────────────────────────── */}
        {section === 'functions' && isConnected && (
          <div className="p-4 space-y-3">
            <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.25em]">Edge Functions</h3>
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.15)' }}>
                <Zap className="h-5 w-5 text-pink-400/50" />
              </div>
              <p className="text-[11px] text-white/25 max-w-[160px] leading-relaxed">
                Despliega funciones serverless desde el dashboard
              </p>
              {dashboardBase && (
                <a href={`${dashboardBase}/functions`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] text-white/60 hover:text-white transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <ExternalLink className="h-3 w-3" />
                  Ver Functions
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
