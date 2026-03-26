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
    <div className="group relative bg-[#0f0f0f]/90 border border-white/10 rounded-[2.5rem] p-0 w-80 shadow-2xl backdrop-blur-3xl overflow-hidden animate-in fade-in zoom-in duration-500 isolation-auto">
      {/* V5.3 Industrial Header */}
      <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-r from-blue-500/10 to-transparent flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2.5 rounded-2xl shadow-inner group-hover:rotate-6 transition-transform">
               <Layout className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <input 
                value={data.title || ""} 
                onChange={(e) => updateField('title', e.target.value)}
                className="bg-transparent border-none p-0 m-0 text-xs font-black uppercase tracking-tighter text-foreground focus:outline-none w-40"
                placeholder="APP/WEB LAYOUT"
              />
              <span className="text-[9px] font-black text-blue-500/50 uppercase tracking-[0.2em] mt-0.5">V5.3 Industrial Builder</span>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
              onClick={() => (data as any).onExecute?.()}
              className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 transition-all group/exec active:scale-95"
            >
               <Zap className="w-4 h-4 group-hover/exec:scale-110 transition-transform" />
            </button>
            <button onClick={deleteNode} className="opacity-0 group-hover:opacity-100 p-2.5 hover:bg-destructive/10 text-destructive rounded-xl transition-all">
               <Trash2 className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Platform Selector */}
        <div className="flex gap-2">
           {[
             { id: 'mobile', icon: Smartphone },
             { id: 'web', icon: Globe },
             { id: 'desktop', icon: Monitor }
           ].map((p) => (
             <button 
               key={p.id}
               onClick={() => { setPlatform(p.id as any); updateField('platform', p.id); }}
               className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${platform === p.id ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/10' : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10'}`}
             >
               <p.icon className="w-4 h-4" />
               <span className="text-[8px] font-black uppercase tracking-widest">{p.id}</span>
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
        <div className="space-y-2">
           <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest px-1">Estructura del Sitio/App</span>
           <textarea
              value={data.structure || ""}
              onChange={(e) => updateField('structure', e.target.value)}
              className="w-full text-[11px] leading-relaxed text-foreground/70 bg-black/40 p-4 rounded-[1.5rem] border border-white/5 min-h-[100px] focus:outline-none focus:border-blue-500/30 resize-none transition-all"
              placeholder="Ej: Landing page de una app de café con sección de menú y reserva..."
           />
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="w-5 h-5 -left-2.5 bg-blue-500 border-[6px] border-[#0a0a0a] shadow-xl !z-20" />
      <Handle type="source" position={Position.Right} className="w-5 h-5 -right-2.5 bg-blue-500 border-[6px] border-[#0a0a0a] shadow-xl !z-20" />
    </div>
  );
};

export default memo(LayoutBuilderNode);
