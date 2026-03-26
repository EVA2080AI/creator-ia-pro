import { memo, useCallback, useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { UserCircle, Trash2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CharacterNodeData {
  title?: string;
  flavor?: string;
  description?: string;
}

const CharacterBreakdownNode = ({ id, data }: { id: string, data: CharacterNodeData }) => {
  const { setNodes } = useReactFlow();
  
  // Local state for smooth typing
  const [localTitle, setLocalTitle] = useState(data.title || "");
  const [localFlavor, setLocalFlavor] = useState(data.flavor || "");
  const [localDescription, setLocalDescription] = useState(data.description || "");

  // Sync local state if external data changes (e.g. from DB load)
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
    <div className="group relative bg-[#0f0f0f]/90 border border-white/10 rounded-[2.5rem] p-0 w-80 shadow-2xl backdrop-blur-3xl overflow-hidden animate-in zoom-in duration-500 nodrag">
      {/* V5.3 Premium Header */}
      <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-r from-emerald-500/10 to-transparent flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2.5 rounded-2xl shadow-inner group-hover:rotate-12 transition-transform">
               <UserCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex flex-col">
              <input 
                value={localTitle} 
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={(e) => persistChange('title', e.target.value)}
                onKeyDown={(e) => e.stopPropagation()} // Prevent ReactFlow from capturing keys
                className="bg-transparent border-none p-0 m-0 text-xs font-black uppercase tracking-tighter text-foreground focus:outline-none w-40"
                placeholder="CHARACTER PROFILE"
              />
              <span className="text-[9px] font-bold text-emerald-500/50 uppercase tracking-[0.2em] mt-0.5">V5.3 SPACES ELITE</span>
            </div>
        </div>
        <button onClick={deleteNode} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/10 text-destructive rounded-xl transition-all">
           <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-6 space-y-5">
        <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                 <ShieldCheck className="w-3 h-3" />
                 Flavor Context
               </span>
               <span className="text-[9px] opacity-30 font-bold uppercase tracking-widest">PRO-TIER</span>
            </div>
            <input
               value={localFlavor}
               onChange={(e) => setLocalFlavor(e.target.value)}
               onBlur={(e) => persistChange('flavor', e.target.value)}
               onKeyDown={(e) => e.stopPropagation()}
               className="w-full text-xs text-foreground/80 bg-white/5 p-3 rounded-2xl border border-white/5 italic focus:outline-none focus:border-emerald-500/30 transition-all font-medium"
               placeholder="Ej: Dark & Mysterious Cyberpunk"
            />
        </div>

        <div className="space-y-2">
           <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest px-1">Description & Narrative Engine</span>
           <textarea
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              onBlur={(e) => persistChange('description', e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full text-[11px] leading-relaxed text-foreground/70 bg-black/20 p-4 rounded-3xl border border-white/5 min-h-[100px] focus:outline-none focus:border-emerald-500/30 resize-none transition-all"
              placeholder="Escribe el contexto detallado para la IA..."
           />
        </div>

        <div className="bg-emerald-500/5 p-4 rounded-3xl border border-emerald-500/10 transition-all group-hover:bg-emerald-500/10">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             Autonomy Logic Status
          </p>
          <div className="flex items-center gap-2 opacity-50">
             <div className="h-0.5 flex-1 bg-emerald-500/20" />
             <span className="text-[8px] font-mono tracking-tighter uppercase font-bold">READY FOR EXECUTION</span>
             <div className="h-0.5 flex-1 bg-emerald-500/20" />
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-5 h-5 -right-2.5 bg-emerald-500 border-[6px] border-[#0a0a0a] shadow-xl !z-20" />
    </div>
  );
};

export default memo(CharacterBreakdownNode);

