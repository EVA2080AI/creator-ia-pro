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
    <div className={`group relative rounded-[2.5rem] border border-white/5 bg-[#080809]/80 backdrop-blur-3xl w-[300px] animate-in zoom-in duration-300 nodrag shadow-3xl transition-all hover:border-[#d4ff00]/30 ${data.status === 'loading' || data.status === 'executing' ? 'ring-2 ring-[#d4ff00] shadow-[0_0_30px_rgba(212,255,0,0.2)] animate-pulse' : ''}`}>
      {/* Nebula V8.0 Minimalist Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 rounded-lg bg-[#d4ff00]/10">
              <ImageIcon className="w-3.5 h-3.5 text-[#d4ff00] shrink-0" />
            </div>
            <h3 className="text-[10px] font-black lowercase tracking-widest text-white truncate">
               {data.title || "nexus_visual_v8"}
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
                {data.status === 'loading' ? 'deep_generating_v8...' : 'waiting_for_nexus...'}
             </span>
          </div>
        )}
        
        {data.status === 'loading' && (
          <div className="absolute inset-0 bg-[#080809]/80 backdrop-blur-md flex flex-col items-center justify-center gap-6">
             <div className="w-10 h-10 rounded-full border-4 border-[#d4ff00] border-t-transparent animate-spin shadow-2xl shadow-[#d4ff00]/30" />
             <span className="text-[10px] font-black text-[#d4ff00] lowercase tracking-[0.2em] animate-pulse">nebula_processing</span>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="p-5 space-y-5 bg-[#0a0a0b]/60 backdrop-blur-xl animate-in fade-in duration-500">
           <div className="space-y-3">
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">nexus_parameters</span>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => (data as any).onExecute?.()}
                      disabled={data.status === 'loading'}
                      className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#d4ff00] hover:bg-[#c4eb00] text-[#020203] transition-all shadow-xl shadow-[#d4ff00]/20 disabled:opacity-50 active:scale-95 group/exec"
                    >
                      <Zap className={`w-3.5 h-3.5 ${data.status === 'loading' ? 'animate-pulse' : 'group-hover/exec:scale-110 transition-transform font-black'}`} />
                      <span className="text-[9px] font-black lowercase tracking-widest">run</span>
                    </button>
                    {data.assetUrl && (
                      <button 
                        onClick={() => data.onVariation?.()}
                        disabled={data.status === 'loading'}
                        className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-white transition-all disabled:opacity-50 active:scale-95 group/var"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#d4ff00] group-hover/var:scale-110 transition-transform" />
                        <span className="text-[9px] font-black lowercase tracking-widest">variar</span>
                      </button>
                    )}
                 </div>
              </div>
              <textarea
                 value={data.prompt || ""}
                 onChange={(e) => updatePrompt(e.target.value)}
                 onBlur={(e) => persistChange(e.target.value)}
                 onKeyDown={(e) => e.stopPropagation()}
                 className="w-full text-xs font-medium leading-relaxed text-slate-300 bg-white/5 border border-white/5 p-4 rounded-3xl focus:outline-none focus:ring-2 focus:ring-[#d4ff00]/20 border-white/10 transition-all resize-none min-h-[80px] placeholder:text-slate-800"
                 placeholder="nebula prompt engine..."
              />
              
              <div className="space-y-2">
                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">Motor de Respaldo (Industrial Fallback)</span>
                 <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'nano-banana-pro', name: 'image_pro_v8' },
                      { id: 'nano-banana-2', name: 'image_flash_v8' },
                      { id: 'nano-banana-25', name: 'image_eco_v8' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => updateModel(m.id)}
                        className={`px-3 py-2 rounded-xl border text-[9px] font-black lowercase tracking-wider transition-all ${
                          (data.model || 'nano-banana-pro') === m.id 
                          ? 'bg-[#d4ff00]/10 border-[#d4ff00]/30 text-[#d4ff00]' 
                          : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
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

      <Handle type="source" position={Position.Right} className="!w-4 !h-4 !-right-2 !bg-[#d4ff00] !border-4 !border-[#020203] !shadow-2xl !z-20 hover:scale-125 transition-transform" />
    </div>
  );
};

export default memo(ModelNode);
