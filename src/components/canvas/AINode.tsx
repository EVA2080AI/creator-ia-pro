import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { CanvasNodeData } from "@/store/useCanvasStore";
import { useCanvasStore } from "@/store/useCanvasStore";
import { Image, Video, Loader2, AlertTriangle, Trash2, Play, Sparkles } from "lucide-react";

function AINodeComponent({ data, id }: NodeProps) {
  const nodeData = data as unknown as CanvasNodeData;
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const isSelected = selectedNodeId === id;
  const isLoading = nodeData.status === "loading";
  const isError = nodeData.status === "error";
  const isReady = nodeData.status === "ready";
  const isImage = nodeData.type === "image";

  const label =
    isImage
      ? nodeData.prompt.length > 20
        ? nodeData.prompt.slice(0, 20) + "…"
        : nodeData.prompt
      : nodeData.type === "video"
      ? "Video"
      : "Nodo";

  return (
    <div className="relative">
      {/* Label above node */}
      {/* Label above node */}
      <div className="absolute -top-6 left-0 text-[10px] font-black text-slate-500 truncate max-w-[260px] uppercase tracking-widest">
        {isImage ? "industrial_image" : "industrial_video"} // {label}
      </div>

      {/* Input handle (left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!-left-[6px]"
      />

      {/* Output handle (right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!-right-[6px]"
      />

      <div
        className={`
          group relative w-[280px] rounded-[1.8rem] border bg-[#080809]/80 backdrop-blur-3xl overflow-hidden shadow-2xl transition-all duration-500
          ${isLoading ? "border-[#d4ff00]/40 shadow-[#d4ff00]/5" : ""}
          ${isError ? "border-red-500/50" : ""}
          ${isReady && !isSelected ? "border-white/5 hover:border-[#d4ff00]/30" : ""}
          ${isSelected ? "border-[#d4ff00] ring-4 ring-[#d4ff00]/10 shadow-2xl shadow-[#d4ff00]/20 scale-[1.02]" : ""}
        `}
      >
        {/* Header bar */}
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-4 bg-gradient-to-r from-[#d4ff00]/5 to-transparent backdrop-blur-3xl">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl shadow-inner border border-white/5 transition-all group-hover:bg-[#d4ff00] group-hover:text-[#020203] duration-500 ${
              isImage
                ? "bg-[#d4ff00]/10 text-[#d4ff00]"
                : "bg-blue-500/10 text-blue-500"
            }`}
          >
            {isImage ? (
              <Image className="h-4 w-4" />
            ) : (
              <Video className="h-4 w-4" />
            )}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="truncate text-[11px] font-black text-white uppercase tracking-tighter leading-none">
              {nodeData.name || (isImage ? "Imagen IA" : "Video IA")}
            </span>
            <span className="text-[7px] text-slate-500 uppercase tracking-widest mt-1.5 font-black">
              Nebula Engine V8.0
            </span>
          </div>
          
          <button
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(
                new CustomEvent("delete-node", { detail: id })
              );
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Content area */}
        <div className="relative aspect-[4/3] flex items-center justify-center bg-canvas/30">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#020203]/40 backdrop-blur-[4px]">
              <div className="relative">
                <div className="absolute inset-0 bg-[#d4ff00]/20 blur-2xl rounded-full animate-pulse" />
                <Loader2 className="relative h-10 w-10 animate-spin text-[#d4ff00]" />
              </div>
              <div className="text-center">
                <span className="text-[10px] font-black text-white block lowercase tracking-widest">procesando_activos...</span>
                <span className="text-[8px] text-slate-500 uppercase tracking-[0.3em] mt-2 block font-black">Flux Engine V8</span>
              </div>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center gap-2 text-destructive p-3">
              <AlertTriangle className="h-6 w-6" />
              <span className="text-[10px] text-center">
                {nodeData.errorMessage || "Error"}
              </span>
            </div>
          )}

          {isReady && nodeData.assetUrl && (
            <div className="relative h-full w-full">
              <img
                src={nodeData.assetUrl}
                alt={nodeData.prompt || "Generated Content"}
                onLoad={() => console.log("Canvas: Image Loaded Successfully", nodeData.assetUrl)}
                onError={(e) => {
                  console.error("Canvas: Image Load Error", nodeData.assetUrl);
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544391439-1df6630fbc13?q=80&w=1470&auto=format&fit=crop";
                }}
                className="h-full w-full object-cover animate-in fade-in zoom-in duration-500"
                loading="lazy"
              />
              {/* Video play overlay */}
              {!isImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm border border-border">
                    <Play className="h-4 w-4 text-foreground ml-0.5" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom badge bar */}
        <div className="flex items-center gap-2 border-t border-white/5 px-4 py-2.5 bg-white/[0.02]">
          <span className="flex h-5 w-5 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-500 group-hover:text-[#d4ff00] transition-colors">
            <Sparkles className="h-3 w-3" />
          </span>
          <span className="text-[9px] text-slate-500 font-bold truncate flex-1 lowercase tracking-tight">
            {nodeData.prompt.slice(0, 35)}{nodeData.prompt.length > 35 ? "…" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

export const AINode = memo(AINodeComponent);
