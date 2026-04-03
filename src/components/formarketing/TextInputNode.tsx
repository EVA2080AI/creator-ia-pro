import { memo, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Type, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NodeConnectionDropdown } from './NodeConnectionDropdown';

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
    <div className="group relative rounded-3xl overflow-hidden bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 transition-colors w-[260px] shadow-sm hover:shadow-md">
      {/* Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-amber-50 border border-amber-100">
            <Type className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-[11px] font-bold text-zinc-900 tracking-wide font-sans uppercase">
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

      {/* Output handle — text (yellow) */}
      <Handle
        type="source"
        position={Position.Right}
        id="text-out"
        className="!w-4 !h-4 !-right-2 !bg-amber-400 !border-2 !border-white hover:!scale-125 transition-transform cursor-crosshair shadow-sm"
      />
    </div>
  );
};

export default memo(TextInputNode);
