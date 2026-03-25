import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { CanvasNodeData } from "@/store/useCanvasStore";
import { useCanvasStore } from "@/store/useCanvasStore";
import { Image, Video, Loader2, AlertTriangle, Trash2, Play } from "lucide-react";

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
      <div className="absolute -top-6 left-0 text-xs font-medium text-muted-foreground truncate max-w-[260px]">
        {isImage ? "Image" : "Video"} • {label}
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
          group relative w-[280px] rounded-2xl border glass overflow-hidden node-shadow transition-all duration-300
          ${isLoading ? "border-primary/40 animate-pulse-glow" : ""}
          ${isError ? "border-destructive/50" : ""}
          ${isReady && !isSelected ? "border-white/5 hover:border-primary/30" : ""}
          ${isSelected ? "border-primary ring-4 ring-primary/10 shadow-2xl shadow-primary/20" : ""}
        `}
      >
        {/* Header bar */}
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3 bg-gradient-to-r from-primary/10 to-transparent backdrop-blur-xl">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-xl shadow-inner shadow-white/5 ${
              isImage
                ? "bg-primary/20 text-primary"
                : "bg-accent/20 text-accent"
            }`}
          >
            {isImage ? (
              <Image className="h-3.5 w-3.5" />
            ) : (
              <Video className="h-3.5 w-3.5" />
            )}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="truncate text-[11px] font-black text-foreground uppercase tracking-tighter leading-none">
              {nodeData.name || (isImage ? "Imagen IA" : "Video IA")}
            </span>
            <span className="text-[8px] text-muted-foreground uppercase tracking-widest opacity-50">
              V3.92 Engine Output
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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/40 backdrop-blur-[2px]">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="relative h-10 w-10 animate-spin-slow text-primary" />
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-foreground block">Procesando...</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 opacity-60">Motor Generativo V3</span>
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
                alt={nodeData.prompt}
                onLoad={() => console.log("Image Loaded")}
                onError={(e) => {
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
        <div className="flex items-center gap-1 border-t border-border px-3 py-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded border border-gold-muted bg-gold-muted/30 text-gold">
            <Image className="h-2.5 w-2.5" />
          </span>
          <span className="text-[10px] text-muted-foreground font-mono truncate flex-1">
            {nodeData.prompt.slice(0, 35)}{nodeData.prompt.length > 35 ? "…" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

export const AINode = memo(AINodeComponent);
