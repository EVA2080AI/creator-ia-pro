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
  onAddConnected?: (sourceId: string, targetType: string) => void;
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
    <div className={`group relative rounded-[2rem] transition-all duration-500 hover:scale-[1.02]
      ${data.status === 'executing' ? 'bg-white border-primary shadow-lg ring-2 ring-primary/20' : 'bg-white border border-zinc-200/60 hover:border-zinc-300 hover:shadow-xl shadow-sm transition-all'}
      w-[260px]
    `}>
      {/* Aether Character Header */}
      <div className="flex h-12 items-center justify-between px-5 border-b border-zinc-100/80 bg-zinc-50/40">
        <div className="flex items-center gap-2.5 overflow-hidden">
            <UserCircle className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 transition-colors shrink-0" />
             <input 
              value={localTitle} 
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={(e) => persistChange('title', e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="bg-transparent border-none p-0 m-0 text-xs font-bold tracking-[0.05em] text-zinc-900 focus:outline-none w-full truncate transition-all font-sans uppercase placeholder:text-zinc-400"
              placeholder="Unnamed Entity"
            />
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
      
      <div className="p-4 space-y-4 bg-white rounded-b-3xl">
        <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
               <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-sans">
                  Persona flavor
               </span>
            </div>
              <input
                 value={localFlavor}
                 onChange={(e) => setLocalFlavor(e.target.value)}
                 onBlur={(e) => persistChange('flavor', e.target.value)}
                 onKeyDown={(e) => e.stopPropagation()}
                 className="w-full text-xs text-zinc-900 bg-white border border-zinc-200 shadow-sm p-3 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all font-bold placeholder:text-zinc-400"
                 placeholder="e.g. Cyberpunk Architect..."
              />
        </div>

        {isExpanded && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
             <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-1 font-sans">Narrative essence</span>
              <textarea
                 value={localDescription}
                 onChange={(e) => setLocalDescription(e.target.value)}
                 onBlur={(e) => persistChange('description', e.target.value)}
                 onKeyDown={(e) => e.stopPropagation()}
                 className="w-full text-xs leading-relaxed text-zinc-800 bg-zinc-50 p-4 rounded-3xl border border-zinc-200 min-h-[90px] focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 resize-none transition-all font-medium placeholder:text-zinc-400"
                 placeholder="Describe the core behavior and background..."
              />
          </div>
        )}

        {/* Aether Logic Engine */}
        <div className="pt-2 border-t border-zinc-100 space-y-3">
          <div className="flex items-center justify-between px-1">
             <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-sans">Neural Engine</span>
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
                className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-all shadow-sm ${
                  (data.model || 'deepseek-chat') === m.id 
                  ? 'bg-zinc-900 border-zinc-900 text-white' 
                  : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input handle - visible colored dot with glow */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-50">
        <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-md cursor-crosshair hover:scale-125 transition-transform"
             style={{ boxShadow: '0 0 8px rgba(251, 191, 68, 0.6), 0 0 0 2px white' }}>
          <Handle type="target" position={Position.Left} id="text-in" className="!w-full !h-full !opacity-0 !border-0 !bg-transparent" />
        </div>
      </div>

      {/* Output handle - visible colored dot with glow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-50">
        <div className="w-4 h-4 rounded-full bg-orange-400 border-2 border-white shadow-md cursor-crosshair hover:scale-125 transition-transform"
             style={{ boxShadow: '0 0 8px rgba(251, 146, 60, 0.6), 0 0 0 2px white' }}>
          <Handle type="source" position={Position.Right} id="context-out" className="!w-full !h-full !opacity-0 !border-0 !bg-transparent" />
        </div>
      </div>
      <NodeNextAction nodeId={id} />
    </div>

  );
};

export default memo(CharacterBreakdownNode);

