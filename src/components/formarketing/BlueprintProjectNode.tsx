import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cpu, Layers, Code2 } from 'lucide-react';

interface BlueprintProjectData {
  title?: string;
  projectName?: string;
  description?: string;
  niche?: string;
  colorPalette?: { primary: string; secondary: string; accent: string; bg: string };
  techStack?: { framework: string; deps: string[] };
  status?: string;
  [key: string]: unknown;
}

interface BlueprintProjectNodeProps {
  id: string;
  data: BlueprintProjectData;
}

export const BlueprintProjectNode = memo(({ id: _id, data }: BlueprintProjectNodeProps) => {
  const name = data.projectName || data.title || 'Genesis Project';
  const palette = data.colorPalette;

  return (
    <div className="relative w-[320px] rounded-[24px] overflow-hidden shadow-2xl border border-white/20"
      style={{ background: palette ? `linear-gradient(135deg, ${palette.bg}ee, ${palette.primary}22)` : 'linear-gradient(135deg, #090909, #1a1a2e)' }}
    >
      {/* Color Palette Bar */}
      {palette && (
        <div className="flex h-1 w-full">
          <div className="flex-1" style={{ background: palette.primary }} />
          <div className="flex-1" style={{ background: palette.secondary }} />
          <div className="flex-1" style={{ background: palette.accent }} />
          <div className="flex-1" style={{ background: palette.bg }} />
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: palette?.primary || '#6366f1' }}>
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40 mb-0.5">Blueprint Raíz</p>
            <h3 className="text-sm font-black text-white leading-none">{name}</h3>
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <p className="text-[10px] text-white/60 leading-relaxed mb-3 border-l-2 pl-2"
            style={{ borderColor: palette?.accent || '#a78bfa' }}>
            {data.description}
          </p>
        )}

        {/* Meta Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {data.niche && (
            <div className="bg-white/5 rounded-xl p-2">
              <p className="text-[7px] font-black uppercase tracking-widest text-white/30 mb-0.5">Nicho</p>
              <p className="text-[10px] font-bold text-white">{data.niche}</p>
            </div>
          )}
          {data.techStack?.framework && (
            <div className="bg-white/5 rounded-xl p-2">
              <p className="text-[7px] font-black uppercase tracking-widest text-white/30 mb-0.5">Framework</p>
              <p className="text-[10px] font-bold text-white capitalize">{data.techStack.framework}</p>
            </div>
          )}
        </div>

        {/* Dependencies */}
        {data.techStack?.deps && data.techStack.deps.length > 0 && (
          <div className="bg-white/5 rounded-xl p-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Code2 className="h-3 w-3 text-white/40" />
              <p className="text-[7px] font-black uppercase tracking-widest text-white/40">Dependencias</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {data.techStack.deps.slice(0, 6).map((dep) => (
                <span key={dep}
                  className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-lg bg-white/10 text-white/70">
                  {dep}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-2 mt-3">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: palette?.accent || '#34d399' }} />
          <span className="text-[8px] font-black uppercase tracking-widest text-white/30">
            {data.status === 'ready' ? 'Arquitectura Verificada' : 'Blueprint Cargado'}
          </span>
        </div>
      </div>

      {/* Output Handle — connects to pages */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="pages-out"
        className="!w-3 !h-3 !bg-white/40 !border-2 !border-white/60 !rounded-full"
        style={{ bottom: -6 }}
      />

      {/* Shared Components Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="shared-out"
        className="!w-3 !h-3 !bg-white/40 !border-2 !border-white/60 !rounded-full"
        style={{ right: -6 }}
      />
    </div>
  );
});

BlueprintProjectNode.displayName = 'BlueprintProjectNode';
export default BlueprintProjectNode;
