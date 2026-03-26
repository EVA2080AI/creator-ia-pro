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
          className={`flex flex-col gap-2 overflow-hidden ${isCard ? 'p-6 rounded-[2rem] border border-white/5 bg-white/5 shadow-2xl backdrop-blur-3xl' : ''}`}
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
          className="rounded-2xl px-5 py-2.5 bg-[#d4ff00] text-[#020203] border border-[#d4ff00] text-[10px] font-black uppercase tracking-widest hover:bg-[#c4eb00] transition-all active:scale-95 shadow-lg shadow-[#d4ff00]/10"
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
      <div className="absolute -top-6 left-0 text-[10px] font-black text-slate-500 truncate max-w-[400px] uppercase tracking-widest">
        UI_ENGINE_V8.0 // {nodeData.prompt}
      </div>

      <Handle type="target" position={Position.Left} className="!-left-[6px]" />
      <Handle type="source" position={Position.Right} className="!-right-[6px]" />

      <div
        className={`
          group relative ${nodeWidth} rounded-[2rem] border bg-[#080809]/80 backdrop-blur-3xl overflow-hidden shadow-3xl transition-all duration-500
          ${isLoading ? "border-[#d4ff00]/40 shadow-[#d4ff00]/5" : ""}
          ${isError ? "border-red-500/50" : ""}
          ${isReady && !isSelected ? "border-white/5 hover:border-[#d4ff00]/30" : ""}
          ${isSelected ? "border-[#d4ff00] ring-4 ring-[#d4ff00]/10 shadow-2xl shadow-[#d4ff00]/20 scale-[1.01]" : ""}
        `}
      >
        {/* Header bar */}
        <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4 bg-gradient-to-r from-[#d4ff00]/5 to-transparent backdrop-blur-3xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#d4ff00]/10 text-[#d4ff00] border border-white/5 shadow-2xl shadow-[#d4ff00]/10 transition-all group-hover:bg-[#d4ff00] group-hover:text-[#020203] duration-500">
            <Layout className="h-4 w-4" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="truncate text-[11px] font-black text-white uppercase tracking-tighter leading-none">
              {nodeData.name || `${device}_system`}
            </span>
            <span className="text-[7px] text-slate-500 uppercase tracking-widest mt-1.5 font-black">
              Nebula Layout V8.0
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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#020203]/40 backdrop-blur-[6px]">
              <div className="relative">
                <div className="absolute inset-0 bg-[#d4ff00]/20 blur-3xl rounded-full animate-pulse" />
                <Loader2 className="relative h-12 w-12 animate-spin text-[#d4ff00]" />
              </div>
              <div className="text-center">
                <span className="text-[10px] font-black text-white block lowercase tracking-widest">dibujando_interfaz_ecosistema...</span>
                <span className="text-[8px] text-slate-500 uppercase tracking-[0.3em] mt-3 block font-black">Cybernetic Flow V8</span>
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
        <div className="flex items-center gap-2 border-t border-white/5 px-5 py-3 bg-white/[0.02]">
           <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#d4ff00]/10 text-[#d4ff00]">
              <Sparkles className="h-3 w-3" />
           </div>
           <span className="text-[9px] text-slate-500 font-black truncate flex-1 uppercase tracking-widest">
             Genedado por Nebula Architecture V8 Pro
           </span>
        </div>
      </div>
    </div>
  );
}

export const UIBuilderNode = memo(UIBuilderNodeComponent);
