import { memo, useCallback, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Image as ImageIcon, Trash2, Wand2, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ModelNodeData {
  title?: string;
  prompt?: string;
  assetUrl?: string;
  status?: 'idle' | 'loading' | 'executing' | 'ready' | 'error';
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
    <div className={`group relative pulse-node w-[280px] animate-in zoom-in duration-200 nodrag shadow-xl transition-all ${data.status === 'loading' || data.status === 'executing' ? 'ring-2 ring-[#ff0071] shadow-[0_0_20px_rgba(255,0,113,0.15)] animate-pulse' : ''}`}>
      {/* V6.2 Pulse Header */}
      <div className="pulse-node-header justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
            <ImageIcon className="w-4 h-4 text-[#ff0071] shrink-0" />
            <h3 className="text-[11px] font-bold lowercase tracking-tight text-slate-800 truncate">
               {data.title || "image gen"}
            </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-slate-100 text-slate-400 rounded-md transition-all">
             {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={deleteNode} className="p-1 hover:bg-destructive/5 text-destructive/30 hover:text-destructive rounded-md transition-all">
             <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-0 bg-slate-50/50 aspect-square relative flex items-center justify-center overflow-hidden group/img">
        {data.assetUrl ? (
          <img 
            src={data.assetUrl} 
            alt="Asset" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105" 
          />
        ) : (
          <div className="flex flex-col items-center gap-3 opacity-20">
             <Wand2 className={`w-10 h-10 text-slate-400 ${data.status === 'loading' ? 'animate-pulse' : ''}`} />
             <span className="text-[10px] font-bold lowercase tracking-tight text-slate-400">
                {data.status === 'loading' ? 'generando...' : 'esperando ejecución...'}
             </span>
          </div>
        )}
        
        {data.status === 'loading' && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
             <div className="w-8 h-8 rounded-full border-2 border-[#ff0071] border-t-transparent animate-spin" />
             <span className="text-[10px] font-bold text-[#ff0071] lowercase tracking-tight animate-pulse">deep processing</span>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 bg-white animate-in slide-in-from-top-2 duration-200">
           <div className="space-y-2">
              <div className="flex items-center justify-between px-0.5">
                 <span className="text-[10px] font-bold text-slate-400 lowercase tracking-tight">prompt engine</span>
                 <button 
                   onClick={() => (data as any).onExecute?.()}
                   disabled={data.status === 'loading'}
                   className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff0071] hover:bg-[#e60066] text-white transition-all shadow-md shadow-[#ff0071]/10 disabled:opacity-50 active:scale-95 group/exec"
                 >
                   <Zap className={`w-3 h-3 ${data.status === 'loading' ? 'animate-pulse' : 'group-hover/exec:scale-110 transition-transform'}`} />
                   <span className="text-[10px] font-bold lowercase tracking-tight leading-none">execute</span>
                 </button>
              </div>
              <textarea
                 value={data.prompt || ""}
                 onChange={(e) => updatePrompt(e.target.value)}
                 onBlur={(e) => persistChange(e.target.value)}
                 onKeyDown={(e) => e.stopPropagation()}
                 className="w-full text-xs leading-relaxed text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ff0071]/10 focus:border-[#ff0071]/30 transition-all resize-none min-h-[60px]"
                 placeholder="prompt..."
              />
           </div>
        </div>
      )}

      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !-left-1.5 !bg-slate-300 !border-2 !border-white !shadow-sm !z-20" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !-right-1.5 !bg-slate-300 !border-2 !border-white !shadow-sm !z-20" />
    </div>
  );
};

export default memo(ModelNode);
