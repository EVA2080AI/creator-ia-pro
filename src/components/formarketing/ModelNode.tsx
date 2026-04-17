import { memo, useCallback, useState, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Image as ImageIcon, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BaseNode from './BaseNode';

const RATIOS = [
  { id: '1:1', label: '1:1', desc: 'Instagram' },
  { id: '9:16', label: '9:16', desc: 'Story/Reel' },
  { id: '16:9', label: '16:9', desc: 'YouTube' },
  { id: '4:5', label: '4:5', desc: 'Feed' },
];

interface ModelNodeData {
  title?: string;
  prompt?: string;
  model?: string;
  assetUrl?: string;
  ratio?: string;
  imageHistory?: string[];
  status?: 'idle' | 'loading' | 'executing' | 'ready' | 'error' | 'bypassed';
  collapsed?: boolean;
}

const IMAGE_STEPS = [
  'Preparando prompt…',
  'Enviando a modelo…',
  'Sintetizando imagen…',
  'Finalizando…',
];

const ModelNode = ({ id, data }: { id: string; data: ModelNodeData }) => {
  const { setNodes } = useReactFlow();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (data.status !== 'executing') {
      setStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, IMAGE_STEPS.length - 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [data.status]);

  const updatePrompt = useCallback(
    (val: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: { ...node.data, prompt: val },
            };
          }
          return node;
        })
      );
    },
    [id, setNodes]
  );

  const persistChange = async (
    val: string,
    field: 'prompt' | 'model' | 'ratio' = 'prompt'
  ) => {
    const updateData =
      field === 'prompt'
        ? { prompt: val, data_payload: { ...data, prompt: val } as any }
        : { data_payload: { ...data, [field]: val } as any };

    const { error } = await supabase
      .from('canvas_nodes')
      .update(updateData)
      .eq('id', id);

    if (error) console.error(`Error syncing model ${field}:`, error);
  };

  const updateRatio = useCallback(
    (val: string) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, ratio: val } }
            : node
        )
      );
      persistChange(val, 'ratio');
    },
    [id, setNodes]
  );

  useEffect(() => {
    if (!data.assetUrl) return;
    const history = data.imageHistory || [];
    if (history[0] === data.assetUrl) return;
    const next = [data.assetUrl, ...history].slice(0, 3);
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, imageHistory: next } } : n
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.assetUrl]);

  const deleteNode = async () => {
    const { error } = await supabase
      .from('canvas_nodes')
      .delete()
      .eq('id', id);
    if (!error) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      toast.success('Nodo eliminado');
    }
  };

  const handleToggleBypass = () => {
    const newStatus = data.status === 'bypassed' ? 'idle' : 'bypassed';
    const updateData: any = { data_payload: { ...data, status: newStatus } };
    supabase.from('canvas_nodes').update(updateData).eq('id', id).then(() => {
      setNodes((nds) =>
        nds.map((n) => n.id === id ? { ...n, data: { ...n.data, status: newStatus } } : n)
      );
      toast.success(newStatus === 'bypassed' ? 'Nodo desactivado (bypass)' : 'Nodo reactivado');
    });
  };

  const handleToggleCollapsed = () => {
    const newCollapsed = !data.collapsed;
    setNodes((nds) =>
      nds.map((n) => n.id === id ? { ...n, data: { ...n.data, collapsed: newCollapsed } } : n)
    );
  };

  const isExecuting = data.status === 'executing';

  return (
    <BaseNode
      nodeId={id}
      type="modelView"
      title={data.title}
      status={data.status}
      onDelete={deleteNode}
      defaultCollapsed={data.collapsed}
      onToggleCollapsed={handleToggleCollapsed}
      onToggleBypass={handleToggleBypass}
    >
      <div className="space-y-3">
        {/* Prompt input */}
        <textarea
          value={data.prompt || ''}
          onChange={(e) => updatePrompt(e.target.value)}
          onBlur={(e) => persistChange(e.target.value)}
          placeholder="Describe la imagen que quieres generar..."
          className="w-full text-xs leading-relaxed text-zinc-900 bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 transition-all resize-none min-h-[60px] placeholder:text-zinc-400"
        />

        {/* Ratio selector */}
        <div className="flex gap-1">
          {RATIOS.map((ratio) => (
            <button
              key={ratio.id}
              onClick={() => updateRatio(ratio.id)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-medium transition-all ${
                data.ratio === ratio.id
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
              }`}
              title={ratio.desc}
            >
              {ratio.label}
            </button>
          ))}
        </div>

        {/* Image preview */}
        <div className="aspect-square bg-zinc-50 rounded-xl border border-zinc-200 overflow-hidden flex items-center justify-center relative group">
          {data.assetUrl ? (
            <>
              <img
                src={data.assetUrl}
                alt="Generated"
                className="w-full h-full object-cover"
              />
              {data.imageHistory && data.imageHistory.length > 1 && (
                <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                  {data.imageHistory.slice(0, 3).map((img, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === id
                              ? { ...n, data: { ...n.data, assetUrl: img } }
                              : n
                          )
                        )
                      }
                      className={`flex-1 h-1 rounded-full transition-colors ${
                        data.assetUrl === img
                          ? 'bg-white'
                          : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : isExecuting ? (
            <div className="flex flex-col items-center gap-2 text-center p-4">
              <Wand2 className="w-8 h-8 text-purple-400 animate-pulse" />
              <span className="text-[10px] text-zinc-400">
                {IMAGE_STEPS[stepIndex]}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <ImageIcon className="w-10 h-10 text-zinc-300" />
              <span className="text-[10px] text-zinc-400">
                La imagen aparecerá aquí
              </span>
            </div>
          )}
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(ModelNode);
