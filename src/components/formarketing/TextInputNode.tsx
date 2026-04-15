import { memo, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Type, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NodeConnectionDropdown } from './NodeConnectionDropdown';
import { NodeNextAction } from './NodeNextAction';


interface TextInputNodeData {
  title?: string;
  value?: string;
  onAddConnected?: (sourceId: string, targetType: string) => void;
}

const TextInputNode = ({ id, data }: { id: string; data: TextInputNodeData }) => {
  const { setNodes } = useReactFlow();

  const updateValue = useCallback((val: string) => {
    setNodes((nds) =>
      nds.map((n) => n.id === id ? { ...n, data: { ...n.data, value: val } } : n)
    );
  }, [id, setNodes]);

  const deleteNode = async () => {
    await supabase.from('canvas_nodes').delete().eq('id', id);
    setNodes((nds) => nds.filter((n) => n.id !== id));
    toast.success('Nodo eliminado');
  };

  return (
    <div className="group relative rounded-[2rem] bg-white/90 backdrop-blur-xl border border-zinc-200/60 hover:border-zinc-300 hover:bg-white transition-all w-[260px] shadow-sm hover:shadow-xl duration-500">
      {/* Header */}
      <div className="flex h-12 items-center justify-between px-5 border-b border-zinc-100/80 bg-zinc-50/40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-amber-50 border border-amber-100">
            <Type className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-[10px] font-bold text-zinc-900 tracking-[0.15em] font-sans uppercase">
            {data.title || 'Texto de entrada'}
          </h3>
        </div>
        <button
          onClick={deleteNode}
          className="p-2 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 bg-white">
        <textarea
          value={data.value || ''}
          onChange={(e) => updateValue(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="Escribe tu texto, prompt o instrucción aquí..."
          className="w-full text-xs font-medium leading-relaxed text-zinc-900 bg-white border border-zinc-200 shadow-sm p-3 rounded-2xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/10 transition-all resize-none min-h-[80px] placeholder:text-zinc-400"
        />
        <div className="mt-2 flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-sm" />
          <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-sans">Salida de texto</span>
        </div>
      </div>

      <NodeConnectionDropdown
        nodeType="textInput"
        nodeId={id}
        onAddConnected={data.onAddConnected ?? (() => {})}
      />

      {/* Output handle - visible colored dot with glow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-50">
        <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-md cursor-crosshair hover:scale-125 transition-transform"
             style={{ boxShadow: '0 0 8px rgba(251, 191, 68, 0.6), 0 0 0 2px white' }}>
          <Handle type="source" position={Position.Right} id="text-out" className="!w-full !h-full !opacity-0 !border-0 !bg-transparent" />
        </div>
      </div>
      <NodeNextAction nodeId={id} />
    </div>
  );
};

export default memo(TextInputNode);
