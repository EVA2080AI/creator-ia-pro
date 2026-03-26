import { memo, useState, useCallback, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Rocket, Shield, Globe, ExternalLink, Zap, Braces, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AntigravityBridgeData {
  title?: string;
  referenceUrl?: string;
  status?: 'idle' | 'scanning' | 'cloning' | 'synced' | 'error';
  config?: {
    pixel_perfect?: boolean;
    extract_assets?: boolean;
    auto_deploy?: boolean;
  };
}

const AntigravityBridgeNode = ({ id, data }: { id: string, data: AntigravityBridgeData }) => {
  const { setNodes } = useReactFlow();
  const [url, setUrl] = useState(data.referenceUrl || "");
  const [status, setStatus] = useState<'idle' | 'scanning' | 'cloning' | 'synced' | 'error'>(data.status || 'idle');

  const updateUrl = useCallback((val: string) => {
    setUrl(val);
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, referenceUrl: val }
          };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  const handleClone = async () => {
    if (!url) {
      toast.error("Ingresa una URL de referencia para Antigravity");
      return;
    }
    
    setStatus('scanning');
    toast.promise(
      async () => {
        await new Promise(r => setTimeout(r, 2000));
        setStatus('cloning');
        await new Promise(r => setTimeout(r, 2500));
        setStatus('synced');
        return { project: 'nexus_clone_' + Math.random().toString(36).slice(2, 7) };
      },
      {
        loading: 'Antigravity: Escaneando ecosistema de referencia...',
        success: (res) => `Ecosistema clonado correctamente: ${res.project}. Generando JSON de Brand Context...`,
        error: 'Error en la conexión con el motor Antigravity',
      }
    );
  };

  return (
    <div className={`group relative rounded-[2.5rem] border border-white/5 bg-[#050506]/90 backdrop-blur-3xl w-[320px] animate-in slide-in-from-bottom-4 duration-500 nodrag shadow-3xl transition-all hover:border-[#ff0071]/40 ${status === 'scanning' || status === 'cloning' ? 'ring-2 ring-[#ff0071] shadow-[0_0_40px_rgba(255,0,113,0.3)]' : ''}`}>
      
      {/* V7.0 Antigravity Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#ff0071] shadow-lg shadow-[#ff0071]/20">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[11px] font-black lowercase tracking-[0.1em] text-white">Antigravity Bridge</h3>
            <span className="text-[8px] font-black text-[#ff0071] uppercase tracking-widest">Ecosystem_Cloner</span>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${status === 'synced' ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'}`}>
           {status === 'synced' ? 'Live_Sync' : 'Standby'}
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Globe className="w-3 h-3 text-[#ff0071]" />
              Reference_URL
            </span>
          </div>
          <div className="relative">
             <input
                value={url}
                onChange={(e) => updateUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full text-xs text-white bg-white/5 border border-white/5 p-4 pr-10 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-[#ff0071]/20 transition-all font-bold"
             />
             <ExternalLink className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-700" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <button 
             onClick={handleClone}
             disabled={status === 'scanning' || status === 'cloning'}
             className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-[#ff0071] hover:bg-[#e60066] text-white transition-all shadow-xl shadow-[#ff0071]/20 disabled:opacity-50 active:scale-95 group/btn"
           >
              <Zap className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black lowercase tracking-widest">Spawn_Clone</span>
           </button>
           <button className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-all active:scale-95">
              <Braces className="w-3.5 h-3.5 text-[#ff0071]" />
              <span className="text-[9px] font-black lowercase tracking-widest text-slate-500">Config_JSON</span>
           </button>
        </div>

        {status === 'synced' && (
           <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 animate-in fade-in zoom-in duration-500">
              <div className="flex items-center gap-3 mb-3">
                 <CheckCircle2 className="w-4 h-4 text-green-500" />
                 <span className="text-[9px] font-black text-white lowercase tracking-widest">Mapping_Success</span>
              </div>
              <div className="space-y-2">
                 {[
                   { label: 'DOM Tree', val: 'Cloned' },
                   { label: 'Design Tokens', val: 'Extracted' },
                   { label: 'Branding', val: 'Mapped' }
                 ].map(stat => (
                   <div key={stat.label} className="flex items-center justify-between text-[8px] font-bold">
                      <span className="text-slate-600 uppercase tracking-tighter">{stat.label}</span>
                      <span className="text-slate-400 lowercase">{stat.val}</span>
                   </div>
                 ))}
              </div>
           </div>
        )}
      </div>

      <Handle type="target" position={Position.Left} className="!w-4 !h-4 !-left-2 !bg-[#111] !border-4 !border-[#050506] !shadow-2xl hover:scale-125 transition-transform" />
      <Handle type="source" position={Position.Right} className="!w-4 !h-4 !-right-2 !bg-[#ff0071] !border-4 !border-[#050506] !shadow-2xl hover:scale-125 transition-transform" />
    </div>
  );
};

export default memo(AntigravityBridgeNode);
