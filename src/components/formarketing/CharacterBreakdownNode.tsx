import { memo, useCallback, useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { UserCircle, Trash2, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CharacterNodeData {
  title?: string;
  flavor?: string;
  description?: string;
  status?: 'idle' | 'executing' | 'ready' | 'error';
}

const CharacterBreakdownNode = ({ id, data }: { id: string, data: CharacterNodeData }) => {
  const { setNodes } = useReactFlow();
  
  // Local state for smooth typing
  const [localTitle, setLocalTitle] = useState(data.title || "");
  const [localFlavor, setLocalFlavor] = useState(data.flavor || "");
  const [localDescription, setLocalDescription] = useState(data.description || "");
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync local state if external data changes
  useEffect(() => {
    setLocalTitle(data.title || "");
    setLocalFlavor(data.flavor || "");
    setLocalDescription(data.description || "");
  }, [data.title, data.flavor, data.description]);

  const persistChange = async (field: keyof CharacterNodeData, value: string) => {
    // 1. Update Global State
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, [field]: value }
          };
        }
        return node;
      })
    );

    // 2. Sync to Supabase
    const { error } = await supabase
      .from('canvas_nodes')
      .update({ data_payload: { ...data, [field]: value } as any })
      .eq('id', id);
    
    if (error) console.error("Error syncing character data:", error);
  };

  const deleteNode = async () => {
    const { error } = await supabase.from('canvas_nodes').delete().eq('id', id);
    if (!error) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      toast.success("Personaje eliminado");
    }
  };

  return (
    <div className={`group relative rounded-[2rem] border border-white/10 bg-black/50 backdrop-blur-3xl w-[300px] animate-in zoom-in duration-300 nodrag shadow-2xl transition-all hover:border-[#ff0071]/50 ${data.status === 'executing' ? 'ring-2 ring-[#ff0071] shadow-[0_0_30px_rgba(255,0,113,0.2)] animate-pulse' : ''}`}>
      {/* V6.2 Pulse Header */}
      <div className="pulse-node-header justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
            <UserCircle className="w-4 h-4 text-[#ff0071] shrink-0" />
             <input 
              value={localTitle} 
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={(e) => persistChange('title', e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="bg-transparent border-none p-0 m-0 text-[11px] font-black lowercase tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-[#ff0071]/20 rounded-lg px-2 -ml-2 w-full truncate transition-all"
              placeholder="nexus_profile"
            />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-white/5 text-slate-500 rounded-xl transition-all">
             {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={deleteNode} className="p-1 hover:bg-destructive/5 text-destructive/30 hover:text-destructive rounded-md transition-all">
             <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
               <span className="text-[10px] font-bold text-slate-400 lowercase tracking-tight flex items-center gap-1.5">
                  flavor
               </span>
            </div>
              <input
                 value={localFlavor}
                 onChange={(e) => setLocalFlavor(e.target.value)}
                 onBlur={(e) => persistChange('flavor', e.target.value)}
                 onKeyDown={(e) => e.stopPropagation()}
                 className="w-full text-xs text-slate-200 bg-white/5 border border-white/5 p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ff0071]/10 focus:border-[#ff0071]/30 transition-all font-bold placeholder:text-slate-700"
                 placeholder="ej: cyberpunk..."
              />
        </div>

        {isExpanded && (localDescription || !localDescription) && (
          <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
             <span className="text-[10px] font-bold text-slate-400 lowercase tracking-tight px-0.5">narrative data</span>
              <textarea
                 value={localDescription}
                 onChange={(e) => setLocalDescription(e.target.value)}
                 onBlur={(e) => persistChange('description', e.target.value)}
                 onKeyDown={(e) => e.stopPropagation()}
                 className="w-full text-xs leading-relaxed text-slate-400 bg-white/[0.02] p-4 rounded-3xl border border-white/5 min-h-[90px] focus:outline-none focus:border-[#ff0071]/30 resize-none transition-all font-medium placeholder:text-slate-800"
                 placeholder="contexto narrativo..."
              />
          </div>
        )}

        <div className="bg-[#ff0071]/[0.02] p-3 rounded-2xl border border-[#ff0071]/5 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-[#ff0071] lowercase tracking-widest flex items-center gap-2.5">
               <span className="w-2 h-2 rounded-full bg-[#ff0071] shadow-[0_0_8px_#ff0071]" />
               nexus_engine_ready
            </p>
            <span className="text-[9px] font-black tracking-widest uppercase text-slate-600">V7.0</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!w-4 !h-4 !-right-2 !bg-[#ff0071] !border-4 !border-[#0a0a0b] !shadow-2xl !z-20 hover:scale-125 transition-transform" />
    </div>
  );
};

export default memo(CharacterBreakdownNode);

