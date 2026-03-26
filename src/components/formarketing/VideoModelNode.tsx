import { memo, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Video, Trash2, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoNodeData {
  title?: string;
  status?: 'idle' | 'rendering' | 'executing' | 'ready' | 'error';
  duration?: string;
  assetUrl?: string;
}

const VideoModelNode = ({ id, data }: { id: string, data: VideoNodeData }) => {
  const { setNodes } = useReactFlow();
  const [isExpanded, setIsExpanded] = useState(true);

  const deleteNode = async () => {
    const { error } = await supabase.from('canvas_nodes').delete().eq('id', id);
    if (!error) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      toast.success("Video eliminado");
    }
  };

  return (
    <div className={`group relative pulse-node w-[280px] animate-in zoom-in duration-200 nodrag shadow-xl transition-all ${data.status === 'rendering' || data.status === 'executing' ? 'ring-2 ring-[#ff0071] shadow-[0_0_20px_rgba(255,0,113,0.15)] animate-pulse' : ''}`}>
      {/* V6.2 Pulse Header */}
      <div className="pulse-node-header justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
            <Video className={`w-4 h-4 text-[#ff0071] shrink-0 ${data.status === 'rendering' ? 'animate-pulse' : ''}`} />
            <h3 className="text-[11px] font-bold lowercase tracking-tight text-slate-800 truncate">
               {data.title || "video hub"}
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
             <span className="text-[10px] font-bold text-slate-400 lowercase tracking-tight">render engine</span>
             <button 
                onClick={() => (data as any).onExecute?.()}
                disabled={data.status === 'rendering'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff0071] hover:bg-[#e60066] text-white transition-all shadow-md shadow-[#ff0071]/10 disabled:opacity-50 active:scale-95 group/exec"
             >
                <Zap className={`w-3 h-3 ${data.status === 'rendering' ? 'animate-pulse' : 'group-hover/exec:scale-110 transition-transform'}`} />
                <span className="text-[10px] font-bold lowercase tracking-tight leading-none">render</span>
             </button>
          </div>

          {data.status === 'rendering' ? (
            <div className="space-y-4">
               <div className="h-28 w-full bg-slate-50 rounded-2xl animate-pulse border border-slate-100 flex flex-col items-center justify-center gap-3">
                  <Video className="w-8 h-8 text-[#ff0071]/30 animate-pulse" />
                  <div className="w-1/2 h-1 bg-slate-200 rounded-full overflow-hidden">
                     <div className="h-full bg-[#ff0071] animate-[shimmer_2s_infinite] w-full" />
                  </div>
               </div>
            </div>
          ) : data.assetUrl ? (
             <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden border border-slate-100 aspect-video relative shadow-lg group/vid">
                   <div className="absolute inset-0 bg-black/5 flex items-center justify-center group-hover/vid:bg-black/10 transition-all">
                      <div className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center border border-white/50 group-hover/vid:scale-105 transition-transform">
                         <Video className="w-5 h-5 text-white ml-0.5" />
                      </div>
                   </div>
                   <div className="w-full h-full bg-slate-50" />
                </div>
                <div className="flex justify-between items-center text-[9px] font-bold lowercase tracking-tight bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                   <span className="text-slate-400">duración:</span>
                   <span className="text-[#ff0071]/70 font-mono">{data.duration || "00:00"}</span>
                </div>
             </div>
          ) : (
             <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/[0.3] aspect-video flex flex-col items-center justify-center text-center p-4 gap-2 group-hover:bg-slate-50/[0.5] transition-all">
                <div className="p-3 rounded-full bg-white shadow-sm text-slate-300">
                  <Video className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold lowercase tracking-tight text-slate-300 font-mono">idle_state</span>
             </div>
          )}
        </div>
      )}

      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !-left-1.5 !bg-slate-300 !border-2 !border-white !shadow-sm !z-20" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !-right-1.5 !bg-slate-300 !border-2 !border-white !shadow-sm !z-20" />
    </div>

  );
};

export default memo(VideoModelNode);
