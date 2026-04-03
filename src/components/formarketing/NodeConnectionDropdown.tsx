import { useState } from 'react';
import { Plus, ArrowRight, ChevronRight } from 'lucide-react';
import { NODE_META, DATA_TYPE_COLORS } from './nodeConnections';

interface NodeConnectionDropdownProps {
  nodeType: string;
  nodeId: string;
  onAddConnected: (sourceId: string, targetType: string) => void;
}

export function NodeConnectionDropdown({ nodeType, nodeId, onAddConnected }: NodeConnectionDropdownProps) {
  const [open, setOpen] = useState(false);
  const meta = NODE_META[nodeType];
  if (!meta || meta.compatibleTargets.length === 0) return null;

  const outputDataType = meta.outputHandles[0]?.dataType ?? 'any';
  const outputColor = DATA_TYPE_COLORS[outputDataType];

  return (
    <div className="relative flex justify-center mt-2 nodrag nopan">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${!open ? 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100' : 'shadow-sm'}`}
        style={open ? {
          background: `${outputColor}15`,
          borderColor: `${outputColor}40`,
          color: outputColor,
        } : undefined}
      >
        <Plus className="h-3 w-3" />
        Conectar
        <ChevronRight className={`h-3 w-3 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-64 rounded-[1.75rem] overflow-hidden shadow-2xl bg-white/95 backdrop-blur-xl border border-zinc-200/60 transition-all animate-in zoom-in-95 duration-200">

            {/* Header showing output type */}
            <div className="px-4 pt-3.5 pb-2.5 border-b border-zinc-100/80 bg-zinc-50/40">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full shadow-sm" style={{ background: outputColor }} />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Salida: {outputDataType}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">Selecciona el siguiente nodo</p>
            </div>

            {/* Compatible targets */}
            <div className="p-1.5 flex flex-col gap-0.5">
              {meta.compatibleTargets.map(targetType => {
                const targetMeta = NODE_META[targetType];
                if (!targetMeta) return null;
                const inputColor = DATA_TYPE_COLORS[targetMeta.inputHandles[0]?.dataType ?? 'any'];
                return (
                  <button
                    key={targetType}
                    onClick={() => { onAddConnected(nodeId, targetType); setOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-left transition-all hover:bg-zinc-50"
                  >
                    <span className="text-base shrink-0">{targetMeta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-zinc-700">{targetMeta.label}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="h-1.5 w-1.5 rounded-full shrink-0 shadow-sm" style={{ background: outputColor }} />
                        <ArrowRight className="h-2 w-2 text-zinc-300 shrink-0" />
                        <div className="h-1.5 w-1.5 rounded-full shrink-0 shadow-sm" style={{ background: inputColor }} />
                        <span className="text-[9px] text-zinc-500 truncate">{outputDataType} → {targetMeta.inputHandles[0]?.dataType ?? 'any'}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
