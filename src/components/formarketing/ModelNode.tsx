import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Image as ImageIcon } from 'lucide-react';

interface ModelNodeData {
  title?: string;
  prompt?: string;
  imageUrl?: string;
}

const ModelNode = ({ data }: { data: ModelNodeData }) => {
  return (
    <div className="bg-card/90 border border-white/10 rounded-xl p-5 w-72 shadow-2xl backdrop-blur-xl">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-accent border-none" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-accent/20 p-2 rounded-lg">
           <ImageIcon className="w-5 h-5 text-accent" />
        </div>
        <h3 className="text-foreground font-bold tracking-tight">{data.title || "Generación Visual"}</h3>
      </div>
      
      <div className="space-y-3 text-muted-foreground text-sm">
        {data.imageUrl ? (
           <div className="rounded-lg overflow-hidden border border-white/10 aspect-video relative group">
              <img src={data.imageUrl} alt="Generated" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
           </div>
        ) : (
           <div className="rounded-lg border border-dashed border-white/20 bg-white/5 aspect-video flex items-center justify-center text-xs opacity-50">
              Esperando prompt...
           </div>
        )}
        <div className="bg-black/20 p-3 rounded-lg text-xs mt-2 border border-white/5 line-clamp-3">
          <span className="font-bold text-foreground">Prompt: </span>
          <span className="opacity-80">{data.prompt || "Awaiting instructions from character breakdown..."}</span>
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="a" className="w-3 h-3 bg-accent border-none" />
    </div>
  );
};

export default memo(ModelNode);
