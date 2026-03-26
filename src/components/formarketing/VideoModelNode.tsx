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
  model?: string;
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
    <div className={`group relative rounded-2xl border border-white/5 bg-[#0f0f12] backdrop-blur-xl w-[260px] shadow-2xl transition-all duration-300 hover:border-white/20
      ${isRendering ? 'border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : ''}
      ${isReady ? 'border-white/10' : ''}
      ${isError ? 'border-red-500/30' : ''}
      ${!isRendering && !isReady && !isError ? 'border-white/8' : ''}
    `}>

      {/* Header */}
      <div className="flex items-center justify-between p-2.5 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1 rounded-lg bg-white/5 border border-white/10">
            <Video className={`w-3.5 h-3.5 text-white/70 shrink-0 ${isRendering ? 'animate-pulse' : ''}`} />
          </div>
          <h3 className="text-[10px] font-bold text-white/90 tracking-tight truncate uppercase">{data.title || "NEXUS_VIDEO_V2"}</h3>
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
        <div className="p-3 space-y-3">
          {/* Action bar */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-medium text-white/20 uppercase tracking-widest">Processing Core</span>
            <button
              onClick={() => (data as any).onExecute?.()}
              disabled={isRendering}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-[9px] font-bold transition-all shadow-lg disabled:opacity-50 active:scale-95 hover:bg-white/90"
            >
              {isRendering
                ? <><Loader2 className="w-2.5 h-2.5 animate-spin" /> ...</>
                : <><Zap className="w-2.5 h-2.5" /> Execute</>
              }
            </button>
          </div>

          {/* Rendering progress */}
          {isRendering && (
            <div className="h-16 w-full bg-black/30 rounded-lg border border-white/5 flex flex-col items-center justify-center gap-2">
              <div className="w-2/3 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-white animate-shimmer w-full opacity-50" />
              </div>
              <span className="text-[8px] text-white/20 font-medium uppercase tracking-[0.2em]">calculating_layers...</span>
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
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/8 text-[9px] text-white/50 hover:text-white hover:bg-white/8 transition-all ml-auto"
                >
                  <Download className="w-2.5 h-2.5" />
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

          {/* Industrial Fallback Selector */}
          <div className="pt-2 border-t border-white/5 space-y-2">
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] px-1">Industrial Fallback Engine</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'nano-banana-video', name: 'video_standard' },
                { id: 'nano-banana-cinema', name: 'video_cinema_v8' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => updateModel(m.id)}
                  className={`px-2 py-1 rounded-lg border text-[8px] font-bold lowercase tracking-wider transition-all ${
                    (data.model || 'nano-banana-video') === m.id 
                    ? 'bg-white/10 border-white/20 text-white' 
                    : 'bg-white/5 border-white/5 text-white/20 hover:bg-white/10'
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
                isRendering ? 'bg-[#FA8214] animate-pulse' :
                isReady ? 'bg-green-500' :
                isError ? 'bg-red-400' : 'bg-white/20'
              }`} />
              <span className="text-[8px] text-white/25 font-medium uppercase tracking-widest">
                {isRendering ? 'render' : isReady ? 'listo' : isError ? 'error' : 'wait'}
              </span>
            </div>
            <span className="text-[8px] text-white/20 font-medium tracking-tighter">Nexus v2.1</span>
          </div>
        </div>
      )}

      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !-left-1 !bg-white/40 !border-2 !border-[#050506]" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !-right-1 !bg-white !border-2 !border-[#050506]" />
    </div>
  );
};

export default memo(VideoModelNode);
