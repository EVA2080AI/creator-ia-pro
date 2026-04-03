import { useState } from "react";
import { Plus, FileText, Image, Video, Layers, Megaphone, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeNextActionProps {
  nodeId: string;
  /** If true, doesn't show (node already has outgoing connection — determined externally) */
  hidden?: boolean;
}

const NODE_SUGGESTIONS = [
  { type: "modelView",          label: "Imagen",     icon: Image,     color: "text-blue-500 bg-blue-50 border-blue-100" },
  { type: "videoModel",         label: "Video",      icon: Video,     color: "text-blue-500 bg-blue-50 border-blue-100" },
  { type: "characterBreakdown", label: "Personaje",  icon: FileText,  color: "text-zinc-600 bg-zinc-50 border-zinc-200" },
  { type: "layoutBuilder",      label: "Layout",     icon: Layers,    color: "text-zinc-600 bg-zinc-50 border-zinc-200" },
  { type: "campaignManager",    label: "Campaña",    icon: Megaphone, color: "text-rose-500 bg-rose-50 border-rose-100" },
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
          "w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-200 shadow-sm hover:shadow-md",
          open
            ? "bg-zinc-800 border-zinc-800 text-white rotate-45"
            : "bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 hover:scale-110"
        )}
        title="Añadir nodo conectado"
      >
        <Plus className="h-3 w-3" />
      </button>

      {/* Suggestion pills */}
      {open && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-row gap-1.5 bg-white/95 border border-zinc-200 rounded-2xl p-2 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap">
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
