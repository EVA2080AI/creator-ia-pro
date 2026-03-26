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
    <div className={`group relative pulse-node w-[280px] animate-in zoom-in duration-200 nodrag shadow-xl transition-all ${data.status === 'executing' ? 'ring-2 ring-[#ff0071] shadow-[0_0_20px_rgba(255,0,113,0.15)] animate-pulse' : ''}`}>
      {/* V6.2 Pulse Header */}
      <div className="pulse-node-header justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
            <UserCircle className="w-4 h-4 text-[#ff0071] shrink-0" />
            <input 
              value={localTitle} 
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={(e) => persistChange('title', e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="bg-transparent border-none p-0 m-0 text-[11px] font-bold lowercase tracking-tight text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#ff0071]/20 rounded px-1 -ml-1 w-full truncate"
              placeholder="nexus profile"
            />
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
                className="w-full text-xs text-slate-600 bg-slate-50 border border-slate-100 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff0071]/10 focus:border-[#ff0071]/30 transition-all font-medium"
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
                className="w-full text-xs leading-relaxed text-slate-500 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 min-h-[70px] focus:outline-none focus:border-[#ff0071]/30 resize-none transition-all"
                placeholder="contexto..."
             />
          </div>
        )}

        <div className="bg-[#ff0071]/[0.02] p-3 rounded-2xl border border-[#ff0071]/5 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-[#ff0071]/60 lowercase tracking-tight flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-[#ff0071] animate-pulse" />
               nexus status
            </p>
            <span className="text-[9px] font-bold tracking-tight uppercase text-[#ff0071]/40">READY</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !-right-1.5 !bg-slate-300 !border-2 !border-white !shadow-sm !z-20" />
    </div>
  );
};

export default memo(CharacterBreakdownNode);

