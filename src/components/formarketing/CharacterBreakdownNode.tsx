import { memo, useCallback, useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { UserCircle, Trash2, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CharacterNodeData {
  title?: string;
  flavor?: string;
  description?: string;
  model?: string;
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
    <div className={`group relative rounded-[2.5rem] border border-white/10 bg-[#080809]/80 backdrop-blur-3xl w-[300px] animate-in zoom-in duration-300 nodrag shadow-3xl transition-all hover:border-[#d4ff00]/50 ${data.status === 'executing' ? 'ring-2 ring-[#d4ff00] shadow-[0_0_30px_rgba(212,255,0,0.2)] animate-pulse' : ''}`}>
      {/* Nebula V8.0 Minimalist Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-2 overflow-hidden">
            <UserCircle className="w-4 h-4 text-[#d4ff00] shrink-0" />
             <input 
              value={localTitle} 
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={(e) => persistChange('title', e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="bg-transparent border-none p-0 m-0 text-[11px] font-black lowercase tracking-widest text-white focus:outline-none w-full truncate transition-all"
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
                 className="w-full text-xs text-slate-200 bg-white/5 border border-white/5 p-3 rounded-[1.2rem] focus:outline-none focus:ring-2 focus:ring-[#d4ff00]/10 focus:border-[#d4ff00]/30 transition-all font-bold placeholder:text-slate-700"
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
                 className="w-full text-xs leading-relaxed text-slate-400 bg-white/[0.02] p-4 rounded-[1.5rem] border border-white/5 min-h-[90px] focus:outline-none focus:border-[#d4ff00]/30 resize-none transition-all font-medium placeholder:text-slate-800"
                 placeholder="contexto narrativo..."
              />
          </div>
        )}

        {/* Industrial Fallback Selector */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between px-1">
             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">nexus_engine</span>
             <span className="text-[8px] font-bold text-[#d4ff00]/40 tracking-widest">industrial_fallback</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'deepseek-chat', name: 'deepseek_v3' },
              { id: 'gemini-3-flash', name: 'gemini_flash' },
              { id: 'claude-3.5-sonnet', name: 'claude_sonnet' },
              { id: 'gpt-oss-120b', name: 'llama_maverick' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => persistChange('model', m.id)}
                className={`px-3 py-2 rounded-xl border text-[9px] font-black lowercase tracking-wider transition-all ${
                  (data.model || 'deepseek-chat') === m.id 
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

      <Handle type="source" position={Position.Right} className="!w-4 !h-4 !-right-2 !bg-[#d4ff00] !border-4 !border-[#020203] !shadow-2xl !z-20 hover:scale-125 transition-transform" />
    </div>
  );
};

export default memo(CharacterBreakdownNode);

