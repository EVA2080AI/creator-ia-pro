import { memo, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Layout, Trash2, Globe, Smartphone, Monitor, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LayoutNodeData {
  title?: string;
  platform?: 'mobile' | 'web' | 'desktop';
  structure?: string;
}

const LayoutBuilderNode = ({ id, data }: { id: string, data: LayoutNodeData }) => {
  const { setNodes } = useReactFlow();
  const [platform, setPlatform] = useState(data.platform || 'web');
  const [isExpanded, setIsExpanded] = useState(true);

  const updateField = async (field: string, value: any) => {
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

    // Sync to DB
    await supabase
      .from('canvas_nodes')
      .update({ data_payload: { ...data, [field]: value } as any })
      .eq('id', id);
  };

  const deleteNode = async () => {
    const { error } = await supabase.from('canvas_nodes').delete().eq('id', id);
    if (!error) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      toast.success("Layout eliminado");
    }
  };

  return (
    <div className="group relative w-[300px] rounded-[1.5rem] border border-white/8 bg-[#0f0f12]/90 backdrop-blur-xl shadow-2xl transition-all hover:border-[#ffb800]/30">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 rounded-lg bg-[#ffb800]/10 border border-[#ffb800]/15">
              <Layout className="w-3.5 h-3.5 text-[#ffb800] shrink-0" />
            </div>
            <input 
              value={data.title || ""} 
              onChange={(e) => updateField('title', e.target.value)}
              className="bg-transparent border-none p-0 m-0 text-[10px] font-bold uppercase tracking-widest text-white/50 focus:text-white focus:outline-none w-full truncate transition-all"
              placeholder="Estructura Web"
            />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            onClick={() => (data as any).onExecute?.()}
            className="p-1.5 hover:bg-gradient-to-r from-[#bd00ff] to-[#ff0071] text-white/40 hover:text-white rounded-lg transition-all active:scale-95"
          >
             <Zap className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-white/5 text-slate-500 rounded-xl transition-all">
             {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={deleteNode} className="p-1.5 hover:bg-destructive/10 text-slate-600 hover:text-destructive rounded-xl transition-all">
             <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-5 animate-in fade-in duration-500 bg-[#0a0a0b]/40 backdrop-blur-xl">
          <div className="flex gap-2">
             {[
               { id: 'mobile', icon: Smartphone },
               { id: 'web', icon: Globe },
               { id: 'desktop', icon: Monitor }
             ].map((p) => (
               <button 
                 key={p.id}
                 onClick={() => { setPlatform(p.id as any); updateField('platform', p.id); }}
                 className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${platform === p.id ? 'bg-[#ffb800]/10 border-[#ffb800]/30 text-[#ffb800] shadow-[0_0_15px_rgba(255,184,0,0.1)]' : 'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5'}`}
               >
                 <p.icon className="w-4 w-4" />
                 <span className="text-[9px] font-bold uppercase tracking-widest">{p.id}</span>
               </button>
             ))}
          </div>

          <div className="bg-[#050506] rounded-2xl border border-white/5 p-4 aspect-[16/10] relative group/preview overflow-hidden shadow-inner">
             <div className="absolute inset-x-5 top-4 h-1.5 bg-white/5 rounded-full" />
              <div className="grid grid-cols-2 gap-3 mt-8">
                 <div className="h-10 bg-white/5 shadow-2xl rounded-xl border border-white/5" />
                 <div className="h-10 bg-white/5 shadow-2xl rounded-xl border border-white/5" />
                 <div className="h-12 col-span-2 bg-gradient-to-br from-[#bd00ff]/10 to-[#ff0071]/10 shadow-2xl rounded-xl border border-[#bd00ff]/20 animate-pulse" />
              </div>
          </div>

          <div className="space-y-3">
             <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block text-center">Estructura Base</span>
              <textarea
                 value={data.structure || ""}
                 onChange={(e) => updateField('structure', e.target.value)}
                 className="w-full text-xs leading-relaxed text-white/70 bg-white/[0.02] p-3 rounded-xl border border-white/10 min-h-[80px] focus:outline-none focus:border-[#ffb800]/30 resize-none transition-all font-medium placeholder:text-white/20"
                 placeholder="Hero > Features > Pricing..."
              />
          </div>
        </div>
      )}

      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !-left-1.5 !bg-[#ffb800] !border-2 !border-[#050506]" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !-right-1.5 !bg-[#ffb800] !border-2 !border-[#050506]" />
    </div>
  );
};

export default memo(LayoutBuilderNode);
