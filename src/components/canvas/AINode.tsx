import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { CanvasNodeData } from "@/hooks/useCanvasNodes";
import { Image, Video, Loader2, AlertTriangle, Trash2 } from "lucide-react";

function AINodeComponent({ data, id }: NodeProps) {
  const nodeData = data as unknown as CanvasNodeData;
  const isLoading = nodeData.status === "loading";
  const isError = nodeData.status === "error";
  const isReady = nodeData.status === "ready";

  return (
    <div
      className={`
        group relative w-[280px] rounded-xl border bg-node-bg overflow-hidden node-shadow transition-all duration-200
        ${isLoading ? "border-primary/40 animate-pulse-glow" : ""}
        ${isError ? "border-destructive/50" : ""}
        ${isReady ? "border-node-border hover:border-primary/30" : ""}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <div className={`flex h-6 w-6 items-center justify-center rounded-md ${
          nodeData.type === "image" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
        }`}>
          {nodeData.type === "image" ? <Image className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
        </div>
        <span className="flex-1 truncate text-xs font-medium text-muted-foreground">
          {nodeData.type === "image" ? "Imagen" : "Video"} • {nodeData.prompt.slice(0, 30)}
          {nodeData.prompt.length > 30 ? "…" : ""}
        </span>
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            // Delete handled by parent through custom event
            window.dispatchEvent(new CustomEvent("delete-node", { detail: id }));
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="aspect-square flex items-center justify-center p-2">
        {isLoading && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin-slow text-primary" />
            <span className="text-xs">Generando...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 text-destructive">
            <AlertTriangle className="h-8 w-8" />
            <span className="text-xs text-center px-4">{nodeData.errorMessage || "Error en generación"}</span>
          </div>
        )}

        {isReady && nodeData.assetUrl && (
          nodeData.type === "image" ? (
            <img
              src={nodeData.assetUrl}
              alt={nodeData.prompt}
              className="h-full w-full rounded-lg object-cover"
              loading="lazy"
            />
          ) : (
            <video
              src={nodeData.assetUrl}
              className="h-full w-full rounded-lg object-cover"
              controls
              muted
            />
          )
        )}
      </div>

      {/* Prompt footer */}
      <div className="border-t border-border px-3 py-2">
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 font-mono">
          {nodeData.prompt}
        </p>
      </div>
    </div>
  );
}

export const AINode = memo(AINodeComponent);
