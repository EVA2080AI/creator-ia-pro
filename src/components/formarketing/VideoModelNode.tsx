import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Video } from 'lucide-react';

interface VideoNodeData {
  title?: string;
  status?: 'idle' | 'rendering' | 'ready' | 'error';
  duration?: string;
  assetUrl?: string; // Standardized
}

const VideoModelNode = ({ data }: { data: VideoNodeData }) => {
  return (
    <div className="group relative bg-card/40 border border-white/5 rounded-3xl p-0 w-72 shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in duration-300">
      <Handle type="target" position={Position.Left} className="w-4 h-4 -left-2 bg-amber-500 border-4 border-background shadow-lg !z-20" />
      
      {/* V4.7 Industrial Header */}
      <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-amber-500/10 to-transparent flex items-center gap-3">
        <div className="bg-amber-500/20 p-2 rounded-xl shadow-inner">
           <Video className={`w-4 h-4 text-amber-500 ${data.status === 'rendering' ? 'animate-bounce' : ''}`} />
        </div>
        <div className="flex flex-col">
          <h3 className="text-[11px] font-black uppercase tracking-tighter text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
            {data.title || "VIDEO OUTPUT"}
          </h3>
          <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">V4.7 Industrial</span>
        </div>
      </div>
      
      <div className="p-5 space-y-4">
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

      <Handle type="source" position={Position.Right} className="w-4 h-4 -right-2 bg-amber-500 border-4 border-background shadow-lg !z-20" />
    </div>
  );
};

export default memo(VideoModelNode);
