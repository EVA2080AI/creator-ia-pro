import { memo, useCallback, useState } from 'react';
import { Position, useReactFlow } from '@xyflow/react';
import { Brain, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BaseNode from './BaseNode';
import { NODE_META } from './nodeConnections';

interface LLMNodeData {
  title?: string;
  systemPrompt?: string;
  model?: string;
  output?: string;
  status?: 'idle' | 'running' | 'done' | 'error' | 'bypassed';
  onExecute?: () => void;
  collapsed?: boolean;
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

  const handleToggleBypass = () => {
    const newStatus = data.status === 'bypassed' ? 'idle' : 'bypassed';
    update({ status: newStatus });
    toast.success(newStatus === 'bypassed' ? 'Nodo desactivado (bypass)' : 'Nodo reactivado');
  };

  const handleToggleCollapsed = () => {
    update({ collapsed: !data.collapsed });
  };

  const currentModel = LLM_MODELS.find(m => m.id === (data.model || LLM_MODELS[0].id)) ?? LLM_MODELS[0];

  return (
    <BaseNode
      nodeId={id}
      type="llmNode"
      title={data.title}
      status={data.status}
      onDelete={deleteNode}
      onExecute={data.onExecute}
      outputData={data.output}
      outputType="text"
      defaultCollapsed={data.collapsed}
      onToggleCollapsed={handleToggleCollapsed}
      onToggleBypass={handleToggleBypass}
    >
      <div className="space-y-3">
        {/* Model selector */}
        <div className="relative">
          <button
            onClick={() => setModelOpen(!modelOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-zinc-200 shadow-sm text-[11px] text-zinc-700 hover:border-blue-300 transition-all"
          >
            <span className="font-semibold">{currentModel.name}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${modelOpen ? 'rotate-180' : ''}`} />
          </button>
          {modelOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-zinc-200 overflow-hidden z-50 bg-white shadow-lg">
              {LLM_MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => { update({ model: m.id }); setModelOpen(false); }}
                  className="w-full px-3 py-2.5 text-left text-[11px] text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all"
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
          className="w-full text-xs leading-relaxed text-zinc-900 bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none min-h-[60px] placeholder:text-zinc-400"
        />

        </div>
    </BaseNode>
  );
};

export default memo(LLMNode);
