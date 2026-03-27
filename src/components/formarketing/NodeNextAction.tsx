import { useState } from "react";
import { Plus, FileText, Image, Video, Layers, Megaphone, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeNextActionProps {
  nodeId: string;
  /** If true, doesn't show (node already has outgoing connection — determined externally) */
  hidden?: boolean;
}

const NODE_SUGGESTIONS = [
  { type: "modelView",          label: "Imagen",     icon: Image,     color: "text-aether-purple bg-aether-purple/10 border-aether-purple/20" },
  { type: "videoModel",         label: "Video",      icon: Video,     color: "text-aether-blue   bg-aether-blue/10   border-aether-blue/20" },
  { type: "characterBreakdown", label: "Personaje",  icon: FileText,  color: "text-white         bg-white/5          border-white/10" },
  { type: "layoutBuilder",      label: "Layout",     icon: Layers,    color: "text-emerald-400   bg-emerald-400/10   border-emerald-400/20" },
  { type: "campaignManager",    label: "Campaña",    icon: Megaphone, color: "text-rose-400      bg-rose-400/10      border-rose-400/20" },
];

/**
 * Renders a "+" button below a node that, when clicked, shows a mini-menu
 * suggesting what type of node to connect next. Dispatches a custom event
 * `add-next-node` with { sourceId, nodeType, nodeLabel }.
 */
export function NodeNextAction({ nodeId, hidden }: NodeNextActionProps) {
  const [open, setOpen] = useState(false);

  if (hidden) return null;

  const handleSelect = (type: string, label: string) => {
    window.dispatchEvent(
      new CustomEvent("add-next-node", { detail: { sourceId: nodeId, nodeType: type, nodeLabel: label } })
    );
    setOpen(false);
  };

  return (
    <div className="nodrag nopan absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20">
      {/* Toggle button */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-200 shadow-lg",
          open
            ? "bg-aether-purple border-aether-purple/50 text-white rotate-45"
            : "bg-[#0d0d10] border-white/10 text-white/30 hover:border-aether-purple/40 hover:text-white/70 hover:scale-110"
        )}
        title="Añadir nodo conectado"
      >
        <Plus className="h-3 w-3" />
      </button>

      {/* Suggestion pills */}
      {open && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-row gap-1.5 bg-[#0a0a0d]/95 border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap">
          {NODE_SUGGESTIONS.map((s) => (
            <button
              key={s.type}
              onClick={(e) => { e.stopPropagation(); handleSelect(s.type, s.label); }}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wide transition-all hover:scale-105 active:scale-95",
                s.color
              )}
            >
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
