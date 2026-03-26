import { memo, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Video, Trash2, Zap, ChevronDown, ChevronUp, Play, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoNodeData {
  title?: string;
  status?: 'idle' | 'rendering' | 'executing' | 'ready' | 'error';
  duration?: string;
  assetUrl?: string;
  dataPayload?: Record<string, any>;
}

const VideoModelNode = ({ id, data }: { id: string, data: VideoNodeData }) => {
  const { setNodes } = useReactFlow();
  const [isExpanded, setIsExpanded] = useState(true);

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

  return (
    <div className={`group relative rounded-[1.5rem] border bg-[#0f0f12] backdrop-blur-xl w-[300px] shadow-2xl transition-all duration-300 hover:border-[#00c2ff]/30
      ${isRendering ? 'border-[#00c2ff]/40 shadow-[0_0_20px_rgba(0,194,255,0.1)]' : ''}
      ${isReady ? 'border-white/10' : ''}
      ${isError ? 'border-red-500/30' : ''}
      ${!isRendering && !isReady && !isError ? 'border-white/8' : ''}
    `}>

      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-white/6 bg-white/[0.015]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="p-1.5 rounded-lg bg-[#00c2ff]/10 border border-[#00c2ff]/15">
            <Video className={`w-3.5 h-3.5 text-[#00c2ff] shrink-0 ${isRendering ? 'animate-pulse' : ''}`} />
          </div>
          <h3 className="text-[11px] font-semibold text-white truncate">{data.title || "Video IA"}</h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-white/5 text-white/30 rounded-lg transition-all">
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={deleteNode} className="p-1.5 hover:bg-red-500/10 text-white/25 hover:text-red-400 rounded-lg transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Action bar */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-white/25 uppercase tracking-widest">Motor de Video</span>
            <button
              onClick={() => (data as any).onExecute?.()}
              disabled={isRendering}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#bd00ff] to-[#ff0071] text-white text-[10px] font-semibold transition-all shadow-lg disabled:opacity-50 active:scale-95 hover:shadow-[0_0_15px_rgba(189,0,255,0.4)]"
            >
              {isRendering
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Renderizando...</>
                : <><Zap className="w-3 h-3" /> Render</>
              }
            </button>
          </div>

          {/* Rendering progress */}
          {isRendering && (
            <div className="h-28 w-full bg-black/30 rounded-xl border border-[#00c2ff]/15 flex flex-col items-center justify-center gap-3">
              <Video className="w-8 h-8 text-[#00c2ff]/30 animate-pulse" />
              <div className="w-2/3 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#bd00ff] to-[#00c2ff] animate-shimmer w-full" />
              </div>
              <span className="text-[9px] text-white/30 font-medium">Procesando fotogramas...</span>
            </div>
          )}

          {/* Video player when ready */}
          {isReady && videoUrl && (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border border-white/8 aspect-video relative shadow-xl group/vid bg-black">
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
                  <span className="text-[10px] text-white/35 font-medium">{data.duration}</span>
                )}
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-[10px] text-white/50 hover:text-white hover:bg-white/8 transition-all ml-auto"
                >
                  <Download className="w-3 h-3" />
                  Descargar
                </button>
              </div>
            </div>
          )}

          {/* Ready but no URL */}
          {isReady && !videoUrl && (
            <div className="h-28 rounded-xl border border-white/5 bg-black/20 flex flex-col items-center justify-center gap-2">
              <Play className="w-7 h-7 text-white/15" />
              <span className="text-[10px] text-white/25">Sin video disponible</span>
            </div>
          )}

          {/* Idle state */}
          {!isRendering && !isReady && !isError && (
            <div className="h-28 rounded-xl border border-dashed border-white/8 bg-black/15 flex flex-col items-center justify-center gap-2">
              <Video className="w-7 h-7 text-white/15" />
              <span className="text-[10px] text-white/25">Presiona Render para generar</span>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="h-20 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center justify-center">
              <span className="text-[10px] text-red-400/70">Error al renderizar</span>
            </div>
          )}

          {/* Status pill */}
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${
                isRendering ? 'bg-[#00c2ff] animate-pulse' :
                isReady ? 'bg-[#00e5a0]' :
                isError ? 'bg-red-400' : 'bg-white/20'
              }`} />
              <span className="text-[9px] text-white/25 font-medium uppercase tracking-widest">
                {isRendering ? 'renderizando' : isReady ? 'listo' : isError ? 'error' : 'en espera'}
              </span>
            </div>
            <span className="text-[9px] text-white/20 font-medium">Creator v2.0</span>
          </div>
        </div>
      )}

      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !-left-1.5 !bg-[#bd00ff] !border-2 !border-[#050506]" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !-right-1.5 !bg-[#00c2ff] !border-2 !border-[#050506]" />
    </div>
  );
};

export default memo(VideoModelNode);
