import { memo } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Video, Trash2, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoNodeData {
  title?: string;
  status?: 'idle' | 'rendering' | 'ready' | 'error';
  duration?: string;
  assetUrl?: string; // Standardized
}

const VideoModelNode = ({ id, data }: { id: string, data: VideoNodeData }) => {
  const { setNodes } = useReactFlow();

  const deleteNode = async () => {
    const { error } = await supabase.from('canvas_nodes').delete().eq('id', id);
    if (!error) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      toast.success("Video eliminado");
    }
  };

  return (
    <div className="group relative bg-[#0f0f0f]/95 border border-white/5 rounded-[1.5rem] p-0 w-[300px] shadow-2xl backdrop-blur-3xl overflow-hidden animate-in fade-in zoom-in duration-300 isolation-auto">
      {/* V5.3 Industrial Header */}
      <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-amber-500/10 to-transparent flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
            <div className="bg-amber-500/20 p-2 rounded-xl shadow-inner group-hover:rotate-6 transition-transform">
               <Video className={`w-4 h-4 text-amber-500 ${data.status === 'rendering' ? 'animate-bounce' : ''}`} />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[10px] font-black uppercase tracking-tighter text-foreground/90 whitespace-nowrap overflow-hidden text-ellipsis leading-none">
                {data.title || "VIDEO OUTPUT"}
              </h3>
              <span className="text-[8px] font-black text-amber-500/40 uppercase tracking-[0.2em] mt-1">V5.4 COMPACT ENGINE</span>
            </div>
        </div>
        <button onClick={deleteNode} className="opacity-0 group-hover:opacity-100 p-2.5 hover:bg-destructive/10 text-destructive rounded-xl transition-all">
           <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between px-1">
           <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest font-mono">Sequence Status</span>
           <button 
             onClick={() => (data as any).onExecute?.()}
             disabled={data.status === 'rendering'}
             className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-all border border-amber-500/20 disabled:opacity-50 group/exec"
           >
             <Zap className={`w-2.5 h-2.5 ${data.status === 'rendering' ? 'animate-pulse' : 'group-hover/exec:scale-125 transition-transform'}`} />
             <span className="text-[8px] font-black uppercase tracking-widest text-white">Ejecutar</span>
           </button>
        </div>

        {data.status === 'rendering' ? (
          <div className="space-y-3">
             <div className="h-32 w-full bg-white/5 rounded-2xl animate-pulse border border-white/5 flex flex-col items-center justify-center gap-3">
                <Video className="w-10 h-10 text-amber-500/30 animate-pulse" />
                <div className="w-1/2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-amber-500 animate-[shimmer_2s_infinite] w-full" />
                </div>
             </div>
             <span className="block text-[10px] text-center font-bold uppercase tracking-widest text-amber-500/50">Procesando Frames...</span>
          </div>
        ) : data.assetUrl ? (
           <div className="space-y-3">
              <div className="rounded-2xl overflow-hidden border border-white/10 aspect-video relative shadow-2xl group/vid">
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover/vid:bg-black/20 transition-all">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover/vid:scale-110 transition-transform">
                       <Video className="w-6 h-6 text-white ml-0.5" />
                    </div>
                 </div>
                 {/* Placeholder for real video tag */}
                 <div className="w-full h-full bg-amber-500/5" />
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                 <span className="text-muted-foreground/50">DURACIÓN:</span>
                 <span className="text-amber-500">{data.duration || "00:00"}</span>
              </div>
           </div>
        ) : (
           <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] aspect-video flex flex-col items-center justify-center text-center p-4 gap-2 group-hover:bg-white/[0.04] transition-all">
              <div className="p-3 rounded-full bg-white/5 text-amber-500/30">
                <Video className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 text-center">Video Pendiente de Secuencia</span>
           </div>
        )}
      </div>

      <Handle type="target" position={Position.Left} className="w-5 h-5 -left-2.5 bg-amber-500 border-[6px] border-[#0a0a0a] shadow-xl !z-20" />
      <Handle type="source" position={Position.Right} className="w-5 h-5 -right-2.5 bg-amber-500 border-[6px] border-[#0a0a0a] shadow-xl !z-20" />
    </div>
  );
};

export default memo(VideoModelNode);
