import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { CanvasNodeData } from "@/store/useCanvasStore";
import { useCanvasStore } from "@/store/useCanvasStore";
import { Image, Video, Loader2, AlertTriangle, Trash2, Play, Sparkles, Download } from "lucide-react";

function AINodeComponent({ data, id }: NodeProps) {
  const nodeData = data as unknown as CanvasNodeData;
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const isSelected = selectedNodeId === id;
  const isLoading = nodeData.status === "loading";
  const isError = nodeData.status === "error";
  const isReady = nodeData.status === "ready";
  const isImage = nodeData.type === "image";

  // 🔧 BUG FIX: support both `assetUrl` (store) and `asset_url` (DB payload) and `url` (API response)
  const displayUrl =
    nodeData.assetUrl ||
    (nodeData.dataPayload as any)?.url ||
    (nodeData.dataPayload as any)?.asset_url ||
    null;

  const label = nodeData.prompt?.length > 20
    ? nodeData.prompt.slice(0, 20) + "…"
    : nodeData.prompt || "nuevo nodo";

  const handleDownload = () => {
    if (!displayUrl) return;
    const a = document.createElement("a");
    a.href = displayUrl;
    a.download = `creator-ia-${Date.now()}.${isImage ? "png" : "mp4"}`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="relative">
      {/* Label */}
      <div className="absolute -top-6 left-0 text-[10px] font-semibold text-white/30 truncate max-w-[260px] uppercase tracking-widest">
        {isImage ? "IMAGE" : "VIDEO"} · {label}
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Left} className="!-left-[6px]" />
      <Handle type="source" position={Position.Right} className="!-right-[6px]" />

      {/* Node Card */}
      <div
        className={`
          group relative w-[280px] rounded-[1.5rem] border bg-[#0f0f12] backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-300
          ${isLoading ? "border-[#bd00ff]/40 shadow-[#bd00ff]/8" : ""}
          ${isError ? "border-red-500/40" : ""}
          ${isReady && !isSelected ? "border-white/8 hover:border-[#bd00ff]/30" : ""}
          ${isSelected ? "border-[#bd00ff] ring-4 ring-[#bd00ff]/10 shadow-2xl shadow-[#bd00ff]/15 scale-[1.02]" : ""}
        `}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 border-b border-white/6 px-4 py-3 ${isSelected ? "bg-gradient-to-r from-[#bd00ff]/8 to-transparent" : "bg-white/2"}`}>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${
              isImage
                ? "bg-[#bd00ff]/12 border-[#bd00ff]/20 text-[#bd00ff]"
                : "bg-[#00c2ff]/12 border-[#00c2ff]/20 text-[#00c2ff]"
            }`}
          >
            {isImage ? <Image className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="truncate text-[11px] font-bold text-white tracking-tight leading-none">
              {nodeData.name || (isImage ? "Imagen IA" : "Video IA")}
            </span>
            <span className="text-[9px] text-white/30 mt-1 font-medium tracking-wide">
              Creator Engine v2.0
            </span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            {displayUrl && (
              <button
                onClick={handleDownload}
                className="p-1.5 rounded-lg text-white/40 hover:text-[#bd00ff] hover:bg-[#bd00ff]/10 transition-all"
              >
                <Download className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent("delete-node", { detail: id }));
              }}
              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="relative aspect-[4/3] bg-black/30 flex items-center justify-center overflow-hidden">
          {/* Loading */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#050506]/60 backdrop-blur-sm">
              <div className="relative">
                <div className="absolute inset-0 bg-[#bd00ff]/15 blur-2xl rounded-full animate-pulse" />
                <Loader2 className="relative h-9 w-9 animate-spin text-[#bd00ff]" />
              </div>
              <div className="text-center">
                <span className="text-[10px] font-semibold text-white block">Generando...</span>
                <span className="text-[9px] text-white/30 mt-1 block">Flux Engine v2.0</span>
              </div>
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="flex flex-col items-center gap-2.5 text-red-400 px-5 py-6 text-center">
              <AlertTriangle className="h-7 w-7 opacity-70" />
              <span className="text-[11px] leading-relaxed text-white/50">
                {nodeData.errorMessage || "Error al generar. Intenta de nuevo."}
              </span>
            </div>
          )}

          {/* ✅ FIXED: Render image/video when ready with displayUrl */}
          {isReady && displayUrl && (
            <div className="relative h-full w-full">
              {isImage ? (
                <img
                  src={displayUrl}
                  alt={nodeData.prompt || "Generated image"}
                  onLoad={() => console.log("[AINode] Image loaded:", displayUrl)}
                  onError={(e) => {
                    console.error("[AINode] Image failed to load:", displayUrl);
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                  className="h-full w-full object-cover animate-in fade-in zoom-in duration-500"
                  loading="lazy"
                  crossOrigin="anonymous"
                />
              ) : (
                <>
                  <video
                    src={displayUrl}
                    className="h-full w-full object-cover"
                    controls={false}
                    loop
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm border border-white/20">
                      <Play className="h-4 w-4 text-white ml-0.5" />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Ready but no image */}
          {isReady && !displayUrl && (
            <div className="flex flex-col items-center gap-2.5 text-white/25 px-5 py-8 text-center">
              <Sparkles className="h-6 w-6" />
              <span className="text-xs">Listo · Sin preview</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 border-t border-white/5 px-4 py-2.5 bg-white/[0.015]">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isLoading ? "bg-[#ffb800] animate-pulse" :
              isError ? "bg-red-400" :
              isReady ? "bg-[#00e5a0]" : "bg-white/20"
            }`}
          />
          <span className="text-[9px] text-white/35 font-medium truncate flex-1">
            {nodeData.prompt?.slice(0, 40)}{(nodeData.prompt?.length || 0) > 40 ? "…" : ""}
          </span>
          {isReady && (
            <span className="text-[9px] text-[#00e5a0] font-semibold shrink-0">READY</span>
          )}
        </div>
      </div>
    </div>
  );
}

export const AINode = memo(AINodeComponent);
