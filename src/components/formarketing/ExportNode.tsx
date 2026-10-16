import { memo, useState } from 'react';
import { useNodeConnections, useNodesData, useReactFlow } from '@xyflow/react';
import { Download, Share2, Copy, Check, ImageIcon } from 'lucide-react';
import { deleteCanvasNode } from '@/lib/canvas-nodes';
import { toast } from 'sonner';
import BaseNode from './BaseNode';
import { imageOutputOf, textOutputOf } from '@/pages/formarketing/lib/nodeData';

interface ExportNodeData {
  title?: string;
  status?: 'idle' | 'bypassed';
  collapsed?: boolean;
}

// Fase 1: el nodo Exportar LEE lo conectado en vivo (antes dependía de un
// data.content que nada escribía jamás — sus botones nunca se habilitaron).
// Deriva texto/imagen de los nodos fuente con los mismos resolvedores que usa
// la ejecución, así "lo que ves es lo que exportas".
const ExportNode = ({ id, data }: { id: string; data: ExportNodeData }) => {
  const { setNodes } = useReactFlow();
  const [copied, setCopied] = useState(false);

  const connections = useNodeConnections({ id, handleType: 'target' });
  const fuentes = useNodesData(connections.map((c) => c.source));
  const textos = fuentes
    .filter((f): f is NonNullable<typeof f> => !!f)
    .map((f) => textOutputOf({ id: f.id, type: f.type, data: (f.data ?? {}) as Record<string, unknown> }))
    .filter(Boolean);
  const imagenes = fuentes
    .filter((f): f is NonNullable<typeof f> => !!f)
    .map((f) => imageOutputOf({ id: f.id, type: f.type, data: (f.data ?? {}) as Record<string, unknown> }))
    .filter(Boolean);

  const texto = textos.join('\n\n---\n\n');
  const imagen = imagenes[0] || '';
  const hayAlgo = !!texto || !!imagen;

  const deleteNode = async () => {
    await deleteCanvasNode(id);
    setNodes((nds) => nds.filter((n) => n.id !== id));
    toast.success('Nodo eliminado');
  };

  const handleToggleBypass = () => {
    const newStatus = data.status === 'bypassed' ? 'idle' : 'bypassed';
    setNodes((nds) =>
      nds.map((n) => n.id === id ? { ...n, data: { ...n.data, status: newStatus } } : n)
    );
  };

  const handleToggleCollapsed = () => {
    setNodes((nds) =>
      nds.map((n) => n.id === id ? { ...n, data: { ...n.data, collapsed: !data.collapsed } } : n)
    );
  };

  const descargarTexto = () => {
    if (!texto) return;
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canvas-export-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Texto descargado');
  };

  const abrirImagen = () => {
    if (!imagen) return;
    window.open(imagen, '_blank', 'noopener');
  };

  const copiar = async () => {
    if (!texto) return;
    await navigator.clipboard.writeText(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copiado al portapapeles');
  };

  return (
    <BaseNode
      nodeId={id}
      type="exportNode"
      title={data.title}
      minWidth="260px"
      status={data.status}
      onDelete={deleteNode}
      defaultCollapsed={data.collapsed}
      onToggleCollapsed={handleToggleCollapsed}
      onToggleBypass={handleToggleBypass}
    >
      <div className="space-y-3">
        {/* Preview en vivo de lo conectado */}
        <div className="bg-zinc-50 min-h-[80px] flex flex-col items-stretch justify-center rounded-xl border border-zinc-100 overflow-hidden">
          {imagen && (
            <img src={imagen} alt="Imagen conectada" className="w-full object-cover max-h-[120px]" />
          )}
          {texto && (
            <p className="text-[11px] text-zinc-600 p-3 leading-relaxed line-clamp-4 whitespace-pre-wrap">
              {texto}
            </p>
          )}
          {!hayAlgo && (
            <div className="flex flex-col items-center gap-2 text-center py-6">
              <Share2 className="w-8 h-8 text-zinc-300" aria-hidden />
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium px-3">
                Conecta un nodo con resultado para exportarlo
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {texto && (
            <button
              onClick={descargarTexto}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-[12px] font-bold uppercase tracking-wider hover:bg-emerald-600 shadow-md transition-all active:scale-95"
            >
              <Download className="w-4 h-4" aria-hidden />
              Descargar .txt
            </button>
          )}
          {imagen && (
            <button
              onClick={abrirImagen}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 text-white text-[12px] font-bold uppercase tracking-wider hover:bg-zinc-800 shadow-md transition-all active:scale-95"
            >
              <ImageIcon className="w-4 h-4" aria-hidden />
              Abrir imagen
            </button>
          )}
          <button
            onClick={copiar}
            disabled={!texto}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white border border-zinc-200 shadow-sm text-[12px] text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-30"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
            {copied ? 'Copiado' : 'Copiar texto'}
          </button>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(ExportNode);
