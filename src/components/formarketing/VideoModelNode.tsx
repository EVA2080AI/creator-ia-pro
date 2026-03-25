import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Video } from 'lucide-react';

interface VideoNodeData {
  title?: string;
  status?: 'pending' | 'rendering' | 'complete';
  duration?: string;
}

const VideoModelNode = ({ data }: { data: VideoNodeData }) => {
  return (
    <div className="bg-card/90 border border-warning/30 rounded-xl p-5 w-72 shadow-2xl backdrop-blur-xl">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-warning border-none" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-warning/20 p-2 rounded-lg">
           <Video className="w-5 h-5 text-warning" />
        </div>
        <h3 className="text-foreground font-bold tracking-tight">{data.title || "Video Render"}</h3>
      </div>
      
      <div className="space-y-3 text-muted-foreground text-sm">
         <div className="rounded-lg border border-warning/20 bg-warning/5 aspect-video flex flex-col items-center justify-center gap-2">
            <Video className={`w-8 h-8 text-warning/50 ${data.status === 'rendering' ? 'animate-pulse' : ''}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-warning/70">
               {data.status === 'rendering' ? 'Renderizando...' : data.status === 'complete' ? 'Completado' : 'Pendiente'}
            </span>
         </div>
        
        {data.duration && (
           <div className="flex justify-between items-center text-xs font-mono bg-black/20 px-3 py-2 rounded-lg border border-white/5">
              <span>Duración:</span>
              <span className="text-warning">{data.duration}</span>
           </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} id="a" className="w-3 h-3 bg-warning border-none" />
    </div>
  );
};

export default memo(VideoModelNode);
