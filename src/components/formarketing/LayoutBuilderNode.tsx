import { memo, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Layout, Trash2, Globe, Smartphone, Monitor, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NodeConnectionDropdown } from './NodeConnectionDropdown';
import { NodeNextAction } from './NodeNextAction';


interface LayoutNodeData {
  title?: string;
  platform?: 'mobile' | 'web' | 'desktop';
  structure?: string;
  model?: string;
  status?: 'idle' | 'executing' | 'ready' | 'error';
  onAddConnected?: (sourceId: string, targetType: string) => void;
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
    <div className={`group relative rounded-[2rem] border bg-white/90 backdrop-blur-xl w-[270px] shadow-sm transition-all duration-300 hover:shadow-xl
      ${data.status === 'executing' ? 'border-primary ring-2 ring-primary/20 shadow-xl animate-pulse' : 'border-zinc-200/60 hover:border-zinc-300'}
    `}>
      {/* Nexus V3 Industrial Header */}
      <div className="flex h-12 items-center justify-between px-5 border-b border-zinc-100/80 bg-zinc-50/40">
        <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-1 rounded-lg bg-emerald-50 border border-emerald-100">
              <Layout className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            </div>
            <input 
              value={data.title || ""} 
              onChange={(e) => updateField('title', e.target.value)}
              className="bg-transparent border-none p-0 m-0 text-[10px] font-bold text-zinc-900 focus:outline-none w-full truncate uppercase tracking-[0.15em] transition-all placeholder:text-zinc-400"
              placeholder="STRUCTURE_ID"
            />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={() => (data as any).onExecute?.()}
            className="p-1.5 hover:bg-zinc-100 text-zinc-400 hover:text-emerald-500 rounded-lg transition-all active:scale-95"
          >
             <Zap className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-zinc-100 text-zinc-400 rounded-xl transition-all">
             {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={deleteNode} className="p-1.5 hover:bg-red-50 text-red-300 hover:text-red-500 rounded-xl transition-all">
             <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 animate-in fade-in duration-500 bg-white rounded-b-2xl">
          <div className="flex gap-1.5">
             {[
               { id: 'mobile', icon: Smartphone },
               { id: 'web', icon: Globe },
               { id: 'desktop', icon: Monitor }
             ].map((p) => (
               <button 
                 key={p.id}
                 onClick={() => { setPlatform(p.id as any); updateField('platform', p.id); }}
                 className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${platform === p.id ? 'bg-zinc-900 border-zinc-900 text-white shadow-sm' : 'bg-white border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'}`}
               >
                 <p.icon className="w-3.5 h-3.5" />
                 <span className="text-[8px] font-bold uppercase tracking-widest">{p.id}</span>
               </button>
             ))}
          </div>

          {/* Preview: show structure if ready, otherwise show wireframe placeholder */}
          <div className="bg-zinc-50 rounded-2xl border border-zinc-200 aspect-[16/10] relative overflow-hidden shadow-sm">
            {data.structure && data.status === 'ready' ? (
              <div className="p-3 h-full overflow-hidden">
                <div className="flex items-center gap-1 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Vista previa generada</span>
                </div>
                {/* Render parsed structure sections */}
                <div className="space-y-1.5">
                  {data.structure.split(/[>|\n,]/).filter(Boolean).slice(0, 5).map((section: string, i: number) => (
                    <div key={i} className={`h-4 rounded-md flex items-center px-2 ${i === 0 ? 'bg-emerald-50 border border-emerald-100 w-full' : i % 2 === 0 ? 'bg-white border border-zinc-200 w-3/4 shadow-sm' : 'bg-zinc-100 border border-zinc-200 w-full shadow-sm'}`}>
                      <span className="text-[7px] text-zinc-500 truncate capitalize">{section.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 flex flex-col justify-center h-full">
                <div className="absolute inset-x-4 top-3 h-1 bg-zinc-200 rounded-full" />
                <div className="grid grid-cols-2 gap-2 mt-4 px-1">
                  <div className="h-8 bg-white shadow-sm rounded-lg border border-zinc-200" />
                  <div className="h-8 bg-white shadow-sm rounded-lg border border-zinc-200" />
                  <div className="h-10 col-span-2 bg-emerald-50 rounded-lg border border-emerald-100 animate-pulse" />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-100 space-y-1.5">
            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1 text-center block">Motor de diseño</span>
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
                    ? 'bg-zinc-900 border-zinc-900 text-white shadow-sm' 
                    : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
             <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block px-1">Estructura</span>
              <textarea
                 value={data.structure || ""}
                 onChange={(e) => updateField('structure', e.target.value)}
                 className="w-full text-[10px] leading-relaxed text-zinc-900 bg-white p-2.5 rounded-xl border border-zinc-200 min-h-[70px] focus:outline-none focus:border-zinc-300 focus:ring-2 focus:ring-primary/10 resize-none transition-all font-medium placeholder:text-zinc-400"
                 placeholder="Hero > Características > Precios..."
              />
          </div>
        </div>
      )}

      {/* Input handle - visible colored dot with glow */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-50">
        <div className="w-4 h-4 rounded-full bg-zinc-400 border-2 border-white shadow-md cursor-crosshair hover:scale-125 transition-transform"
             style={{ boxShadow: '0 0 8px rgba(156, 163, 175, 0.6), 0 0 0 2px white' }}>
          <Handle type="target" position={Position.Left} id="any-in" className="!w-full !h-full !opacity-0 !border-0 !bg-transparent" />
        </div>
      </div>

      {/* Output handle - visible colored dot with glow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-50">
        <div className="w-4 h-4 rounded-full bg-blue-400 border-2 border-white shadow-md cursor-crosshair hover:scale-125 transition-transform"
             style={{ boxShadow: '0 0 8px rgba(96, 165, 250, 0.6), 0 0 0 2px white' }}>
          <Handle type="source" position={Position.Right} id="ui-out" className="!w-full !h-full !opacity-0 !border-0 !bg-transparent" />
        </div>
      </div>
      <NodeNextAction nodeId={id} />
    </div>

  );
};

export default memo(LayoutBuilderNode);
