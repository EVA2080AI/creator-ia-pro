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

  const togglePlatform = async (p: string) => {
    const current = platforms[p];
    const next = current === 'pending' ? 'ready' : 'pending';
    const updatedPlatforms = { ...platforms, [p]: next };
    
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, platforms: updatedPlatforms }
          };
        }
        return node;
      })
    );

    // Sync to DB
    await supabase
      .from('canvas_nodes')
      .update({ data_payload: { ...data, platforms: updatedPlatforms } as any })
      .eq('id', id);
  };

  const deleteNode = async () => {
    const { error } = await supabase.from('canvas_nodes').delete().eq('id', id);
    if (!error) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      toast.success("Gestor de campaña eliminado");
    }
  };

  return (
    <div className="group relative pulse-node w-[280px] animate-in zoom-in duration-200 nodrag shadow-xl">
      {/* V6.2 Pulse Header */}
      <div className="pulse-node-header justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
            <Megaphone className="w-4 h-4 text-[#ff0071] shrink-0" />
            <h3 className="text-[11px] font-bold lowercase tracking-tight text-slate-800 truncate">
               {data.title || "campaign manager"}
            </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-slate-100 text-slate-400 rounded-md transition-all">
             {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={deleteNode} className="p-1 hover:bg-destructive/5 text-destructive/30 hover:text-destructive rounded-md transition-all">
             <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200 bg-white">
          <div className="flex items-center justify-between px-0.5">
             <span className="text-[10px] font-bold text-slate-400 lowercase tracking-tight">campaign engine</span>
             <button 
               onClick={() => (data as any).onExecute?.()}
               disabled={data.status === 'processing'}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff0071] hover:bg-[#e60066] text-white transition-all shadow-md shadow-[#ff0071]/10 disabled:opacity-50 active:scale-95 group/exec"
             >
               <Zap className={`w-3 h-3 ${data.status === 'processing' ? 'animate-pulse' : 'group-hover/exec:scale-110 transition-transform'}`} />
               <span className="text-[10px] font-bold lowercase tracking-tight leading-none">deploy</span>
             </button>
          </div>

          <div className="space-y-4">
             <div className="space-y-2">
                <div className="flex justify-between px-1">
                   <span className="text-[9px] font-bold text-slate-400 lowercase tracking-tight">delivery performance</span>
                   <span className="text-[9px] font-bold text-[#ff0071]">84%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                   <div 
                      className={`h-full bg-[#ff0071] transition-all duration-1000 ${data.status === 'processing' ? 'animate-[shimmer_2s_infinite] w-full' : 'w-[84%]'}`}
                   />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'reach', val: '12.4k', icon: Users },
                  { label: 'clicks', val: '842', icon: MousePointer2 }
                ].map((stat) => (
                   <div key={stat.label} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1 hover:border-[#ff0071]/10 transition-all">
                      <div className="flex items-center gap-2">
                         <stat.icon className="w-3 h-3 text-slate-300" />
                         <span className="text-[9px] font-bold text-slate-400 lowercase tracking-tight">{stat.label}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700">{stat.val}</span>
                   </div>
                ))}
             </div>
          </div>

          <div className="bg-[#ff0071]/[0.02] p-3 rounded-2xl border border-[#ff0071]/5 transition-all">
             <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-[#ff0071]/60 lowercase tracking-tight flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-[#ff0071] animate-pulse" />
                   nexus distribution
                </p>
                <span className="text-[8px] font-mono tracking-tighter uppercase font-bold text-[#ff0071]/40">active</span>
             </div>
          </div>
        </div>
      )}

      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !-left-1.5 !bg-slate-300 !border-2 !border-white !shadow-sm !z-20" />
    </div>
  );
};

export default memo(CampaignManagerNode);
