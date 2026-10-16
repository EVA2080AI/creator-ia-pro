import { memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Archive, Trash2 } from 'lucide-react';
import { deleteCanvasNode } from '@/lib/canvas-nodes';
import { toast } from 'sonner';

// Fase 0 del plan de Canvas (2026-10-15): Antigravity Bridge y Campaign
// Manager se retiraron con su código (simulaban resultados y métricas), y
// Video IA se ocultó hasta que exista un motor de video real. Los espacios
// guardados pueden traer filas de esos tipos: este placeholder las muestra
// sin fingir que funcionan y deja borrarlas (fila de la base incluida).
const RETIRED_COPY: Record<string, { title: string; detail: string }> = {
  videoModel: {
    title: 'Video IA (en pausa)',
    detail: 'La generación de video vuelve cuando haya un motor real conectado. Este nodo ya no ejecuta ni cobra.',
  },
  campaignManager: {
    title: 'Campaign Manager (retirado)',
    detail: 'Mostraba métricas de ejemplo como si fueran reales, así que lo quitamos.',
  },
  antigravityBridge: {
    title: 'Puente de Referencia (retirado)',
    detail: 'Solo simulaba la clonación de sitios, así que lo quitamos.',
  },
};

const RetiredNode = ({ id, type }: { id: string; type?: string }) => {
  const { setNodes, setEdges } = useReactFlow();
  const copy = RETIRED_COPY[type ?? ''] ?? {
    title: 'Nodo retirado',
    detail: 'Este tipo de nodo ya no existe en el canvas.',
  };

  const borrar = async () => {
    const ok = await deleteCanvasNode(id);
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    if (ok) toast.success('Nodo eliminado');
    else toast.error('Se quitó del lienzo, pero el servidor no confirmó el borrado.');
  };

  return (
    <div className="w-[240px] rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/90 p-4 shadow-sm">
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 rounded-xl bg-zinc-100 border border-zinc-200 shrink-0">
          <Archive className="w-4 h-4 text-zinc-400" aria-hidden />
        </div>
        <div className="min-w-0">
          <h3 className="text-[11px] font-bold text-zinc-600 leading-tight">{copy.title}</h3>
          <p className="text-[10px] text-zinc-400 leading-snug mt-1">{copy.detail}</p>
        </div>
      </div>
      <button
        onClick={borrar}
        className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[10px] font-bold text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all"
      >
        <Trash2 className="w-3 h-3" aria-hidden /> Quitar del lienzo
      </button>
    </div>
  );
};

export default memo(RetiredNode);
