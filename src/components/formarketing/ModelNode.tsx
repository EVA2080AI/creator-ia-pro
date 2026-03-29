import { memo, useCallback, useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Image as ImageIcon, Trash2, Wand2, Zap, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NodeNextAction } from './NodeNextAction';

interface ModelNodeData {
  title?: string;
  prompt?: string;
  model?: string;
  assetUrl?: string;
  status?: 'idle' | 'loading' | 'executing' | 'ready' | 'error';
  onVariation?: () => void;
}

const IMAGE_STEPS = [
  'Preparando prompt…',
  'Enviando a modelo…',
  'Sintetizando imagen…',
  'Finalizando…',
];

const ModelNode = ({ id, data }: { id: string, data: ModelNodeData }) => {
  const { setNodes } = useReactFlow();
  const [isExpanded, setIsExpanded] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (data.status !== 'executing') { setStepIndex(0); return; }
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, IMAGE_STEPS.length - 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [data.status]);

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
    <div className={`group relative rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02]
      ${data.status === 'executing' ? 'aether-prism glow-purple' : 'aether-card'}
      w-[260px] shadow-2xl
    `}>
      {/* Aether Node Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 rounded-xl bg-white/5 border border-white/10 group-hover:bg-aether-purple/20 group-hover:border-aether-purple/30 transition-colors">
              <ImageIcon className="w-4 h-4 text-white/70 shrink-0" />
            </div>
            <h3 className="text-[11px] font-bold text-white/90 tracking-wide truncate font-display uppercase">
               {data.title || "Visual Engine"}
            </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-white/5 text-white/30 hover:text-white rounded-lg transition-all">
             {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={deleteNode} className="p-2 hover:bg-rose-500/10 text-white/20 hover:text-rose-500 rounded-lg transition-all">
             <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-0 aspect-[4/5] relative flex items-center justify-center overflow-hidden bg-black/40 group/img border-b border-white/[0.05]">
        {data.assetUrl ? (
          <img 
            src={data.assetUrl} 
            alt="Asset" 
            className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-1000 ease-out" 
          />
        ) : (
          <div className="flex flex-col items-center gap-4 group-hover/img:scale-110 transition-transform duration-500">
             <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center shadow-inner">
                <Wand2 className={`w-6 h-6 text-white/20 ${data.status === 'executing' ? 'animate-pulse text-aether-purple' : ''}`} />
             </div>
             <span className="text-[10px] font-medium text-white/20 uppercase tracking-[0.2em]">
                {data.status === 'executing' ? 'Synthesizing...' : 'Awaiting Data'}
             </span>
          </div>
        )}
        
        {data.status === 'executing' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center gap-4 px-5">
            <div className="w-10 h-10 rounded-full border-t-2 border-aether-purple animate-spin" />
            <span className="text-[10px] font-bold text-white/80 tracking-wide animate-pulse text-center">
              {IMAGE_STEPS[stepIndex]}
            </span>
            <div className="flex gap-1">
              {IMAGE_STEPS.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i <= stepIndex ? 'w-6 bg-aether-purple' : 'w-2 bg-white/10'}`} />
              ))}
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 bg-black/20 animate-in fade-in slide-in-from-top-2 duration-300">
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest font-display">Generation parameters</span>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => (data as any).onExecute?.()}
                      disabled={data.status === 'executing'}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-white/90 text-black transition-all shadow-lg active:scale-95 disabled:opacity-50 group/exec"
                    >
                      <Zap className={`w-3.5 h-3.5 fill-current ${data.status === 'executing' ? 'animate-pulse' : 'group-hover/exec:scale-110 transition-transform'}`} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">Run</span>
                    </button>
                    {data.assetUrl && (
                      <button 
                        onClick={() => data.onVariation?.()}
                        disabled={data.status === 'executing'}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all active:scale-95 disabled:opacity-50 group/var"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-aether-blue group-hover/var:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">Var</span>
                      </button>
                    )}
                 </div>
              </div>
              <textarea
                 value={data.prompt || ""}
                 onChange={(e) => updatePrompt(e.target.value)}
                 onBlur={(e) => persistChange(e.target.value)}
                 onKeyDown={(e) => e.stopPropagation()}
                 className="w-full text-xs font-medium leading-relaxed text-white/80 bg-white/[0.03] border border-white/[0.08] p-3 rounded-2xl focus:outline-none focus:border-aether-purple/50 transition-all resize-none min-h-[80px] placeholder:text-white/10"
                 placeholder="Enter creative prompt..."
              />
              
              <div className="space-y-3">
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] font-display">Engine Selector</span>
                  <div className="grid grid-cols-2 gap-2">
                     {[
                       { id: 'flux-schnell',  name: 'FLUX Schnell' },
                       { id: 'flux-pro',      name: 'FLUX Pro' },
                       { id: 'flux-pro-1.1',  name: 'FLUX Pro 1.1' },
                       { id: 'sdxl',          name: 'SDXL' }
                     ].map((m) => (
                       <button
                         key={m.id}
                         onClick={() => updateModel(m.id)}
                         className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                           (data.model || 'flux-schnell') === m.id
                           ? 'bg-white/10 border-white/20 text-white shadow-lg shadow-white/5'
                           : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'
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

      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !-right-1 !bg-white !border-2 !border-[#16161b] hover:scale-125 transition-transform" />
      <NodeNextAction nodeId={id} />
    </div>
  );
};

export default memo(ModelNode);
