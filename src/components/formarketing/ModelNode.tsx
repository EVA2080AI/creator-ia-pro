import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Image as ImageIcon } from 'lucide-react';

interface ModelNodeData {
  title?: string;
  prompt?: string;
  assetUrl?: string; // Standardized
  status?: 'idle' | 'loading' | 'ready' | 'error';
}

const ModelNode = ({ data }: { data: ModelNodeData }) => {
  return (
    <div className="group relative bg-card/40 border border-white/5 rounded-3xl p-0 w-72 shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in duration-300">
      <Handle type="target" position={Position.Left} className="w-4 h-4 -left-2 bg-primary border-4 border-background shadow-lg !z-20" />
      
      {/* V4.7 Industrial Header */}
      <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent flex items-center gap-3">
        <div className="bg-primary/20 p-2 rounded-xl shadow-inner">
           <ImageIcon className="w-4 h-4 text-primary animate-pulse" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-[11px] font-black uppercase tracking-tighter text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
            {data.title || "MODEL OUTPUT"}
          </h3>
          <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">V4.7 Industrial</span>
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        {data.status === 'loading' ? (
          <div className="space-y-3">
             <div className="h-32 w-full bg-white/5 rounded-2xl animate-pulse border border-white/5 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-white/10 animate-spin-slow" />
             </div>
             <div className="h-2 w-3/4 bg-white/5 rounded-full animate-pulse" />
             <div className="h-2 w-1/2 bg-white/5 rounded-full animate-pulse" />
          </div>
        ) : data.assetUrl ? (
           <div className="space-y-3">
              <div className="rounded-2xl overflow-hidden border border-white/10 aspect-video relative group/img shadow-2xl">
                 <img 
                   src={data.assetUrl} 
                   alt="Generated" 
                   className="w-full h-full object-cover transition-all duration-700 group-hover/img:scale-110" 
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-[9px] font-mono text-white/70 truncate">{data.assetUrl}</span>
                 </div>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl text-[11px] border border-white/5 leading-relaxed group-hover:bg-white/10 transition-colors">
                <span className="font-black text-primary/80 uppercase mr-1">PROMPT:</span>
                <span className="text-foreground/70 italic line-clamp-3">"{data.prompt || "No instructions provided"}"</span>
              </div>
           </div>
        ) : (
           <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] aspect-video flex flex-col items-center justify-center text-center p-4 gap-2 group-hover:bg-white/[0.04] transition-all">
              <div className="p-3 rounded-full bg-white/5">
                <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Esperando ejecución...</span>
           </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="w-4 h-4 -right-2 bg-primary border-4 border-background shadow-lg !z-20" />
    </div>
  );
};

export default memo(ModelNode);
