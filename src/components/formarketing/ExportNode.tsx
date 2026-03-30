import { memo, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Download, Trash2, Share2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExportNodeData {
  title?: string;
  content?: string;   // text or image URL received from upstream
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
    if (!data.content) { toast.error('No hay contenido para exportar'); return; }
    if (data.contentType === 'image' || data.content.startsWith('data:image') || data.content.startsWith('http')) {
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
    if (!data.content) { toast.error('No hay contenido'); return; }
    navigator.clipboard.writeText(data.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copiado al portapapeles');
  };

  const isImage = data.content && (data.content.startsWith('data:image') || data.content.startsWith('https://'));

  return (
    <div className="group relative rounded-3xl overflow-hidden aether-card w-[260px] shadow-2xl">
      {/* Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Download className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-[11px] font-bold text-white/90 tracking-wide font-sans uppercase">
            {data.title || 'Exportar / Publicar'}
          </h3>
        </div>
        <button onClick={deleteNode} className="p-2 hover:bg-rose-500/10 text-white/20 hover:text-rose-500 rounded-lg transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Preview */}
      <div className="bg-black/30 min-h-[100px] flex items-center justify-center border-b border-white/[0.05] overflow-hidden">
        {isImage ? (
          <img src={data.content} alt="Export preview" className="w-full object-cover max-h-[140px]" />
        ) : data.content ? (
          <p className="text-[10px] text-white/50 p-4 leading-relaxed line-clamp-4 whitespace-pre-wrap">{data.content}</p>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center py-6">
            <Share2 className="w-8 h-8 text-white/10" />
            <span className="text-[10px] text-white/20 uppercase tracking-widest font-sans">Conecta un nodo para exportar</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 space-y-2.5 bg-black/20">
        <button
          onClick={handleDownload}
          disabled={!data.content}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-30"
        >
          <Download className="w-3.5 h-3.5" />
          Descargar
        </button>
        <button
          onClick={handleCopy}
          disabled={!data.content}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/50 hover:text-white hover:border-white/20 transition-all active:scale-95 disabled:opacity-30"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>

        <div className="flex items-center gap-1.5 pt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          <span className="text-[9px] text-white/20 uppercase tracking-widest font-sans">Nodo de salida final</span>
        </div>
      </div>

      {/* Input handle — accepts any type (emerald) */}
      <Handle
        type="target"
        position={Position.Left}
        id="any-in"
        className="!w-3 !h-3 !-left-1.5 !bg-emerald-400 !border-2 !border-[#191a1f] hover:scale-125 transition-transform"
      />
    </div>
  );
};

export default memo(ExportNode);
