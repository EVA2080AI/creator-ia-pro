import { memo, useCallback, useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Image as ImageIcon, Trash2, Wand2, Zap, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NodeNextAction } from './NodeNextAction';

const RATIOS = [
  { id: '1:1',  label: '1:1',  desc: 'Instagram' },
  { id: '9:16', label: '9:16', desc: 'Story/Reel' },
  { id: '16:9', label: '16:9', desc: 'YouTube' },
  { id: '4:5',  label: '4:5',  desc: 'Feed' },
];

interface ModelNodeData {
  title?: string;
  prompt?: string;
  model?: string;
  assetUrl?: string;
  ratio?: string;
  imageHistory?: string[];
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

  const persistChange = async (val: string, field: 'prompt' | 'model' | 'ratio' = 'prompt') => {
    const updateData = field === 'prompt'
      ? { prompt: val, data_payload: { ...data, prompt: val } as any }
      : { data_payload: { ...data, [field]: val } as any };

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

  const updateRatio = useCallback((val: string) => {
    setNodes((nds) =>
      nds.map((node) => node.id === id ? { ...node, data: { ...node.data, ratio: val } } : node)
    );
    persistChange(val, 'ratio');
  }, [id, setNodes]);

  // Track image history when assetUrl changes
  useEffect(() => {
    if (!data.assetUrl) return;
    const history = data.imageHistory || [];
    if (history[0] === data.assetUrl) return; // already recorded
    const next = [data.assetUrl, ...history].slice(0, 3);
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, imageHistory: next } } : n));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.assetUrl]);

  const deleteNode = async () => {
    const { error } = await supabase.from('canvas_nodes').delete().eq('id', id);
    if (!error) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      toast.success("Imagen eliminada");
    }
  };

  return (
    <div className={`group relative rounded-[2rem] overflow-hidden transition-all duration-500 hover:scale-[1.02]
      ${data.status === 'executing' ? 'bg-white border-primary shadow-lg ring-2 ring-primary/20' : 'bg-white border border-zinc-200/60 hover:border-zinc-300 hover:shadow-xl shadow-sm transition-all'}
      w-[260px]
    `}>
      {/* Aether Node Header */}
      <div className="flex h-12 items-center justify-between px-5 border-b border-zinc-100/80 bg-zinc-50/40">
        <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 rounded-xl bg-orange-50 border border-orange-100 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
              <ImageIcon className="w-4 h-4 text-orange-500 shrink-0" />
            </div>
            <h3 className="text-[10px] font-bold text-zinc-900 tracking-[0.15em] truncate font-display uppercase">
               {data.title || "Visual Engine"}
            </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 rounded-lg transition-all">
             {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={deleteNode} className="p-2 hover:bg-red-50 text-red-400 hover:text-red-500 rounded-lg transition-all">
             <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-0 aspect-[4/5] relative flex items-center justify-center overflow-hidden bg-zinc-50 group/img border-b border-zinc-100">
        {data.assetUrl ? (
          <img 
            src={data.assetUrl} 
            alt="Asset" 
            className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-1000 ease-out" 
          />
        ) : (
          <div className="flex flex-col items-center gap-4 group-hover/img:scale-110 transition-transform duration-500">
             <div className="w-16 h-16 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center">
                <Wand2 className={`w-6 h-6 text-zinc-300 ${data.status === 'executing' ? 'animate-pulse text-primary' : ''}`} />
             </div>
             <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.2em]">
                {data.status === 'executing' ? 'Synthesizing...' : 'Awaiting Data'}
             </span>
          </div>
        )}
        
        {data.status === 'executing' && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 px-5">
            <div className="w-10 h-10 rounded-full border-t-2 border-primary animate-spin" />
            <span className="text-[10px] font-bold text-zinc-800 tracking-wide animate-pulse text-center">
              {IMAGE_STEPS[stepIndex]}
            </span>
            <div className="flex gap-1">
              {IMAGE_STEPS.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i <= stepIndex ? 'w-6 bg-primary' : 'w-2 bg-zinc-200'}`} />
              ))}
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 bg-white animate-in fade-in slide-in-from-top-2 duration-300 rounded-b-3xl">
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-display">Generation parameters</span>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => (data as any).onExecute?.()}
                      disabled={data.status === 'executing'}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border-transparent hover:bg-zinc-800 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 group/exec"
                    >
                      <Zap className={`w-3.5 h-3.5 fill-current ${data.status === 'executing' ? 'animate-pulse' : 'group-hover/exec:scale-110 transition-transform'}`} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">Run</span>
                    </button>
                    {data.assetUrl && (
                      <button 
                        onClick={() => data.onVariation?.()}
                        disabled={data.status === 'executing'}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 transition-all active:scale-95 disabled:opacity-50 group/var shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-primary group-hover/var:scale-110 transition-transform" />
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
                 className="w-full text-xs font-medium leading-relaxed text-zinc-900 bg-white border border-zinc-200 p-3 rounded-2xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none min-h-[80px] placeholder:text-zinc-400 shadow-sm hover:border-zinc-300"
                 placeholder="Enter creative prompt..."
              />
              
              {/* Aspect Ratio Selector */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] font-display">Ratio</span>
                <div className="flex gap-1.5 flex-wrap">
                  {RATIOS.map(r => (
                    <button
                      key={r.id}
                      onClick={() => updateRatio(r.id)}
                      title={r.desc}
                      className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-bold transition-all shadow-sm ${
                        (data.ratio || '1:1') === r.id
                        ? 'bg-zinc-900 border-zinc-900 text-white'
                        : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] font-display">Engine Selector</span>
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
                         className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-all shadow-sm ${
                           (data.model || 'flux-schnell') === m.id
                           ? 'bg-zinc-900 border-zinc-900 text-white'
                           : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300'
                         }`}
                       >
                         {m.name}
                       </button>
                     ))}
                  </div>
               </div>

               {/* Image History thumbnails */}
               {data.imageHistory && data.imageHistory.length > 0 && (
                 <div className="space-y-2 pt-2 border-t border-zinc-100">
                   <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] font-display">Historial</span>
                   <div className="flex gap-2">
                     {data.imageHistory.map((url, i) => (
                       <button
                         key={i}
                         onClick={() => setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, assetUrl: url } } : n))}
                         title="Restaurar imagen"
                         className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-200 hover:border-primary/50 hover:ring-2 hover:ring-primary/20 shadow-sm transition-all shrink-0"
                       >
                         <img src={url} alt={`Historial ${i + 1}`} className="w-full h-full object-cover" />
                       </button>
                     ))}
                   </div>
                 </div>
               )}
           </div>
        </div>
      )}

      <Handle type="target" position={Position.Left} id="any-in" className="!w-4 !h-4 !-left-2 !bg-zinc-400 !border-2 !border-white hover:!scale-125 transition-transform cursor-crosshair shadow-sm" />
      <Handle type="source" position={Position.Right} id="any-out" className="!w-4 !h-4 !-right-2 !bg-orange-500 !border-2 !border-white hover:!scale-125 transition-transform cursor-crosshair shadow-sm" />
      <NodeNextAction nodeId={id} />
    </div>
  );
};

export default memo(ModelNode);
