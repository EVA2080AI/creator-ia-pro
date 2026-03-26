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
    <div className={`group relative rounded-[2.5rem] border border-white/5 bg-[#0a0a0b]/80 backdrop-blur-3xl w-[300px] animate-in zoom-in duration-300 nodrag shadow-3xl transition-all hover:border-[#ff0071]/30 ${data.status === 'rendering' || data.status === 'executing' ? 'ring-2 ring-[#ff0071] shadow-[0_0_30px_rgba(255,0,113,0.2)] animate-pulse' : ''}`}>
      {/* V7.0 Industrial Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 rounded-lg bg-[#ff0071]/10">
              <Video className={`w-3.5 h-3.5 text-[#ff0071] shrink-0 ${data.status === 'rendering' ? 'animate-pulse' : ''}`} />
            </div>
            <h3 className="text-[10px] font-black lowercase tracking-widest text-white truncate">
               {data.title || "nexus_video_v7"}
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
                disabled={data.status === 'rendering'}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#ff0071] hover:bg-[#e60066] text-white transition-all shadow-xl shadow-[#ff0071]/20 disabled:opacity-50 active:scale-95 group/exec"
             >
                <Zap className={`w-3.5 h-3.5 ${data.status === 'rendering' ? 'animate-pulse' : 'group-hover/exec:scale-110 transition-transform font-black'}`} />
                <span className="text-[9px] font-black lowercase tracking-widest leading-none">render</span>
             </button>
          </div>

          {data.status === 'rendering' ? (
            <div className="space-y-4">
               <div className="h-32 w-full bg-white/[0.02] rounded-3xl animate-pulse border border-white/5 flex flex-col items-center justify-center gap-4 shadow-inner">
                  <Video className="w-10 h-10 text-[#ff0071]/20 animate-pulse" />
                  <div className="w-2/3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-[#ff0071] animate-[shimmer_2s_infinite] w-full shadow-[0_0_8px_#ff0071]" />
                  </div>
               </div>
            </div>
          ) : data.assetUrl ? (
             <div className="space-y-5">
                <div className="rounded-[1.5rem] overflow-hidden border border-white/5 aspect-video relative shadow-2xl group/vid">
                   <div className="absolute inset-0 bg-[#0a0a0b]/20 flex items-center justify-center group-hover/vid:bg-[#0a0a0b]/40 transition-all">
                      <div className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center border border-white/10 group-hover/vid:scale-110 transition-all shadow-2xl">
                         <div className="p-3.5 rounded-full bg-[#ff0071] shadow-[0_0_20px_#ff0071]">
                            <Video className="w-6 h-6 text-white ml-0.5" />
                         </div>
                      </div>
                   </div>
                   <div className="w-full h-full bg-white/[0.02]" />
                </div>
                <div className="flex justify-between items-center text-[10px] font-black lowercase tracking-widest bg-white/[0.02] px-4 py-3 rounded-2xl border border-white/5">
                   <span className="text-slate-600">duración:</span>
                   <span className="text-[#ff0071] font-mono">{data.duration || "00:00"}</span>
                </div>
             </div>
          ) : (
             <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.01] aspect-video flex flex-col items-center justify-center text-center p-6 gap-3 group-hover:bg-white/[0.03] transition-all">
                <div className="p-4 rounded-full bg-white/5 shadow-inner text-slate-700">
                  <Video className="w-6 h-6" />
                </div>
                <span className="text-[9px] font-black lowercase tracking-[0.2em] text-slate-700 font-mono">waiting_sequence</span>
             </div>
          )}
        </div>
      )}

      <Handle type="target" position={Position.Left} className="!w-4 !h-4 !-left-2 !bg-slate-800 !border-4 !border-[#0a0a0b] !shadow-2xl !z-20 hover:scale-125 transition-transform" />
      <Handle type="source" position={Position.Right} className="!w-4 !h-4 !-right-2 !bg-[#ff0071] !border-4 !border-[#0a0a0b] !shadow-2xl !z-20 hover:scale-125 transition-transform" />
    </div>
  );
};

export default memo(VideoModelNode);
