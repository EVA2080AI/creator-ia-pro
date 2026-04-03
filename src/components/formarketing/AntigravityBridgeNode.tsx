import { memo, useState, useCallback, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Rocket, Shield, Globe, ExternalLink, Zap, Braces, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NodeConnectionDropdown } from './NodeConnectionDropdown';

interface AntigravityBridgeData {
  title?: string;
  referenceUrl?: string;
  status?: 'idle' | 'scanning' | 'cloning' | 'synced' | 'error';
  config?: {
    pixel_perfect?: boolean;
    extract_assets?: boolean;
    auto_deploy?: boolean;
  };
  onAddConnected?: (sourceId: string, targetType: string) => void;
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
    <div className={`group relative rounded-2xl border bg-white backdrop-blur-xl w-[270px] shadow-sm transition-all duration-300 hover:border-zinc-300 hover:shadow-md
      ${status === 'scanning' || status === 'cloning' ? 'border-primary ring-2 ring-primary/20 animate-pulse' : 'border-zinc-200'}
    `}>
      
      {/* Nexus V3 Industrial Header */}
      <div className="flex h-10 items-center justify-between px-3 border-b border-zinc-100 bg-zinc-50/50 rounded-t-2xl">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1 rounded-lg bg-zinc-100 border border-zinc-200">
            <Zap className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <h3 className="text-[10px] font-bold text-zinc-900 tracking-tight truncate uppercase">{data.title || "BRIDGE_ENGINE_V3"}</h3>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter ${status === 'synced' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-400'}`}>
           {status === 'synced' ? 'LIVE' : 'IDLE'}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Globe className="w-3 h-3" />
              REFER_LINK
            </span>
          </div>
          <div className="relative">
             <input
                value={url}
                onChange={(e) => updateUrl(e.target.value)}
                placeholder="https://..."
                className="w-full text-[10px] text-zinc-900 bg-white border border-zinc-200 shadow-sm p-2.5 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-zinc-400"
             />
             <ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
           <button 
             onClick={handleClone}
             disabled={status === 'scanning' || status === 'cloning'}
             className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white transition-all shadow-sm disabled:opacity-50 active:scale-95 group/btn"
           >
              <Zap className={`w-3 h-3 ${status === 'scanning' || status === 'cloning' ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
              <span className="text-[8px] font-bold lowercase tracking-widest">Spawn</span>
           </button>
           <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-zinc-50 text-zinc-500 border border-zinc-200 transition-all active:scale-95 shadow-sm">
              <Braces className="w-3 h-3 text-zinc-400" />
              <span className="text-[8px] font-bold lowercase tracking-widest">JSON</span>
           </button>
        </div>

        {status === 'synced' && (
           <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 animate-in fade-in zoom-in duration-500">
              <div className="flex items-center gap-2 mb-2">
                 <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                 <span className="text-[8px] font-black text-emerald-700 lowercase tracking-widest uppercase">mapped_3.0</span>
              </div>
              <div className="space-y-1.5">
                 {[
                   { label: 'DOM', val: 'OK' },
                   { label: 'TOKENS', val: 'OK' },
                   { label: 'BRND', val: 'OK' }
                 ].map(stat => (
                   <div key={stat.label} className="flex items-center justify-between text-[7px] font-bold">
                      <span className="text-emerald-500 uppercase tracking-tighter">{stat.label}</span>
                      <span className="text-emerald-600 lowercase">{stat.val}</span>
                   </div>
                 ))}
              </div>
           </div>
        )}
      </div>

      <NodeConnectionDropdown
        nodeType="antigravityBridge"
        nodeId={id}
        onAddConnected={data.onAddConnected ?? (() => {})}
      />

      <Handle type="target" position={Position.Left} id="any-in" className="!w-2 !h-2 !-left-1 !bg-zinc-400 !border-2 !border-white shadow-sm" />
      <Handle type="source" position={Position.Right} id="any-out" className="!w-2 !h-2 !-right-1 !bg-zinc-400 !border-2 !border-white shadow-sm" />
    </div>
  );
};

export default memo(AntigravityBridgeNode);
