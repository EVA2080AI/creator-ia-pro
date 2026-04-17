import { memo, useState, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Video, Trash2, Zap, ChevronDown, ChevronUp, Play, Download, Loader2, Sparkles, Wand2, Image as ImageIcon, Clock } from 'lucide-react';
import BaseNode from './BaseNode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VIDEO_MODELS = [
  {
    id: 'veo-3',
    name: 'Veo 3',
    provider: 'Google',
    description: 'Text-to-video de alta calidad con audio integrado',
    maxDuration: '8s',
    aspectRatios: ['16:9', '9:16', '1:1'],
    cost: 15,
    badge: 'Nuevo',
    color: '#10b981',
  },
  {
    id: 'luma',
    name: 'Dream Machine',
    provider: 'Luma AI',
    description: 'Motion cinematográfica realista',
    maxDuration: '5s',
    aspectRatios: ['16:9', '9:16', '1:1'],
    cost: 10,
    badge: 'Popular',
    color: '#8b5cf6',
  },
  {
    id: 'pika',
    name: 'Pika 2.0',
    provider: 'Pika Labs',
    description: 'Ideal para efectos visuales y motion',
    maxDuration: '3s',
    aspectRatios: ['16:9', '9:16', '1:1'],
    cost: 8,
    color: '#f59e0b',
  },
  {
    id: 'svd',
    name: 'Stable Video',
    provider: 'Stability AI',
    description: 'Image-to-video estable y confiable',
    maxDuration: '4s',
    aspectRatios: ['16:9', '9:16', '1:1'],
    cost: 5,
    color: '#3b82f6',
  },
];

const ASPECT_RATIOS = [
  { id: '16:9', label: 'Horizontal', icon: '🖥️', dimensions: '1280x720' },
  { id: '9:16', label: 'Vertical', icon: '📱', dimensions: '720x1280' },
  { id: '1:1', label: 'Cuadrado', icon: '⬜', dimensions: '768x768' },
];

interface VideoNodeData {
  title?: string;
  status?: 'idle' | 'loading' | 'executing' | 'ready' | 'error' | 'bypassed';
  onAddConnected?: (sourceId: string, targetType: string) => void;
  model?: string;
  aspectRatio?: string;
  assetUrl?: string;
  imageRef?: string;
  dataPayload?: Record<string, any>;
  prompt?: string;
  collapsed?: boolean;
  negativePrompt?: string;
  cfgScale?: number;
}

const VIDEO_STEPS: Record<string, string[]> = {
  'veo-3': ['Inicializando Veo 3…', 'Generando frames…', 'Sintetizando audio…', 'Finalizando…'],
  'luma': ['Preparando Dream Machine…', 'Renderizando escena…', 'Procesando motion…', 'Exportando…'],
  'pika': ['Iniciando Pika…', 'Generando motion…', 'Aplicando efectos…', 'Listo'],
  'svd': ['Preparando SVD…', 'Procesando frames…', 'Interpolando motion…', 'Finalizando…'],
};

const VideoModelNode = ({ id, data }: { id: string; data: VideoNodeData }) => {
  const { setNodes } = useReactFlow();
  const [modelOpen, setModelOpen] = useState(false);
  const [ratioOpen, setRatioOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentModel = VIDEO_MODELS.find(m => m.id === (data.model || 'veo-3')) || VIDEO_MODELS[0];
  const currentRatio = ASPECT_RATIOS.find(r => r.id === (data.aspectRatio || '16:9')) || ASPECT_RATIOS[0];

  useEffect(() => {
    if (!isGenerating && data.status !== 'executing') {
      setStepIndex(0);
      return;
    }
    const steps = VIDEO_STEPS[currentModel.id] || VIDEO_STEPS['svd'];
    const interval = setInterval(() => {
      setStepIndex(i => Math.min(i + 1, steps.length - 1));
    }, 8000);
    return () => clearInterval(interval);
  }, [data.status, isGenerating, currentModel.id]);

  const update = (patch: Partial<VideoNodeData>) => {
    setNodes(nds =>
      nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)
    );
  };

  const deleteNode = async () => {
    await supabase.from('canvas_nodes').delete().eq('id', id);
    setNodes(nds => nds.filter(n => n.id !== id));
    toast.success('Nodo de video eliminado');
  };

  const handleToggleBypass = () => {
    const newStatus = data.status === 'bypassed' ? 'idle' : 'bypassed';
    update({ status: newStatus });
    toast.success(newStatus === 'bypassed' ? 'Nodo desactivado' : 'Nodo reactivado');
  };

  const handleToggleCollapsed = () => {
    update({ collapsed: !data.collapsed });
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    update({ status: 'executing' });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? '';

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/media-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          tool: 'video',
          prompt: {
            model: currentModel.id,
            prompt: data.prompt || 'A cinematic scene',
            aspectRatio: currentRatio.id,
          },
          image_url: data.imageRef,
        }),
      });

      if (!res.ok) throw new Error('Error en generación de video');

      const result = await res.json();
      if (result.error) throw new Error(result.error);
      if (result.url) {
        update({ assetUrl: result.url, status: 'ready' });
        toast.success(`Video generado con ${currentModel.name}`);
      }
    } catch (err: any) {
      update({ status: 'error' });
      toast.error(err.message || 'Error generando video');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!data.assetUrl) return;
    const a = document.createElement('a');
    a.href = data.assetUrl;
    a.download = `creator-ia-video-${Date.now()}.mp4`;
    a.target = '_blank';
    a.click();
    toast.success('Video descargado');
  };

  const isExecuting = data.status === 'executing' || isGenerating;
  const isReady = data.status === 'ready' && data.assetUrl;
  const steps = VIDEO_STEPS[currentModel.id] || VIDEO_STEPS['svd'];

  return (
    <BaseNode
      nodeId={id}
      type="videoModel"
      title={data.title || `🎬 ${currentModel.name}`}
      status={data.status}
      onDelete={deleteNode}
      onExecute={handleGenerate}
      outputData={data.assetUrl}
      outputType="text"
      defaultCollapsed={data.collapsed}
      onToggleCollapsed={handleToggleCollapsed}
      onToggleBypass={handleToggleBypass}
      minWidth="340px"
    >
      <div className="space-y-4">
        {/* Model Selector */}
        <div className="relative">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">
            Modelo de Video
          </label>
          <button
            onClick={() => setModelOpen(!modelOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white border border-zinc-200 shadow-sm hover:border-blue-300 transition-all"
            style={{ borderColor: modelOpen ? currentModel.color : undefined }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: currentModel.color }}
              >
                <Video className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-zinc-900 block">{currentModel.name}</span>
                <span className="text-[9px] text-zinc-400">{currentModel.provider}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentModel.badge && (
                <span
                  className="px-1.5 py-0.5 rounded text-[8px] font-bold text-white"
                  style={{ backgroundColor: currentModel.color }}
                >
                  {currentModel.badge}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${modelOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {modelOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-zinc-200 bg-white shadow-xl z-50 overflow-hidden">
              {VIDEO_MODELS.map(model => (
                <button
                  key={model.id}
                  onClick={() => { update({ model: model.id }); setModelOpen(false); }}
                  className={`w-full px-3 py-3 flex items-start gap-3 hover:bg-zinc-50 transition-all border-b border-zinc-100 last:border-0 ${
                    data.model === model.id ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: model.color }}
                  >
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-900">{model.name}</span>
                      {model.badge && (
                        <span
                          className="px-1 py-0.5 rounded text-[7px] font-bold text-white"
                          style={{ backgroundColor: model.color }}
                        >
                          {model.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-zinc-500 block">{model.description}</span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[8px] text-zinc-400">⏱️ {model.maxDuration}</span>
                      <span className="text-[8px] text-zinc-400">💎 {model.cost} créditos</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Aspect Ratio Selector */}
        <div className="relative">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">
            Proporción
          </label>
          <div className="flex gap-2">
            {ASPECT_RATIOS.map(ratio => (
              <button
                key={ratio.id}
                onClick={() => { update({ aspectRatio: ratio.id }); setRatioOpen(false); }}
                className={`flex-1 py-2 px-2 rounded-xl border text-[10px] font-medium transition-all ${
                  currentRatio.id === ratio.id
                    ? 'bg-zinc-900 border-zinc-900 text-white'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <span className="block text-center">{ratio.icon}</span>
                <span className="block text-center mt-0.5">{ratio.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Descripción del video
          </label>
          <textarea
            value={data.prompt || ''}
            onChange={e => update({ prompt: e.target.value })}
            onKeyDown={e => e.stopPropagation()}
            placeholder="Describe la escena cinematográfica que quieres generar..."
            className="w-full text-xs leading-relaxed text-zinc-900 bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none min-h-[80px] placeholder:text-zinc-400"
          />
        </div>

        {/* Reference Image */}
        {data.imageRef && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Imagen de referencia
            </label>
            <div className="relative rounded-xl overflow-hidden border border-zinc-200">
              <img src={data.imageRef} alt="Reference" className="w-full h-24 object-cover" />
              <button
                onClick={() => update({ imageRef: undefined })}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Advanced Options Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-[10px] text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          Opciones avanzadas
        </button>

        {showAdvanced && (
          <div className="space-y-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1">
              <label className="text-[9px] font-medium text-zinc-600">Negative Prompt</label>
              <input
                type="text"
                value={data.negativePrompt || ''}
                onChange={e => update({ negativePrompt: e.target.value })}
                onKeyDown={e => e.stopPropagation()}
                placeholder="Elementos a evitar..."
                className="w-full text-[10px] text-zinc-800 bg-white border border-zinc-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isExecuting || !data.prompt}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-xs font-bold uppercase tracking-wider shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg, ${currentModel.color}, ${currentModel.color}dd)`,
            boxShadow: `0 4px 14px ${currentModel.color}40`,
          }}
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {steps[stepIndex]}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generar Video ({currentModel.cost} créditos)
            </>
          )}
        </button>

        {/* Progress Steps */}
        {isExecuting && (
          <div className="space-y-2">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    i <= stepIndex ? 'bg-blue-500' : 'bg-zinc-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-[9px] text-zinc-500 text-center">
              Generando con {currentModel.name}... Esto puede tomar 1-3 minutos
            </p>
          </div>
        )}

        {/* Video Preview */}
        {isReady && (
          <div className="space-y-3 animate-in fade-in zoom-in-95">
            <div className="relative rounded-xl overflow-hidden border border-zinc-200 bg-zinc-900 shadow-lg">
              <video
                src={data.assetUrl}
                controls
                playsInline
                loop
                className="w-full aspect-video object-cover"
              />
              <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] text-white font-medium">{currentModel.name}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar MP4
              </button>
              <button
                onClick={handleGenerate}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-50 transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                Re-Generar
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isReady && !isExecuting && (
          <div className="h-32 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: `${currentModel.color}20` }}
            >
              <Video className="w-6 h-6" style={{ color: currentModel.color }} />
            </div>
            <div className="text-center">
              <p className="text-[10px] text-zinc-500 font-medium">El video aparecerá aquí</p>
              <p className="text-[9px] text-zinc-400 mt-0.5">
                {currentRatio.dimensions} • {currentModel.maxDuration}
              </p>
            </div>
          </div>
        )}

        {/* Model Info Footer */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[9px] text-zinc-400">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>~{currentModel.maxDuration} duración</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{currentRatio.label}</span>
            <span className="text-zinc-300">|</span>
            <span>{currentModel.cost} créditos</span>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(VideoModelNode);
