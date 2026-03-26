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
    <div className={`group relative rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02]
      ${isRendering ? 'aether-prism glow-blue shadow-[0_0_40px_rgba(0,194,255,0.15)]' : 'aether-card'}
      w-[260px] shadow-2xl nodrag
    `}>

      {/* Aether Node Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="p-1.5 rounded-xl bg-white/5 border border-white/10 group-hover:bg-aether-blue/20 group-hover:border-aether-blue/30 transition-colors">
            <Video className={`w-4 h-4 text-white/70 shrink-0 ${isRendering ? 'animate-pulse text-aether-blue' : ''}`} />
          </div>
          <h3 className="text-[11px] font-bold text-white/90 tracking-wide truncate font-display uppercase">{data.title || "Cinema Engine"}</h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-white/5 text-white/30 hover:text-white rounded-lg transition-all">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={deleteNode} className="p-2 hover:bg-rose-500/10 text-white/20 hover:text-rose-500 rounded-lg transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 bg-black/20 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Action bar */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest font-display">Synthesis Core</span>
            <button
              onClick={() => (data as any).onExecute?.()}
              disabled={isRendering}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-black text-[10px] font-bold transition-all shadow-lg shadow-white/5 disabled:opacity-50 active:scale-95 hover:bg-white/90"
            >
              {isRendering
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Rendering</>
                : <><Zap className="w-3.5 h-3.5 fill-current" /> Execute</>
              }
            </button>
          </div>

          {/* Rendering progress */}
          {isRendering && (
            <div className="h-20 w-full bg-white/[0.02] rounded-2xl border border-white/[0.05] flex flex-col items-center justify-center gap-3">
              <div className="w-3/4 h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-aether-blue animate-shimmer w-full" />
              </div>
              <span className="text-[9px] text-white/30 font-bold uppercase tracking-[0.2em] animate-pulse">Calculating_Light_Paths</span>
            </div>
          )}

          {/* Video player when ready */}
          {isReady && videoUrl && (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden border border-white/10 aspect-video relative shadow-2xl group/vid bg-black/40">
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
                  <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] text-white/40 font-bold">{data.duration}</div>
                )}
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-white/60 hover:text-white hover:bg-white/10 transition-all font-bold ml-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
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
            <div className="h-32 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center justify-center gap-4 group/idle hover:bg-white/[0.02] transition-colors">
              <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center group-hover/idle:border-white/10 transition-colors">
                <Video className="w-5 h-5 text-white/10 group-hover/idle:text-aether-blue transition-colors" />
              </div>
              <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Awaiting Render</span>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="h-20 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center justify-center">
              <span className="text-[10px] text-red-400/70">Error al renderizar</span>
            </div>
          )}

          {/* Industrial Fallback Selector */}
          <div className="pt-2 border-t border-white/5 space-y-3">
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] font-display">Engine Selector</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'nano-banana-video', name: 'Standard Flow' },
                { id: 'nano-banana-cinema', name: 'Cinema 8K' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => updateModel(m.id)}
                  className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                    (data.model || 'nano-banana-video') === m.id 
                    ? 'bg-white/10 border-white/20 text-white shadow-lg shadow-white/5' 
                    : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'
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

    <Handle type="target" position={Position.Left} className="!w-2 !h-2 !-left-1 !bg-white/40 !border-2 !border-[#020203] hover:scale-125 transition-transform" />
    <Handle type="source" position={Position.Right} className="!w-2 !h-2 !-right-1 !bg-white !border-2 !border-[#020203] hover:scale-125 transition-transform" />
    </div>
  );
};

export default memo(VideoModelNode);
