import { memo, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Download, Share2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BaseNode from './BaseNode';

interface ExportNodeData {
  title?: string;
  content?: string;
  contentType?: 'text' | 'image' | 'video';
}

const ExportNode = ({ id, data }: { id: string; data: ExportNodeData }) => {
  const { setNodes } = useReactFlow();
  const [copied, setCopied] = useState(false);

  const deleteNode = async () => {
    await supabase.from('canvas_nodes').delete().eq('id', id);
    setNodes((nds) => nds.filter((n) => n.id !== id));
    toast.success('Nodo eliminado');
  };

  const handleDownload = () => {
    if (!data.content) {
      toast.error('No hay contenido para exportar');
      return;
    }
    if (
      data.contentType === 'image' ||
      data.content.startsWith('data:image') ||
      data.content.startsWith('http')
    ) {
      const a = document.createElement('a');
      a.href = data.content;
      a.download = `export-${Date.now()}.png`;
      a.target = '_blank';
      a.click();
    } else {
      const blob = new Blob([data.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
    toast.success('¡Exportado!');
  };

  const handleCopy = () => {
    if (!data.content) {
      toast.error('No hay contenido');
      return;
    }
    navigator.clipboard.writeText(data.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copiado al portapapeles');
  };

  const isImage =
    data.content &&
    (data.content.startsWith('data:image') || data.content.startsWith('https://'));

  return (
    <BaseNode
      nodeId={id}
      type="exportNode"
      title={data.title}
      minWidth="260px"
      onDelete={deleteNode}
    >
      <div className="space-y-3">
        {/* Preview */}
        <div className="bg-zinc-50 min-h-[80px] flex items-center justify-center rounded-xl border border-zinc-100 overflow-hidden">
          {isImage ? (
            <img
              src={data.content}
              alt="Export preview"
              className="w-full object-cover max-h-[120px]"
            />
          ) : data.content ? (
            <p className="text-[11px] text-zinc-600 p-4 leading-relaxed line-clamp-4 whitespace-pre-wrap">
              {data.content}
            </p>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center py-6">
              <Share2 className="w-8 h-8 text-zinc-300" />
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">
                Conecta un nodo para exportar
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleDownload}
            disabled={!data.content}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-[12px] font-bold uppercase tracking-wider hover:bg-emerald-600 shadow-md transition-all active:scale-95 disabled:opacity-30"
          >
            <Download className="w-4 h-4" />
            Descargar
          </button>
          <button
            onClick={handleCopy}
            disabled={!data.content}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white border border-zinc-200 shadow-sm text-[12px] text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-30"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(ExportNode);
