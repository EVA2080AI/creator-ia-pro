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
    <div className="group relative pulse-node w-[280px] animate-in zoom-in duration-200 nodrag shadow-xl">
      {/* V6.2 Pulse Header */}
      <div className="pulse-node-header justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
            <Layout className="w-4 h-4 text-[#ff0071] shrink-0" />
            <input 
              value={data.title || ""} 
              onChange={(e) => updateField('title', e.target.value)}
              className="bg-transparent border-none p-0 m-0 text-[11px] font-bold lowercase tracking-tight text-slate-800 focus:outline-none w-full truncate"
              placeholder="structure hub"
            />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={() => (data as any).onExecute?.()}
            className="p-1 hover:bg-[#ff0071]/10 text-[#ff0071] rounded-md transition-all active:scale-95"
          >
             <Zap className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-slate-100 text-slate-400 rounded-md transition-all">
             {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={deleteNode} className="p-1 hover:bg-destructive/5 text-destructive/30 hover:text-destructive rounded-md transition-all">
             <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200 bg-white">
          <div className="flex gap-2">
             {[
               { id: 'mobile', icon: Smartphone },
               { id: 'web', icon: Globe },
               { id: 'desktop', icon: Monitor }
             ].map((p) => (
               <button 
                 key={p.id}
                 onClick={() => { setPlatform(p.id as any); updateField('platform', p.id); }}
                 className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${platform === p.id ? 'bg-[#ff0071]/[0.03] border-[#ff0071]/30 text-[#ff0071] shadow-sm' : 'bg-slate-50/50 border-slate-100 text-slate-400 hover:bg-slate-50'}`}
               >
                 <p.icon className="w-3.5 h-3.5" />
                 <span className="text-[9px] font-bold lowercase tracking-tight">{p.id}</span>
               </button>
             ))}
          </div>

          <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 aspect-[16/10] relative group/preview overflow-hidden">
             <div className="absolute inset-x-4 top-3 h-1.5 bg-slate-200/50 rounded-full" />
             <div className="grid grid-cols-2 gap-3 mt-8">
                <div className="h-10 bg-white shadow-sm rounded-xl border border-slate-100 animate-pulse" />
                <div className="h-10 bg-white shadow-sm rounded-xl border border-slate-100 animate-pulse" />
                <div className="h-14 col-span-2 bg-white shadow-sm rounded-xl border border-slate-100 animate-pulse" />
             </div>
          </div>

          <div className="space-y-1.5">
             <span className="text-[10px] font-bold text-slate-400 lowercase tracking-tight px-1 text-center block">structure engine</span>
             <textarea
                value={data.structure || ""}
                onChange={(e) => updateField('structure', e.target.value)}
                className="w-full text-xs leading-relaxed text-slate-600 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 min-h-[60px] focus:outline-none focus:border-[#ff0071]/20 resize-none transition-all"
                placeholder="metadata..."
             />
          </div>
        </div>
      )}

      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !-left-1.5 !bg-slate-300 !border-2 !border-white !shadow-sm !z-20" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !-left-1.5 !bg-slate-300 !border-2 !border-white !shadow-sm !z-20" />
    </div>
  );
};

export default memo(LayoutBuilderNode);
