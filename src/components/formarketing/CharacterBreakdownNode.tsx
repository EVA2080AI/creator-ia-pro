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
    <div className="group relative bg-[#0f0f0f]/95 border border-white/5 rounded-[1.8rem] p-0 w-72 shadow-2xl backdrop-blur-3xl overflow-hidden animate-in zoom-in duration-300 nodrag">
      {/* V5.3 Premium Header */}
      <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-emerald-500/10 to-transparent flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
            <div className="bg-emerald-500/20 p-2 rounded-xl shadow-inner group-hover:rotate-6 transition-transform">
               <UserCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex flex-col">
              <input 
                value={localTitle} 
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={(e) => persistChange('title', e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="bg-transparent border-none p-0 m-0 text-[10px] font-black uppercase tracking-tighter text-foreground/90 focus:outline-none w-32"
                placeholder="CHARACTER PROFILE"
              />
              <span className="text-[8px] font-bold text-emerald-500/40 uppercase tracking-[0.2em] mt-0.5">V5.4 SPACES COMPACT</span>
            </div>
        </div>
        <button onClick={deleteNode} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/10 text-destructive rounded-xl transition-all">
           <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-5 space-y-4">
        <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                 <ShieldCheck className="w-2.5 h-2.5" />
                 Flavor
               </span>
               <span className="text-[8px] opacity-20 font-bold uppercase tracking-widest">PRO</span>
            </div>
            <input
               value={localFlavor}
               onChange={(e) => setLocalFlavor(e.target.value)}
               onBlur={(e) => persistChange('flavor', e.target.value)}
               onKeyDown={(e) => e.stopPropagation()}
               className="w-full text-[10px] text-foreground/70 bg-white/5 p-2.5 rounded-xl border border-white/5 italic focus:outline-none focus:border-emerald-500/20 transition-all font-medium"
               placeholder="Ej: Dark & Mysterious Cyberpunk"
            />
        </div>

        <div className="space-y-1.5">
           <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest px-1 font-mono">Narrative Engine</span>
           <textarea
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              onBlur={(e) => persistChange('description', e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full text-[10px] leading-relaxed text-foreground/60 bg-black/20 p-3 rounded-2xl border border-white/5 min-h-[80px] focus:outline-none focus:border-emerald-500/20 resize-none transition-all"
              placeholder="Contexto IA..."
           />
        </div>

        <div className="bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/5 transition-all group-hover:bg-emerald-500/8">
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

