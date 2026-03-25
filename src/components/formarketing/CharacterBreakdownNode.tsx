import { memo, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { UserCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CharacterNodeData {
  title?: string;
  flavor?: string;
  description?: string;
}

const CharacterBreakdownNode = ({ id, data }: { id: string, data: CharacterNodeData }) => {
  const { setNodes } = useReactFlow();

  const updateField = useCallback((field: keyof CharacterNodeData, value: string) => {
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
  }, [id, setNodes]);

  const persistChange = async (field: keyof CharacterNodeData, value: string) => {
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
    <div className="group relative bg-card/60 border border-white/5 rounded-3xl p-0 w-72 shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in duration-300">
      {/* V4.7 Industrial Header */}
      <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-emerald-500/10 to-transparent flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-xl shadow-inner">
               <UserCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex flex-col">
              <input 
                value={data.title || ""} 
                onChange={(e) => updateField('title', e.target.value)}
                onBlur={(e) => persistChange('title', e.target.value)}
                className="bg-transparent border-none p-0 m-0 text-[11px] font-black uppercase tracking-tighter text-foreground focus:outline-none w-32"
                placeholder="CHARACTER PROFILE"
              />
              <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">V5.1 Industrial</span>
            </div>
        </div>
        <button onClick={deleteNode} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-all">
           <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div className="p-5 space-y-4">
        <div className="space-y-2">
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Flavor Context</span>
              <span className="text-[10px] opacity-50 font-mono">ID: 0x47</span>
           </div>
           <input
              value={data.flavor || ""}
              onChange={(e) => updateField('flavor', e.target.value)}
              onBlur={(e) => persistChange('flavor', e.target.value)}
              className="w-full text-xs text-foreground/80 bg-white/5 p-2 rounded-xl border border-white/5 italic focus:outline-none focus:border-emerald-500/30"
              placeholder="Ej: Blueberry & Lavender"
           />
        </div>

        <div className="space-y-2">
           <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">Description & Narrative</span>
           <textarea
              value={data.description || ""}
              onChange={(e) => updateField('description', e.target.value)}
              onBlur={(e) => persistChange('description', e.target.value)}
              className="w-full text-xs leading-relaxed text-foreground/70 bg-black/20 p-3 rounded-2xl border border-white/5 min-h-[80px] focus:outline-none focus:border-emerald-500/30 resize-none"
              placeholder="Describe tu personaje aquí..."
           />
        </div>

        <div className="bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10 transition-all group-hover:bg-emerald-500/10">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             Casting Direction
          </p>
          <ul className="space-y-1 opacity-70">
            <li className="text-[10px] flex items-center gap-2 text-foreground/60 italic">
               * Modo Industrial: Contexto dinámico activado
            </li>
          </ul>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-4 h-4 -right-2 bg-emerald-500 border-4 border-background shadow-lg !z-20" />
    </div>
  );
};

export default memo(CharacterBreakdownNode);
