import { memo, useCallback, useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { UserCircle, Trash2, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NodeNextAction } from './NodeNextAction';

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
    <div className={`group relative rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02]
      ${data.status === 'executing' ? 'aether-prism glow-purple' : 'aether-card'}
      w-[260px] shadow-2xl nodrag
    `}>
      {/* Aether Character Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-2.5 overflow-hidden">
            <UserCircle className="w-4 h-4 text-white/40 group-hover:text-aether-purple transition-colors shrink-0" />
             <input 
              value={localTitle} 
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={(e) => persistChange('title', e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="bg-transparent border-none p-0 m-0 text-xs font-bold tracking-tight text-white focus:outline-none w-full truncate transition-all font-display uppercase"
              placeholder="Unnamed Entity"
            />
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
      
      <div className="p-4 space-y-4">
        <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
               <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest font-display">
                  Persona flavor
               </span>
            </div>
              <input
                 value={localFlavor}
                 onChange={(e) => setLocalFlavor(e.target.value)}
                 onBlur={(e) => persistChange('flavor', e.target.value)}
                 onKeyDown={(e) => e.stopPropagation()}
                 className="w-full text-xs text-white/90 bg-white/[0.03] border border-white/[0.08] p-3 rounded-2xl focus:outline-none focus:border-aether-purple/50 transition-all font-bold placeholder:text-white/10"
                 placeholder="e.g. Cyberpunk Architect..."
              />
        </div>

        {isExpanded && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
             <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-1 font-display">Narrative essence</span>
              <textarea
                 value={localDescription}
                 onChange={(e) => setLocalDescription(e.target.value)}
                 onBlur={(e) => persistChange('description', e.target.value)}
                 onKeyDown={(e) => e.stopPropagation()}
                 className="w-full text-xs leading-relaxed text-white/60 bg-white/[0.02] p-4 rounded-3xl border border-white/[0.05] min-h-[90px] focus:outline-none focus:border-aether-purple/30 resize-none transition-all font-medium placeholder:text-white/5"
                 placeholder="Describe the core behavior and background..."
              />
          </div>
        )}

        {/* Aether Logic Engine */}
        <div className="pt-2 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between px-1">
             <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest font-display">Neural Engine</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'deepseek-chat', name: 'DeepSeek V3' },
              { id: 'gemini-3-flash', name: 'Gemini Hyper' },
              { id: 'claude-3.5-sonnet', name: 'Claude 3.5' },
              { id: 'gpt-oss-120b', name: 'Llama 405B' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => persistChange('model', m.id)}
                className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                  (data.model || 'deepseek-chat') === m.id 
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

      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !-right-1 !bg-white !border-2 !border-[#020203] hover:scale-125 transition-transform" />
      <NodeNextAction nodeId={id} />
    </div>
  );
};

export default memo(CharacterBreakdownNode);

