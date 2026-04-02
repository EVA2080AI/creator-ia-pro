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
    <div className="group relative rounded-3xl overflow-hidden bg-card border border-border hover:border-border/80 hover:bg-muted/50 transition-colors w-[280px] shadow-2xl">
      {/* Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-[#8AB4F8]/10 border border-[#8AB4F8]/20">
            <Brain className="w-4 h-4 text-[#8AB4F8]" />
          </div>
          <h3 className="text-[11px] font-bold text-white/90 tracking-wide font-sans uppercase">
            {data.title || 'LLM · Generación'}
          </h3>
        </div>
        <button onClick={deleteNode} className="p-2 hover:bg-rose-500/10 text-white/20 hover:text-rose-500 rounded-lg transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 bg-black/20">
        {/* Model selector */}
        <div className="relative">
          <button
            onClick={() => setModelOpen(!modelOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[10px] text-white/60 hover:border-[#8AB4F8]/30 transition-all"
          >
            <span className="font-bold">{currentModel.name}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${modelOpen ? 'rotate-180' : ''}`} />
          </button>
          {modelOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 overflow-hidden z-50" style={{ background: '#1e2028' }}>
              {LLM_MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => { update({ model: m.id }); setModelOpen(false); }}
                  className="w-full px-3 py-2 text-left text-[10px] text-white/50 hover:bg-white/[0.06] hover:text-white transition-all"
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
          className="w-full text-xs leading-relaxed text-white/60 bg-white/[0.03] border border-white/[0.06] p-3 rounded-xl focus:outline-none focus:border-[#8AB4F8]/40 transition-all resize-none min-h-[56px] placeholder:text-white/15"
        />

        {/* Output preview */}
        {data.output && (
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 max-h-[80px] overflow-y-auto">
            <p className="text-[10px] text-white/50 leading-relaxed whitespace-pre-wrap">{data.output}</p>
          </div>
        )}

        {/* Run button */}
        <button
          onClick={() => (data as any).onExecute?.()}
          disabled={isRunning}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#8AB4F8] text-black text-[11px] font-black uppercase tracking-widest hover:bg-[#8AB4F8]/90 transition-all active:scale-95 disabled:opacity-50"
        >
          {isRunning
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generando...</>
            : <><Play className="w-3.5 h-3.5 fill-current ml-0.5" />Generar</>
          }
        </button>

        {/* Port labels */}
        <div className="flex items-center justify-between text-[9px] text-white/15 uppercase tracking-widest font-sans pt-1">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />Texto entrada</span>
          <span className="flex items-center gap-1">Texto salida<span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" /></span>
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
        className="!w-4 !h-4 !-left-2 !bg-yellow-400 !border-2 !border-[#0f1011] hover:!scale-125 transition-transform cursor-crosshair"
      />
      {/* Output handle — text (yellow) */}
      <Handle
        type="source"
        position={Position.Right}
        id="text-out"
        className="!w-4 !h-4 !-right-2 !bg-yellow-400 !border-2 !border-[#0f1011] hover:!scale-125 transition-transform cursor-crosshair"
      />
    </div>
  );
};

export default memo(LLMNode);
