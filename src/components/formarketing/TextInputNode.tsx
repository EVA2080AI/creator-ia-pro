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
    <div className="group relative rounded-3xl overflow-hidden aether-card w-[260px] shadow-2xl">
      {/* Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <Type className="w-4 h-4 text-yellow-400" />
          </div>
          <h3 className="text-[11px] font-bold text-white/90 tracking-wide font-sans uppercase">
            {data.title || 'Texto de entrada'}
          </h3>
        </div>
        <button
          onClick={deleteNode}
          className="p-2 hover:bg-rose-500/10 text-white/20 hover:text-rose-500 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 bg-black/20">
        <textarea
          value={data.value || ''}
          onChange={(e) => updateValue(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="Escribe tu texto, prompt o instrucción aquí..."
          className="w-full text-xs font-medium leading-relaxed text-white/80 bg-white/[0.03] border border-white/[0.08] p-3 rounded-2xl focus:outline-none focus:border-yellow-400/40 transition-all resize-none min-h-[80px] placeholder:text-white/15"
        />
        <div className="mt-2 flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
          <span className="text-[9px] text-white/20 uppercase tracking-widest font-sans">Salida de texto</span>
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
        className="!w-3 !h-3 !-right-1.5 !bg-yellow-400 !border-2 !border-[#191a1f] hover:scale-125 transition-transform"
      />
    </div>
  );
};

export default memo(TextInputNode);
