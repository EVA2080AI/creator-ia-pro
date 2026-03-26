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
    <div className="group relative rounded-[2rem] border border-white/10 bg-black/50 backdrop-blur-3xl w-[300px] animate-in zoom-in duration-300 nodrag shadow-2xl transition-all hover:border-[#ff0071]/50">
      {/* V6.2 Pulse Header */}
      {/* V7.0 Industrial Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 rounded-lg bg-[#ff0071]/10">
              <Layout className="w-3.5 h-3.5 text-[#ff0071] shrink-0" />
            </div>
            <input 
              value={data.title || ""} 
              onChange={(e) => updateField('title', e.target.value)}
              className="bg-transparent border-none p-0 m-0 text-[10px] font-black lowercase tracking-widest text-white focus:outline-none w-full truncate transition-all"
              placeholder="nexus_layout_v7"
            />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            onClick={() => (data as any).onExecute?.()}
            className="p-1.5 hover:bg-[#ff0071]/20 text-[#ff0071] rounded-xl transition-all active:scale-95 shadow-lg shadow-[#ff0071]/10"
          >
             <Zap className="w-3.5 h-3.5 font-black" />
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
                 className={`flex-1 flex flex-col items-center gap-2.5 p-4 rounded-3xl border transition-all ${platform === p.id ? 'bg-[#ff0071]/10 border-[#ff0071]/30 text-[#ff0071] shadow-[0_0_20px_rgba(255,0,113,0.1)]' : 'bg-white/[0.02] border-white/5 text-slate-600 hover:bg-white/5'}`}
               >
                 <p.icon className="w-4 h-4" />
                 <span className="text-[10px] font-black lowercase tracking-[0.2em]">{p.id}</span>
               </button>
             ))}
          </div>

          <div className="bg-white/[0.02] rounded-3xl border border-white/5 p-5 aspect-[16/10] relative group/preview overflow-hidden shadow-inner">
             <div className="absolute inset-x-5 top-4 h-2 bg-white/5 rounded-full" />
             <div className="grid grid-cols-2 gap-4 mt-10">
                <div className="h-12 bg-white/5 shadow-2xl rounded-2xl border border-white/5 animate-pulse" />
                <div className="h-12 bg-white/5 shadow-2xl rounded-2xl border border-white/5 animate-pulse" />
                <div className="h-16 col-span-2 bg-[#ff0071]/5 shadow-2xl rounded-2xl border border-[#ff0071]/10 animate-pulse" />
             </div>
          </div>

          <div className="space-y-3">
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block text-center">nexus_logic_structure</span>
             <textarea
                value={data.structure || ""}
                onChange={(e) => updateField('structure', e.target.value)}
                className="w-full text-xs leading-relaxed text-slate-300 bg-white/5 p-4 rounded-3xl border border-white/5 min-h-[80px] focus:outline-none focus:border-[#ff0071]/30 resize-none transition-all font-bold placeholder:text-slate-800"
                placeholder="metadata sequence..."
             />
          </div>
        </div>
      )}

      <Handle type="target" position={Position.Left} className="!w-4 !h-4 !-left-2 !bg-slate-800 !border-4 !border-[#0a0a0b] !shadow-2xl !z-20 hover:scale-125 transition-transform" />
      <Handle type="source" position={Position.Right} className="!w-4 !h-4 !-right-2 !bg-[#ff0071] !border-4 !border-[#0a0a0b] !shadow-2xl !z-20 hover:scale-125 transition-transform" />
    </div>
  );
};

export default memo(LayoutBuilderNode);
