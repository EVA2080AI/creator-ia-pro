import { memo, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Image as ImageIcon, Trash2, Wand2, Zap } from 'lucide-react';
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
    <div className="group relative bg-[#0f0f0f]/95 border border-white/5 rounded-[1.5rem] p-0 w-[300px] shadow-2xl backdrop-blur-3xl overflow-hidden animate-in fade-in zoom-in duration-300 isolation-auto">
      {/* V5.3 Industrial Header */}
      <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
            <div className="bg-primary/20 p-2 rounded-xl shadow-inner group-hover:rotate-6 transition-transform">
               <ImageIcon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[10px] font-black uppercase tracking-tighter text-foreground/90 leading-none">
                {data.title || "IMAGE GENERATOR"}
              </h3>
              <span className="text-[8px] font-black text-primary/40 uppercase tracking-[0.2em] mt-1">V5.4 COMPACT ENGINE</span>
            </div>
        </div>
        <button onClick={deleteNode} className="opacity-0 group-hover:opacity-100 p-2.5 hover:bg-destructive/10 text-destructive rounded-xl transition-all">
           <Trash2 className="w-4 h-4" />
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

      <div className="p-4 space-y-3 bg-gradient-to-b from-transparent to-black/20">
         <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
               <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] font-mono">Prompt Engine</span>
               <button 
                 onClick={() => (data as any).onExecute?.()}
                 disabled={data.status === 'loading'}
                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all border border-primary/20 disabled:opacity-50 group/exec shadow-lg active:scale-95"
               >
                 <Zap className={`w-3 h-3 ${data.status === 'loading' ? 'animate-pulse' : 'group-hover/exec:scale-110 transition-transform'}`} />
                 <span className="text-[9px] font-black uppercase tracking-widest leading-none text-white lg:inline hidden">Ejecutar</span>
               </button>
            </div>
            <textarea
               value={data.prompt || ""}
               onChange={(e) => updatePrompt(e.target.value)}
               onBlur={(e) => persistChange(e.target.value)}
               onKeyDown={(e) => e.stopPropagation()}
               className="w-full text-[10px] leading-relaxed text-foreground/60 bg-black/30 p-3 rounded-xl border border-white/5 min-h-[60px] focus:outline-none focus:border-primary/30 transition-all resize-none"
               placeholder="Prompt..."
            />
         </div>
      </div>

      <Handle type="target" position={Position.Left} className="w-5 h-5 -left-2.5 bg-primary border-[6px] border-[#0a0a0a] shadow-xl !z-20" />
      <Handle type="source" position={Position.Right} className="w-5 h-5 -right-2.5 bg-primary border-[6px] border-[#0a0a0a] shadow-xl !z-20" />
    </div>
  );
};

export default memo(ModelNode);
