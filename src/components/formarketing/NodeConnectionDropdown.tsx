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
        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border"
        style={{
          background: open ? `${outputColor}22` : 'rgba(255,255,255,0.04)',
          borderColor: open ? `${outputColor}50` : 'rgba(255,255,255,0.1)',
          color: open ? outputColor : 'rgba(255,255,255,0.4)',
        }}
      >
        <Plus className="h-3 w-3" />
        Conectar
        <ChevronRight className={`h-3 w-3 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 z-50 w-56 rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#1e2028', border: '1px solid rgba(255,255,255,0.1)' }}>

            {/* Header showing output type */}
            <div className="px-3 pt-2.5 pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ background: outputColor }} />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
                  Salida: {outputDataType}
                </span>
              </div>
              <p className="text-[10px] text-white/25 mt-0.5">Selecciona el siguiente nodo</p>
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
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-left transition-all hover:bg-white/[0.06]"
                  >
                    <span className="text-base shrink-0">{targetMeta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-white/75">{targetMeta.label}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: outputColor }} />
                        <ArrowRight className="h-2 w-2 text-white/20 shrink-0" />
                        <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: inputColor }} />
                        <span className="text-[9px] text-white/25 truncate">{outputDataType} → {targetMeta.inputHandles[0]?.dataType ?? 'any'}</span>
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
