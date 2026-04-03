import { memo, useCallback, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Brain, Trash2, Play, Loader2, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NodeConnectionDropdown } from './NodeConnectionDropdown';

interface LLMNodeData {
  title?: string;
  systemPrompt?: string;
  model?: string;
  output?: string;
  status?: 'idle' | 'running' | 'done' | 'error';
  onExecute?: () => void;
  onAddConnected?: (sourceId: string, targetType: string) => void;
}

const LLM_MODELS = [
  { id: 'anthropic/claude-sonnet-4-5',      name: 'Claude Sonnet 4.5' },
  { id: 'openai/gpt-4o',                    name: 'GPT-4o' },
  { id: 'deepseek/deepseek-chat',           name: 'DeepSeek V3' },
  { id: 'google/gemini-2.5-flash-preview',  name: 'Gemini 2.5 Flash' },
];

const LLMNode = ({ id, data }: { id: string; data: LLMNodeData }) => {
  const { setNodes } = useReactFlow();
  const [modelOpen, setModelOpen] = useState(false);

  const update = useCallback((patch: Partial<LLMNodeData>) => {
    setNodes((nds) =>
      nds.map((n) => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)
    );
  }, [id, setNodes]);

  const deleteNode = async () => {
    await supabase.from('canvas_nodes').delete().eq('id', id);
    setNodes((nds) => nds.filter((n) => n.id !== id));
    toast.success('Nodo eliminado');
  };

  const currentModel = LLM_MODELS.find(m => m.id === (data.model || LLM_MODELS[0].id)) ?? LLM_MODELS[0];
  const isRunning = data.status === 'running';

  return (
    <div className="group relative rounded-3xl overflow-hidden bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 transition-colors w-[280px] shadow-sm hover:shadow-md">
      {/* Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-blue-50 border border-blue-100">
            <Brain className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-[11px] font-bold text-zinc-900 tracking-wide font-sans uppercase">
            {data.title || 'LLM · Generación'}
          </h3>
        </div>
        <button onClick={deleteNode} className="p-2 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-lg transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 bg-white">
        {/* Model selector */}
        <div className="relative">
          <button
            onClick={() => setModelOpen(!modelOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-zinc-200 shadow-sm text-[10px] text-zinc-600 hover:border-blue-300 transition-all"
          >
            <span className="font-bold">{currentModel.name}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${modelOpen ? 'rotate-180' : ''}`} />
          </button>
          {modelOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-zinc-200 overflow-hidden z-50 bg-white shadow-lg">
              {LLM_MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => { update({ model: m.id }); setModelOpen(false); }}
                  className="w-full px-3 py-2 text-left text-[10px] text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all"
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* System prompt */}
        <textarea
          value={data.systemPrompt || ''}
          onChange={(e) => update({ systemPrompt: e.target.value })}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="Instrucción al modelo (opcional)..."
          className="w-full text-xs leading-relaxed text-zinc-900 bg-white border border-zinc-200 shadow-sm p-3 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none min-h-[56px] placeholder:text-zinc-400"
        />

        {/* Output preview */}
        {data.output && (
          <div className="rounded-xl bg-zinc-50 border border-zinc-200 shadow-sm p-3 max-h-[80px] overflow-y-auto">
            <p className="text-[10px] text-zinc-600 leading-relaxed whitespace-pre-wrap">{data.output}</p>
          </div>
        )}

        {/* Run button */}
        <button
          onClick={() => (data as any).onExecute?.()}
          disabled={isRunning}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          {isRunning
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generando...</>
            : <><Play className="w-3.5 h-3.5 fill-current ml-0.5" />Generar</>
          }
        </button>

        {/* Port labels */}
        <div className="flex items-center justify-between text-[9px] text-zinc-400 uppercase tracking-widest font-sans pt-1">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shadow-sm" />Texto entrada</span>
          <span className="flex items-center gap-1">Texto salida<span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shadow-sm" /></span>
        </div>
      </div>

      <NodeConnectionDropdown
        nodeType="llmNode"
        nodeId={id}
        onAddConnected={data.onAddConnected ?? (() => {})}
      />

      {/* Input handle — text (yellow) */}
      <Handle
        type="target"
        position={Position.Left}
        id="text-in"
        className="!w-4 !h-4 !-left-2 !bg-amber-400 !border-2 !border-white hover:!scale-125 transition-transform cursor-crosshair shadow-sm"
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

export default memo(LLMNode);
