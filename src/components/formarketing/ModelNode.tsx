import { memo, useCallback, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Image as ImageIcon, Trash2, Wand2, Zap, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ModelNodeData {
  title?: string;
  prompt?: string;
  model?: string;
  assetUrl?: string;
  status?: 'idle' | 'loading' | 'executing' | 'ready' | 'error';
  onVariation?: () => void;
}

const ModelNode = ({ id, data }: { id: string, data: ModelNodeData }) => {
  const { setNodes } = useReactFlow();
  const [isExpanded, setIsExpanded] = useState(false);

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

  const persistChange = async (val: string, field: 'prompt' | 'model' = 'prompt') => {
    const updateData = field === 'prompt' 
      ? { prompt: val, data_payload: { ...data, prompt: val } as any }
      : { data_payload: { ...data, model: val } as any };

    const { error } = await supabase
      .from('canvas_nodes')
      .update(updateData)
      .eq('id', id);
    
    if (error) console.error(`Error syncing model ${field}:`, error);
  };

  const updateModel = useCallback((val: string) => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, model: val }
          };
        }
        return node;
      })
    );
    persistChange(val, 'model');
  }, [id, data, setNodes]);

  const deleteNode = async () => {
    const { error } = await supabase.from('canvas_nodes').delete().eq('id', id);
    if (!error) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      toast.success("Imagen eliminada");
    }
  };

  return (
    <div className={`group relative rounded-2xl border border-white/5 bg-[#080809]/80 backdrop-blur-3xl w-[260px] animate-in zoom-in duration-300 nodrag shadow-3xl transition-all hover:border-white/20 ${data.status === 'loading' || data.status === 'executing' ? 'ring-1 ring-white/30 shadow-[0_0_30px_rgba(255,255,255,0.05)] animate-pulse' : ''}`}>
      {/* Nexus V3 Industrial Header */}
      <div className="flex h-10 items-center justify-between px-3 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-1 rounded-lg bg-white/5 border border-white/10">
              <ImageIcon className="w-3.5 h-3.5 text-white/50 shrink-0" />
            </div>
            <h3 className="text-[10px] font-bold text-white/90 tracking-tight truncate uppercase">
               {data.title || "MODEL_ENGINE_V3"}
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

      <div className="p-0 bg-white/[0.02] aspect-square relative flex items-center justify-center overflow-hidden group/img">
        {data.assetUrl ? (
          <img 
            src={data.assetUrl} 
            alt="Asset" 
            className="w-full h-full object-cover grayscale-[0.3] group-hover/img:grayscale-0 transition-all duration-700 group-hover/img:scale-105" 
          />
        ) : (
          <div className="flex flex-col items-center gap-4 opacity-20">
             <Wand2 className={`w-12 h-12 text-slate-600 ${data.status === 'loading' ? 'animate-pulse' : ''}`} />
             <span className="text-[9px] font-black lowercase tracking-widest text-slate-600">
                {data.status === 'loading' ? 'processing_quantum...' : 'awaiting_nexus...'}
             </span>
          </div>
        )}
        
        {data.status === 'loading' && (
          <div className="absolute inset-0 bg-[#080809]/90 backdrop-blur-md flex flex-col items-center justify-center gap-4">
             <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin shadow-2xl" />
             <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] animate-pulse">processing_quantum</span>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="p-3 space-y-3 bg-[#0a0a0b]/60 backdrop-blur-xl animate-in fade-in duration-500">
           <div className="space-y-2">
              <div className="flex items-center justify-between">
                 <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Parameters</span>
                 <div className="flex gap-1.5">
                    <button 
                      onClick={() => (data as any).onExecute?.()}
                      disabled={data.status === 'loading'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-white/90 text-black transition-all shadow-xl disabled:opacity-50 active:scale-95 group/exec"
                    >
                      <Zap className={`w-3 h-3 ${data.status === 'loading' ? 'animate-pulse' : 'group-hover/exec:scale-110 transition-transform font-bold'}`} />
                      <span className="text-[8px] font-bold lowercase tracking-widest">Run</span>
                    </button>
                    {data.assetUrl && (
                      <button 
                        onClick={() => data.onVariation?.()}
                        disabled={data.status === 'loading'}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all disabled:opacity-50 active:scale-95 group/var"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-white/40 group-hover/var:scale-110 transition-transform" />
                        <span className="text-[8px] font-bold lowercase tracking-widest">Var</span>
                      </button>
                    )}
                 </div>
              </div>
              <textarea
                 value={data.prompt || ""}
                 onChange={(e) => updatePrompt(e.target.value)}
                 onBlur={(e) => persistChange(e.target.value)}
                 onKeyDown={(e) => e.stopPropagation()}
                 className="w-full text-[10px] font-medium leading-relaxed text-white/70 bg-white/5 border border-white/5 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 border-white/10 transition-all resize-none min-h-[60px] placeholder:text-white/10"
                 placeholder="enter_neural_prompt..."
              />
              
              <div className="space-y-1.5">
                  <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest px-1 text-center block">Engine Selector</span>
                  <div className="grid grid-cols-2 gap-1.5">
                     {[
                       { id: 'nano-banana-pro', name: 'FLUX_V1' },
                       { id: 'nano-banana-2', name: 'PRO_V8' },
                       { id: 'nano-banana-25', name: 'ECON_V2' }
                     ].map((m) => (
                       <button
                         key={m.id}
                         onClick={() => updateModel(m.id)}
                         className={`px-2 py-1.5 rounded-lg border text-[8px] font-bold lowercase tracking-wider transition-all ${
                           (data.model || 'nano-banana-pro') === m.id 
                           ? 'bg-white/10 border-white/20 text-white' 
                           : 'bg-white/5 border-white/5 text-slate-600 hover:bg-white/10'
                         }`}
                       >
                         {m.name}
                       </button>
                     ))}
                  </div>
               </div>
           </div>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !-right-1 !bg-white !border-2 !border-[#020203] hover:scale-125 transition-transform" />
    </div>
  );
};

export default memo(ModelNode);
