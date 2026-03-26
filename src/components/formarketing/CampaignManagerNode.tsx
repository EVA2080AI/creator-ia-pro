import { memo, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Share2, Trash2, Instagram, Facebook, Twitter, CheckCircle2, Clock, ChevronDown, ChevronUp, Users, MousePointer2, Zap, Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CampaignNodeData {
  title?: string;
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
    <div className="group relative rounded-[2.5rem] border border-white/10 bg-black/50 backdrop-blur-3xl w-[300px] animate-in zoom-in duration-300 nodrag shadow-2xl transition-all hover:border-[#ff0071]/50">
      {/* V7.0 Industrial Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 rounded-lg bg-[#ff0071]/10">
              <Megaphone className="w-3.5 h-3.5 text-[#ff0071] shrink-0" />
            </div>
            <h3 className="text-[10px] font-black lowercase tracking-widest text-white truncate">
               {data.title || "nexus_campaign_v7"}
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
               className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#ff0071] hover:bg-[#e60066] text-white transition-all shadow-xl shadow-[#ff0071]/20 disabled:opacity-50 active:scale-95 group/exec"
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
                     <span className="text-[9px] font-black text-[#ff0071]">84%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                     <div 
                        className={`h-full bg-[#ff0071] transition-all duration-1000 shadow-[0_0_10px_#ff0071] ${data.status === 'processing' ? 'animate-[shimmer_2s_infinite] w-full' : 'w-[84%]'}`}
                     />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'reach', val: '12.4k', icon: Users },
                    { label: 'clicks', val: '842', icon: MousePointer2 }
                  ].map((stat) => (
                     <div key={stat.label} className="p-4 bg-white/[0.02] rounded-3xl border border-white/5 flex flex-col gap-1.5 hover:border-[#ff0071]/20 transition-all shadow-2xl">
                        <div className="flex items-center gap-2">
                           <stat.icon className="w-3.5 h-3.5 text-slate-700" />
                           <span className="text-[9px] font-black text-slate-500 lowercase tracking-widest">{stat.label}</span>
                        </div>
                        <span className="text-[11px] font-black text-white">{stat.val}</span>
                     </div>
                  ))}
               </div>
            </div>

            <div className="bg-[#ff0071]/5 p-4 rounded-3xl border border-[#ff0071]/10 transition-all shadow-2xl shadow-[#ff0071]/5">
               <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-[#ff0071] lowercase tracking-[0.2em] flex items-center gap-3">
                     <span className="w-2 h-2 rounded-full bg-[#ff0071] shadow-[0_0_10px_#ff0071]" />
                     nexus_network
                  </p>
                  <span className="text-[9px] font-black tracking-widest uppercase text-[#ff0071]/40">LIVE</span>
               </div>
            </div>
          </div>
        </div>
      )}

      <Handle type="target" position={Position.Left} className="!w-4 !h-4 !-left-2 !bg-slate-800 !border-4 !border-[#0a0a0b] !shadow-2xl !z-20 hover:scale-125 transition-transform" />
      <Handle type="source" position={Position.Right} className="!w-4 !h-4 !-right-2 !bg-[#ff0071] !border-4 !border-[#0a0a0b] !shadow-2xl !z-20 hover:scale-125 transition-transform" />
    </div>
  );
};

export default memo(CampaignManagerNode);
