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
          group relative w-[260px] rounded-xl border bg-node-bg overflow-hidden node-shadow transition-all duration-200
          ${isLoading ? "border-gold/40 animate-pulse-glow" : ""}
          ${isError ? "border-destructive/50" : ""}
          ${isReady && !isSelected ? "border-node-border hover:border-gold/30" : ""}
          ${isSelected ? "border-gold ring-2 ring-gold/30" : ""}
        `}
      >
        {/* Header bar */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
          <div
            className={`flex h-5 w-5 items-center justify-center rounded ${
              isImage
                ? "bg-gold/10 text-gold"
                : "bg-accent/10 text-accent"
            }`}
          >
            {isImage ? (
              <Image className="h-3 w-3" />
            ) : (
              <Video className="h-3 w-3" />
            )}
          </div>
          <span className="flex-1 truncate text-[11px] font-medium text-muted-foreground">
            {isImage ? "Imagen" : "Video"}
          </span>

          {/* Gold badge icons (like Freepik) */}
          <div className="flex gap-0.5">
            <span className="flex h-4 w-4 items-center justify-center rounded border border-gold-muted bg-gold-muted/30 text-gold">
              <Image className="h-2.5 w-2.5" />
            </span>
          </div>

          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(
                new CustomEvent("delete-node", { detail: id })
              );
            }}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>

        {/* Content area */}
        <div className="relative aspect-[4/3] flex items-center justify-center">
          {isLoading && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin-slow text-gold" />
              <span className="text-[10px]">Generando...</span>
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
            <>
              <img
                src={nodeData.assetUrl}
                alt={nodeData.prompt}
                className="h-full w-full object-cover"
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
            </>
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
