import { memo, useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Video, Trash2, Zap, ChevronDown, ChevronUp, Play, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DURATIONS = [
  { value: '5s',  label: '5s',  credits: 10 },
  { value: '10s', label: '10s', credits: 20 },
  { value: '15s', label: '15s', credits: 35 },
];

interface VideoNodeData {
  title?: string;
  status?: 'idle' | 'rendering' | 'executing' | 'ready' | 'error';
  duration?: string;
  selectedDuration?: string;
  assetUrl?: string;
  model?: string;
  dataPayload?: Record<string, any>;
  imageRef?: string;
}

const VIDEO_STEPS = [
  'Iniciando generación…',
  'Procesando frames…',
  'Renderizando video…',
  'Exportando…',
];

const VideoModelNode = ({ id, data }: { id: string, data: VideoNodeData }) => {
  const { setNodes } = useReactFlow();
  const [isExpanded, setIsExpanded] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isRendering) { setStepIndex(0); return; }
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, VIDEO_STEPS.length - 1));
    }, 12000); // video takes ~45s total, advance every 12s
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.status]);

  // 🔧 BUG FIX: multi-source URL resolution for video
  const videoUrl =
    data.assetUrl ||
    data.dataPayload?.url ||
    data.dataPayload?.asset_url ||
    null;

  const isRendering = data.status === 'rendering' || data.status === 'executing';
  const isReady = data.status === 'ready';
  const isError = data.status === 'error';

  const deleteNode = async () => {
    const { error } = await supabase.from('canvas_nodes').delete().eq('id', id);
    if (!error) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      toast.success("Nodo de video eliminado");
    }
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `creator-ia-video-${Date.now()}.mp4`;
    a.target = '_blank';
    a.click();
  };

  const updateDuration = (val: string) => {
    setNodes(nds =>
      nds.map(node => node.id === id ? { ...node, data: { ...node.data, selectedDuration: val } } : node)
    );
  };

  const updateModel = async (val: string) => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, model: val }
          };
        }
        return node;
      })
    );

    const { error } = await supabase
      .from('canvas_nodes')
      .update({ data_payload: { ...data, model: val } as any })
      .eq('id', id);
    
    if (error) console.error("Error syncing video model:", error);
  };

  return (
    <div className={`group relative rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02]
      ${isRendering ? 'bg-white border-primary shadow-lg ring-2 ring-primary/20' : 'bg-white border hover:border-zinc-300 border-zinc-200 hover:shadow-md transition-colors'}
      w-[260px] shadow-sm
    `}>

      {/* Aether Node Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-zinc-100 bg-zinc-50/50 rounded-t-3xl">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="p-1.5 rounded-xl bg-blue-50 border border-blue-100 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
            <Video className={`w-4 h-4 text-blue-500 shrink-0 ${isRendering ? 'animate-pulse text-primary' : ''}`} />
          </div>
          <h3 className="text-[11px] font-bold text-zinc-900 tracking-wide truncate font-display uppercase">{data.title || "Cinema Engine"}</h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 rounded-lg transition-all">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={deleteNode} className="p-2 hover:bg-red-50 text-red-300 hover:text-red-500 rounded-lg transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 bg-white animate-in fade-in slide-in-from-top-2 duration-300 rounded-b-3xl">
          {/* Action bar */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-display">Synthesis Core</span>
            <button
              onClick={() => (data as any).onExecute?.()}
              disabled={isRendering}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-[10px] font-bold transition-all shadow-sm disabled:opacity-50 active:scale-95 hover:bg-zinc-800"
            >
              {isRendering
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Rendering</>
                : <><Zap className="w-3.5 h-3.5 fill-current" /> Execute</>
              }
            </button>
          </div>

          {/* Rendering progress */}
          {isRendering && (
            <div className="w-full bg-zinc-50 rounded-2xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center gap-3 py-5 px-4">
              <div className="w-3/4 h-1 bg-zinc-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-shimmer w-full" />
              </div>
              <span className="text-[10px] text-zinc-600 font-bold tracking-wide animate-pulse text-center">
                {VIDEO_STEPS[stepIndex]}
              </span>
              <div className="flex gap-1">
                {VIDEO_STEPS.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i <= stepIndex ? 'w-5 bg-primary' : 'w-2 bg-zinc-200'}`} />
                ))}
              </div>
            </div>
          )}

          {/* Video player when ready */}
          {isReady && videoUrl && (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden border border-zinc-200 aspect-video relative shadow-sm group/vid bg-zinc-100">
                <video
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                  loop
                />
              </div>
              <div className="flex items-center justify-between">
                {data.duration && (
                  <div className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-[9px] text-zinc-500 font-bold">{data.duration}</div>
                )}
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-zinc-200 shadow-sm text-[10px] text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-all font-bold ml-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
          )}

          {/* Ready but no URL */}
          {isReady && !videoUrl && (
            <div className="h-28 rounded-xl border border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center gap-2">
              <Play className="w-7 h-7 text-zinc-300" />
              <span className="text-[10px] text-zinc-500">Sin video disponible</span>
            </div>
          )}

          {/* Idle state */}
          {!isRendering && !isReady && !isError && (
            <div className="h-32 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center gap-4 group/idle hover:bg-zinc-100 transition-colors">
              <div className="w-12 h-12 rounded-full border border-zinc-200 bg-white shadow-sm flex items-center justify-center group-hover/idle:border-zinc-300 transition-colors">
                <Video className="w-5 h-5 text-zinc-300 group-hover/idle:text-primary transition-colors" />
              </div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Awaiting Render</span>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="h-20 rounded-xl border border-red-200 bg-red-50 flex items-center justify-center">
              <span className="text-[10px] text-red-500">Error al renderizar</span>
            </div>
          )}

          {/* Duration Selector */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] font-display">Duración</span>
            <div className="flex gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d.value}
                  onClick={() => updateDuration(d.value)}
                  className={`flex flex-col items-center px-3 py-2 rounded-xl border text-[9px] font-bold transition-all flex-1 shadow-sm ${
                    (data.selectedDuration || '5s') === d.value
                    ? 'bg-zinc-900 border-zinc-900 text-white'
                    : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300'
                  }`}
                >
                  <span>{d.label}</span>
                  <span className="text-[8px] opacity-70 font-normal mt-0.5">{d.credits}cr</span>
                </button>
              ))}
            </div>
          </div>

          {/* Industrial Fallback Selector */}
          <div className="pt-2 border-t border-zinc-100 space-y-3">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] font-display">Engine Selector</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'video', name: 'SVD Standard' },
                { id: 'video-hq', name: 'SVD Cinema' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => updateModel(m.id)}
                  className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-all shadow-sm ${
                    (data.model || 'video') === m.id
                    ? 'bg-zinc-900 border-zinc-900 text-white'
                    : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Status pill */}
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${
                isRendering ? 'bg-amber-500 animate-pulse' :
                isReady ? 'bg-emerald-500' :
                isError ? 'bg-red-500' : 'bg-zinc-300'
              }`} />
              <span className="text-[8px] text-zinc-500 font-medium uppercase tracking-widest">
                {isRendering ? 'render' : isReady ? 'listo' : isError ? 'error' : 'wait'}
              </span>
            </div>
            <span className="text-[8px] text-zinc-400 font-medium tracking-tighter">Nexus v2.1</span>
          </div>
        </div>
      )}

    <Handle type="target" position={Position.Left} id="any-in" style={{ top: '40%' }} className="!w-4 !h-4 !-left-2 !bg-zinc-300 !border-2 !border-white hover:!scale-125 transition-transform cursor-crosshair shadow-sm" />
    <Handle type="target" position={Position.Left} id="image-in" style={{ top: '60%' }} className="!w-4 !h-4 !-left-2 !bg-blue-500 !border-2 !border-white hover:!scale-125 transition-transform cursor-crosshair shadow-sm" />
    <div className="absolute left-4 text-[8px] text-blue-500 font-bold bg-white/80 px-1 rounded shadow-sm backdrop-blur-sm" style={{ top: 'calc(60% - 6px)', transform: 'translateY(-50%)' }}>img→vid</div>
    <Handle type="source" position={Position.Right} className="!w-4 !h-4 !-right-2 !bg-white !border-2 !border-zinc-200 hover:!scale-125 transition-transform cursor-crosshair shadow-sm" />
    </div>
  );
};

export default memo(VideoModelNode);
