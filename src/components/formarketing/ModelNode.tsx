import { memo, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Image as ImageIcon, Trash2, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ModelNodeData {
  title?: string;
  prompt?: string;
  assetUrl?: string;
  status?: 'idle' | 'loading' | 'ready' | 'error';
}

const ModelNode = ({ id, data }: { id: string, data: ModelNodeData }) => {
  const { setNodes } = useReactFlow();

  const updatePrompt = useCallback((val: string) => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, prompt: val }
          };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  const persistChange = async (val: string) => {
    const { error } = await supabase
      .from('canvas_nodes')
      .update({ prompt: val, data_payload: { ...data, prompt: val } as any })
      .eq('id', id);
    
    if (error) console.error("Error syncing model prompt:", error);
  };

  const deleteNode = async () => {
    const { error } = await supabase.from('canvas_nodes').delete().eq('id', id);
    if (!error) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      toast.success("Imagen eliminada");
    }
  };

  return (
    <div className="group relative bg-card/60 border border-white/5 rounded-3xl p-0 w-72 shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in duration-300">
      {/* V4.7 Industrial Header */}
      <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-xl shadow-inner">
               <ImageIcon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[11px] font-black uppercase tracking-tighter text-foreground">
                {data.title || "IMAGE GENERATOR"}
              </h3>
              <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">V5.1 Industrial</span>
            </div>
        </div>
        <button onClick={deleteNode} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-all">
           <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-0 border-b border-white/5 bg-black/40 aspect-square relative flex items-center justify-center overflow-hidden group/img">
        {data.assetUrl ? (
          <img 
            src={data.assetUrl} 
            alt="Asset" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" 
          />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-20">
             <Wand2 className={`w-8 h-8 ${data.status === 'loading' ? 'animate-pulse' : ''}`} />
             <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                {data.status === 'loading' ? 'Generando...' : 'Esperando ejecución...'}
             </span>
          </div>
        )}
        
        {data.status === 'loading' && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
             <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
             <span className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">Deep Processing</span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4 bg-gradient-to-b from-transparent to-black/20">
        <div className="space-y-2">
           <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">Visual Prompt</span>
           <textarea
              value={data.prompt || ""}
              onChange={(e) => updatePrompt(e.target.value)}
              onBlur={(e) => persistChange(e.target.value)}
              className="w-full text-xs leading-relaxed text-foreground/70 bg-black/20 p-3 rounded-2xl border border-white/5 min-h-[60px] focus:outline-none focus:border-primary/30 resize-none"
              placeholder="Describe lo que quieres ver..."
           />
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="w-4 h-4 -left-2 bg-primary border-4 border-background shadow-lg !z-20" />
      <Handle type="source" position={Position.Right} className="w-4 h-4 -right-2 bg-primary border-4 border-background shadow-lg !z-20" />
    </div>
  );
};

export default memo(ModelNode);
