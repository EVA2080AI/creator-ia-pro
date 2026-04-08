import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileCode2, ChevronDown, ChevronUp, Blocks } from 'lucide-react';

interface BlueprintPageData {
  title?: string;
  pageName?: string;
  slug?: string;
  purpose?: string;
  components?: string[];
  isShared?: boolean; // true = shared component node
  accentColor?: string;
  status?: string;
  [key: string]: unknown;
}

interface BlueprintPageNodeProps {
  id: string;
  data: BlueprintPageData;
}

export const BlueprintPageNode = memo(({ id: _id, data }: BlueprintPageNodeProps) => {
  const [expanded, setExpanded] = useState(true);
  const name = data.pageName || data.title || 'Página';
  const components = data.components || [];
  const accent = data.accentColor || '#6366f1';
  const isShared = data.isShared || false;

  return (
    <div className="relative w-[260px] rounded-[20px] overflow-hidden shadow-xl bg-white border border-black/[0.06]">
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ background: accent }} />

      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center"
              style={{ background: `${accent}18` }}>
              {isShared
                ? <Blocks className="h-4 w-4" style={{ color: accent }} />
                : <FileCode2 className="h-4 w-4" style={{ color: accent }} />}
            </div>
            <div>
              <p className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-400 leading-none mb-0.5">
                {isShared ? 'Componente Compartido' : 'Página'}
              </p>
              <h3 className="text-xs font-black text-zinc-900 leading-none">{name}</h3>
            </div>
          </div>

          {components.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="h-6 w-6 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
            >
              {expanded
                ? <ChevronUp className="h-3 w-3 text-zinc-500" />
                : <ChevronDown className="h-3 w-3 text-zinc-500" />}
            </button>
          )}
        </div>

        {/* Slug pill */}
        {data.slug && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg mb-2"
            style={{ background: `${accent}14` }}>
            <span className="text-[8px] font-mono font-bold" style={{ color: accent }}>/{data.slug}</span>
          </div>
        )}

        {/* Purpose */}
        {data.purpose && (
          <p className="text-[9px] text-zinc-500 leading-relaxed mb-2">{data.purpose}</p>
        )}

        {/* Components list */}
        {expanded && components.length > 0 && (
          <div className="bg-zinc-50 rounded-xl p-2">
            <p className="text-[7px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">
              Componentes ({components.length})
            </p>
            <div className="space-y-1">
              {components.map((comp, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full" style={{ background: accent }} />
                  <span className="text-[9px] font-semibold text-zinc-600">{comp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status badge */}
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-1.5 h-1.5 rounded-full"
            style={{ background: data.status === 'synthesized' ? '#22c55e' : '#f59e0b' }} />
          <span className="text-[7px] font-black uppercase tracking-widest text-zinc-400">
            {data.status === 'synthesized' ? 'Código Generado' : 'Pendiente de Síntesis'}
          </span>
        </div>
      </div>

      {/* Input Handle — connects from project root */}
      <Handle
        type="target"
        position={Position.Top}
        id="project-in"
        className="!w-3 !h-3 !bg-zinc-300 !border-2 !border-zinc-400 !rounded-full"
        style={{ top: -6 }}
      />

      {/* Output Handle — could connect to a "Synthesize" node */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="synth-out"
        className="!w-3 !h-3 !border-2 !rounded-full"
        style={{ bottom: -6, background: accent, borderColor: accent }}
      />
    </div>
  );
});

BlueprintPageNode.displayName = 'BlueprintPageNode';
export default BlueprintPageNode;
