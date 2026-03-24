import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { CanvasNodeData } from "@/store/useCanvasStore";
import { useCanvasStore } from "@/store/useCanvasStore";
import { Layout, Loader2, AlertTriangle, Trash2, Smartphone, Tablet, Monitor, Sparkles } from "lucide-react";

const UIRenderer = ({ element }: { element: any }) => {
  if (!element) return null;

  const { type, content, children, styles, attributes } = element;

  const styleObj = {
    ...styles,
  };

  switch (type) {
    case "container":
    case "section":
    case "div":
    case "card":
      const isCard = type === "card";
      return (
        <div 
          style={styleObj} 
          className={`flex flex-col gap-2 overflow-hidden ${isCard ? 'p-4 rounded-xl border border-white/10 bg-white/5 shadow-xl' : ''}`}
        >
          {children?.map((child: any, i: number) => (
            <UIRenderer key={i} element={child} />
          ))}
        </div>
      );
    case "text":
    case "h1":
    case "h2":
    case "p":
      const isHeading = type === "h1" || type === "h2";
      return (
        <div style={styleObj} className={`${isHeading ? 'font-bold tracking-tight' : 'text-sm opacity-80'}`}>
          {content}
        </div>
      );
    case "button":
      return (
        <button 
          style={styleObj} 
          className="rounded-xl px-4 py-2 bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary/30 transition-all active:scale-95"
        >
          {content}
        </button>
      );
    case "image":
      return <img src={attributes?.src || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop"} alt={content} style={styleObj} className="rounded-lg object-cover" />;
    default:
      return null;
  }
};

function UIBuilderNodeComponent({ data, id }: NodeProps) {
  const nodeData = data as unknown as CanvasNodeData;
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const isSelected = selectedNodeId === id;
  const isLoading = nodeData.status === "loading";
  const isError = nodeData.status === "error";
  const isReady = nodeData.status === "ready";

  const uiData = (nodeData.dataPayload as any)?.ui || null;
  const device = (nodeData.dataPayload as any)?.device || "desktop";

  const getDeviceIcon = () => {
    switch (device) {
      case "mobile": return <Smartphone className="h-3 w-3" />;
      case "tablet": return <Tablet className="h-3 w-3" />;
      default: return <Monitor className="h-3 w-3" />;
    }
  };

  const nodeWidth = device === "mobile" ? "w-[240px]" : device === "tablet" ? "w-[360px]" : "w-[480px]";

  return (
    <div className="relative">
      <div className="absolute -top-6 left-0 text-xs font-medium text-muted-foreground truncate max-w-[400px]">
        UI Design • {nodeData.prompt}
      </div>

      <Handle type="target" position={Position.Left} className="!-left-[6px]" />
      <Handle type="source" position={Position.Right} className="!-right-[6px]" />

      <div
        className={`
          group relative ${nodeWidth} rounded-2xl border glass overflow-hidden node-shadow transition-all duration-300
          ${isLoading ? "border-primary/40 animate-pulse-glow" : ""}
          ${isError ? "border-destructive/50" : ""}
          ${isReady && !isSelected ? "border-white/5 hover:border-primary/30" : ""}
          ${isSelected ? "border-primary ring-4 ring-primary/10 shadow-2xl shadow-primary/20" : ""}
        `}
      >
        {/* Header bar */}
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3 bg-gradient-to-r from-primary/10 to-transparent backdrop-blur-xl">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-inner shadow-white/5">
            <Layout className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="truncate text-[11px] font-black text-foreground uppercase tracking-tighter leading-none">
              {nodeData.name || `${device} System`}
            </span>
            <span className="text-[8px] text-muted-foreground uppercase tracking-widest opacity-50">
              V3.0 Industrial Layout
            </span>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-muted-foreground">
                {getDeviceIcon()}
             </div>
             <button
              className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent("delete-node", { detail: id }));
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="relative min-h-[300px] max-h-[600px] overflow-y-auto bg-canvas/30 p-4">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/40 backdrop-blur-[2px]">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="relative h-10 w-10 animate-spin-slow text-primary" />
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-foreground block">Dibujando Interfaz...</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 opacity-60">IA en progreso</span>
              </div>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center gap-3 text-destructive p-8 h-full">
              <AlertTriangle className="h-8 w-8" />
              <span className="text-xs font-semibold text-center leading-relaxed">
                {nodeData.errorMessage || "No se pudo generar el layout. Reintenta con otro prompt."}
              </span>
            </div>
          )}

          {isReady && uiData ? (
             <div className="animate-fade-in">
                <UIRenderer element={uiData} />
             </div>
          ) : isReady && !uiData ? (
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground p-8">
              <AlertTriangle className="h-6 w-6" />
              <span className="text-xs">Sin datos de UI</span>
            </div>
          ) : null}
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-2 border-t border-white/5 px-4 py-2 bg-white/5">
           <div className="flex h-5 w-5 items-center justify-center rounded bg-gold/10 text-gold">
              <Sparkles className="h-3 w-3" />
           </div>
           <span className="text-[10px] text-muted-foreground font-medium truncate flex-1 uppercase tracking-wider">
             Genedado por Gemini Architecture Pro
           </span>
        </div>
      </div>
    </div>
  );
}

export const UIBuilderNode = memo(UIBuilderNodeComponent);
