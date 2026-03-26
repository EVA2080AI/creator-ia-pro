import { memo, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Layout, Trash2, Globe, Smartphone, Monitor, Zap } from 'lucide-react';
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
    <div className="group relative bg-[#0f0f0f]/95 border border-white/5 rounded-[1.5rem] p-0 w-[300px] shadow-2xl backdrop-blur-3xl overflow-hidden animate-in fade-in zoom-in duration-300 isolation-auto">
      {/* V5.3 Industrial Header */}
      <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-blue-500/10 to-transparent flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
            <div className="bg-blue-500/20 p-2 rounded-xl shadow-inner group-hover:rotate-6 transition-transform">
               <Layout className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <input 
                value={data.title || ""} 
                onChange={(e) => updateField('title', e.target.value)}
                className="bg-transparent border-none p-0 m-0 text-[10px] font-black uppercase tracking-tighter text-foreground/90 focus:outline-none w-32"
                placeholder="APP/WEB LAYOUT"
              />
              <span className="text-[8px] font-black text-blue-500/40 uppercase tracking-[0.2em] mt-1">V5.4 COMPACT BUILDER</span>
            </div>
        </div>
        <div className="flex items-center gap-1.5 font-bold">
            <button 
              onClick={() => (data as any).onExecute?.()}
              className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 transition-all group/exec active:scale-95"
            >
               <Zap className="w-3.5 h-3.5 group-hover/exec:scale-110 transition-transform" />
            </button>
            <button onClick={deleteNode} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-all">
               <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Platform Selector */}
        <div className="flex gap-1.5">
           {[
             { id: 'mobile', icon: Smartphone },
             { id: 'web', icon: Globe },
             { id: 'desktop', icon: Monitor }
           ].map((p) => (
             <button 
               key={p.id}
               onClick={() => { setPlatform(p.id as any); updateField('platform', p.id); }}
               className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${platform === p.id ? 'bg-blue-500/20 border-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10' : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10'}`}
             >
               <p.icon className="w-3.5 h-3.5" />
               <span className="text-[7px] font-black uppercase tracking-widest">{p.id}</span>
             </button>
           ))}
        </div>

        {/* Wireframe Preview Area */}
        <div className="bg-black/40 rounded-3xl border border-white/5 p-4 aspect-[4/3] relative group/preview overflow-hidden">
           <div className="absolute inset-x-4 top-4 h-2 bg-white/10 rounded-full" />
           <div className="grid grid-cols-2 gap-3 mt-8">
              <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
              <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
              <div className="h-24 col-span-2 bg-white/5 rounded-2xl animate-pulse" />
           </div>
           
           <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[10px] font-black text-blue-400 bg-black/80 px-4 py-2 rounded-full border border-blue-500/30 backdrop-blur-md uppercase tracking-[0.2em]">
                 Diseño Generativo AI
              </span>
           </div>
        </div>

        {/* Structure Input */}
        <div className="space-y-1.5">
           <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest px-1 font-mono">Structure Engine</span>
           <textarea
              value={data.structure || ""}
              onChange={(e) => updateField('structure', e.target.value)}
              className="w-full text-[10px] leading-relaxed text-foreground/60 bg-black/40 p-3 rounded-xl border border-white/5 min-h-[80px] focus:outline-none focus:border-blue-500/20 resize-none transition-all"
              placeholder="Estructura..."
           />
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="w-5 h-5 -left-2.5 bg-blue-500 border-[6px] border-[#0a0a0a] shadow-xl !z-20" />
      <Handle type="source" position={Position.Right} className="w-5 h-5 -right-2.5 bg-blue-500 border-[6px] border-[#0a0a0a] shadow-xl !z-20" />
    </div>
  );
};

export default memo(LayoutBuilderNode);
