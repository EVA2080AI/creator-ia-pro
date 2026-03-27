import { memo, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Layout, Trash2, Globe, Smartphone, Monitor, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LayoutNodeData {
  title?: string;
  platform?: 'mobile' | 'web' | 'desktop';
  structure?: string;
  model?: string;
  status?: 'idle' | 'executing' | 'ready' | 'error';
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
    <div className={`group relative rounded-2xl border border-white/5 bg-[#0a0a0b] backdrop-blur-xl w-[270px] shadow-2xl transition-all duration-300 hover:border-white/20
      ${data.status === 'executing' ? 'border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.05)] animate-pulse' : ''}
    `}>
      {/* Nexus V3 Industrial Header */}
      <div className="flex h-10 items-center justify-between px-3 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-1 rounded-lg bg-white/5 border border-white/10">
              <Layout className="w-3.5 h-3.5 text-white/50 shrink-0" />
            </div>
            <input 
              value={data.title || ""} 
              onChange={(e) => updateField('title', e.target.value)}
              className="bg-transparent border-none p-0 m-0 text-[10px] font-bold text-white/90 focus:outline-none w-full truncate uppercase tracking-tight transition-all"
              placeholder="STRUCTURE_ID"
            />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={() => (data as any).onExecute?.()}
            className="p-1.5 hover:bg-white/5 text-slate-600 hover:text-white rounded-lg transition-all active:scale-95"
          >
             <Zap className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-white/5 text-slate-500 rounded-xl transition-all">
             {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={deleteNode} className="p-1.5 hover:bg-destructive/5 text-destructive/30 hover:text-destructive rounded-xl transition-all">
             <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 animate-in fade-in duration-500 bg-white/[0.01]">
          <div className="flex gap-1.5">
             {[
               { id: 'mobile', icon: Smartphone },
               { id: 'web', icon: Globe },
               { id: 'desktop', icon: Monitor }
             ].map((p) => (
               <button 
                 key={p.id}
                 onClick={() => { setPlatform(p.id as any); updateField('platform', p.id); }}
                 className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${platform === p.id ? 'bg-white/10 border-white/20 text-white shadow-xl' : 'bg-white/[0.02] border-white/5 text-white/20 hover:bg-white/5'}`}
               >
                 <p.icon className="w-3.5 h-3.5" />
                 <span className="text-[8px] font-bold uppercase tracking-widest">{p.id}</span>
               </button>
             ))}
          </div>

          {/* Preview: show structure if ready, otherwise show wireframe placeholder */}
          <div className="bg-[#050506] rounded-2xl border border-white/5 aspect-[16/10] relative overflow-hidden shadow-inner">
            {data.structure && data.status === 'ready' ? (
              <div className="p-3 h-full overflow-hidden">
                <div className="flex items-center gap-1 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Vista previa generada</span>
                </div>
                {/* Render parsed structure sections */}
                <div className="space-y-1.5">
                  {data.structure.split(/[>|\n,]/).filter(Boolean).slice(0, 5).map((section: string, i: number) => (
                    <div key={i} className={`h-4 rounded-md flex items-center px-2 ${i === 0 ? 'bg-aether-purple/20 border border-aether-purple/20 w-full' : i % 2 === 0 ? 'bg-white/5 border border-white/5 w-3/4' : 'bg-white/[0.03] border border-white/5 w-full'}`}>
                      <span className="text-[7px] text-white/30 truncate capitalize">{section.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 flex flex-col justify-center h-full">
                <div className="absolute inset-x-4 top-3 h-1 bg-white/5 rounded-full" />
                <div className="grid grid-cols-2 gap-2 mt-4 px-1">
                  <div className="h-8 bg-white/5 rounded-lg border border-white/5" />
                  <div className="h-8 bg-white/5 rounded-lg border border-white/5" />
                  <div className="h-10 col-span-2 bg-white/10 rounded-lg border border-white/20 animate-pulse" />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/5 space-y-1.5">
            <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em] px-1 text-center block">Motor de diseño</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'claude-3.5-sonnet', name: 'claude_v3' },
                { id: 'deepseek-chat', name: 'deepseek_v3' },
                { id: 'gemini-3.1-pro-low', name: 'gemini_v1' },
                { id: 'gpt-oss-120b', name: 'llama_maverick' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => updateField('model', m.id)}
                  className={`px-2 py-1.5 rounded-lg border text-[8px] font-bold lowercase tracking-wider transition-all ${
                    (data.model || 'claude-3.5-sonnet') === m.id 
                    ? 'bg-white/10 border-white/20 text-white' 
                    : 'bg-white/5 border-white/5 text-white/20 hover:bg-white/10'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
             <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest block px-1">Estructura</span>
              <textarea
                 value={data.structure || ""}
                 onChange={(e) => updateField('structure', e.target.value)}
                 className="w-full text-[10px] leading-relaxed text-white/50 bg-white/[0.02] p-2.5 rounded-xl border border-white/5 min-h-[70px] focus:outline-none focus:border-white/20 resize-none transition-all font-medium placeholder:text-white/10"
                 placeholder="Hero > Características > Precios..."
              />
          </div>
        </div>
      )}

      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !-left-1 !bg-white/40 !border-2 !border-[#050506]" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !-right-1 !bg-white !border-2 !border-[#050506]" />
    </div>
  );
};

export default memo(LayoutBuilderNode);
