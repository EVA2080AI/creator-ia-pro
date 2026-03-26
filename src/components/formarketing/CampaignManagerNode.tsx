import { memo, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Share2, Trash2, Instagram, Facebook, Twitter, CheckCircle2, Clock, ChevronDown, ChevronUp, Users, MousePointer2, Zap, Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CampaignNodeData {
  title?: string;
  model?: string;
  status?: 'pending' | 'processing' | 'ready' | 'error';
  platforms?: Record<string, 'pending' | 'ready' | 'error'>;
}

const CampaignManagerNode = ({ id, data }: { id: string, data: CampaignNodeData }) => {
  const { setNodes } = useReactFlow();
  const [isExpanded, setIsExpanded] = useState(true);
  const platforms = data.platforms || {
    instagram: 'pending',
    facebook: 'pending',
    twitter: 'pending'
  };

  const deleteNode = async () => {
    const { error } = await supabase.from('canvas_nodes').delete().eq('id', id);
    if (!error) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      toast.success("Gestor de campaña eliminado");
    }
  };

  return (
    <div className="group relative rounded-[1.5rem] border border-white/8 bg-[#0f0f12]/90 backdrop-blur-xl w-[300px] shadow-2xl transition-all hover:border-[#bd00ff]/30">
      {/* Nebula V8.0 Minimalist Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 rounded-lg bg-[#bd00ff]/10 border border-[#bd00ff]/15">
              <Megaphone className="w-3.5 h-3.5 text-[#bd00ff] shrink-0" />
            </div>
            <h3 className="text-[10px] font-black lowercase tracking-widest text-white truncate">
               {data.title || "nexus_campaign_v8"}
            </h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-white/5 text-slate-500 rounded-xl transition-all">
             {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={deleteNode} className="p-1.5 hover:bg-destructive/10 text-slate-600 hover:text-destructive rounded-xl transition-all">
             <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-5 animate-in fade-in duration-500 bg-[#0a0a0b]/40 backdrop-blur-xl">
          <div className="flex items-center justify-between">
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">nexus_engine</span>
              <button 
                onClick={() => (data as any).onExecute?.()}
                disabled={data.status === 'processing'}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#bd00ff] to-[#ff0071] hover:opacity-90 text-white transition-all shadow-xl shadow-[#bd00ff]/20 disabled:opacity-50 active:scale-95"
              >
                <Zap className={`w-3.5 h-3.5 ${data.status === 'processing' ? 'animate-pulse' : 'group-hover/exec:scale-110 transition-transform font-black'}`} />
                <span className="text-[9px] font-black lowercase tracking-widest leading-none">deploy</span>
              </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
               <div className="space-y-2">
                   <div className="flex justify-between px-1">
                      <span className="text-[9px] font-black text-slate-600 lowercase tracking-widest">nexus_performance</span>
                      <span className="text-[9px] font-black text-[#bd00ff]">84%</span>
                   </div>
                   <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                      <div className={`h-full bg-gradient-to-r from-[#bd00ff] to-[#ff0071] transition-all duration-1000 ${data.status === 'processing' ? 'animate-shimmer w-full' : 'w-[84%]'}`} />
                   </div>
               </div>

                <div className="grid grid-cols-2 gap-3">
                   {[
                     { label: 'reach', val: '12.4k', icon: Users },
                     { label: 'clicks', val: '842', icon: MousePointer2 }
                   ].map((stat) => (
                      <div key={stat.label} className="p-4 bg-white/[0.02] rounded-[1.5rem] border border-white/5 flex flex-col gap-1.5 hover:border-[#bd00ff]/20 transition-all shadow-2xl">
                         <div className="flex items-center gap-2">
                            <stat.icon className="w-3.5 h-3.5 text-slate-700" />
                            <span className="text-[9px] font-black text-slate-500 lowercase tracking-widest">{stat.label}</span>
                         </div>
                         <span className="text-[11px] font-black text-white">{stat.val}</span>
                      </div>
                   ))}
                </div>
            </div>

            {/* Industrial Fallback Selector */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] px-1">Campaign Strategy Engine</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'deepseek-chat', name: 'strategy_v3' },
                  { id: 'gemini-3.1-pro-low', name: 'gemini_pro_v8' },
                  { id: 'claude-3.5-sonnet', name: 'claude_lead' },
                  { id: 'gpt-oss-120b', name: 'llama_oss' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={async () => {
                      setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, model: m.id } } : n));
                      await supabase.from('canvas_nodes').update({ data_payload: { ...data, model: m.id } as any }).eq('id', id);
                    }}
                    className={`px-3 py-2 rounded-xl border text-[9px] font-bold lowercase tracking-wider transition-all ${
                      (data.model || 'deepseek-chat') === m.id 
                      ? 'bg-[#bd00ff]/10 border-[#bd00ff]/30 text-[#bd00ff]' 
                      : 'bg-white/5 border-white/5 text-white/20 hover:bg-white/10'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    <Handle type="target" position={Position.Left} className="!w-3 !h-3 !-left-1.5 !bg-[#bd00ff] !border-2 !border-[#050506]" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !-right-1.5 !bg-[#ff0071] !border-2 !border-[#050506]" />
    </div>
  );
};

export default memo(CampaignManagerNode);
