import { memo, useState } from 'react';
import { Eye, EyeOff, Copy, Check, Image as ImageIcon, FileText, Type, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface NodeDataPreviewProps {
  data?: any;
  type?: 'text' | 'image' | 'json' | 'any';
  maxLength?: number;
  className?: string;
}

const NodeDataPreview = memo(({
  data,
  type = 'any',
  maxLength = 200,
  className = ''
}: NodeDataPreviewProps) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const handleCopy = () => {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copiado al portapapeles');
  };

  // Format data for display
  const formatData = () => {
    if (typeof data === 'string') {
      // Check if it's an image URL
      if (data.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) || data.startsWith('data:image')) {
        return { type: 'image', content: data };
      }
      // Truncate text
      return {
        type: 'text',
        content: expanded ? data : data.slice(0, maxLength) + (data.length > maxLength ? '...' : '')
      };
    }

    if (typeof data === 'object') {
      return {
        type: 'json',
        content: JSON.stringify(data, null, 2)
      };
    }

    return { type: 'text', content: String(data) };
  };

  const formatted = formatData();
  const displayType = type === 'any' ? formatted.type : type;

  return (
    <div className={`bg-zinc-50/80 border border-zinc-200 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-100/50 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          {displayType === 'image' && <ImageIcon className="w-3.5 h-3.5 text-purple-500" />}
          {displayType === 'text' && <Type className="w-3.5 h-3.5 text-amber-500" />}
          {displayType === 'json' && <FileText className="w-3.5 h-3.5 text-cyan-500" />}
          <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
            {displayType === 'image' && 'Imagen'}
            {displayType === 'text' && 'Texto'}
            {displayType === 'json' && 'Datos'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-white rounded transition-colors"
            title={expanded ? 'Contraer' : 'Expandir'}
          >
            {expanded ? (
              <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </button>
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-white rounded transition-colors"
            title="Copiar"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {displayType === 'image' && (
          <div className="relative group">
            <img
              src={formatted.content}
              alt="Preview"
              className="w-full h-auto max-h-[150px] object-contain rounded-lg bg-zinc-100"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
          </div>
        )}

        {displayType === 'text' && (
          <p className="text-[11px] text-zinc-700 leading-relaxed whitespace-pre-wrap font-mono">
            {formatted.content}
          </p>
        )}

        {displayType === 'json' && (
          <pre className="text-[10px] text-zinc-700 leading-relaxed overflow-x-auto max-h-[200px]">
            <code>{formatted.content}</code>
          </pre>
        )}
      </div>

      {/* Footer with stats */}
      <div className="px-3 py-1.5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
        <span className="text-[9px] text-zinc-400">
          {typeof data === 'string' ? `${data.length} chars` : `${Object.keys(data).length} keys`}
        </span>
        {displayType === 'text' && data.length > maxLength && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-[9px] text-primary hover:text-primary/80 font-medium"
          >
            Ver más
          </button>
        )}
      </div>
    </div>
  );
});

NodeDataPreview.displayName = 'NodeDataPreview';

export default NodeDataPreview;

// Hook for tracking node data
export function useNodeData(nodeId: string) {
  // This would connect to your data flow system
  // For now, return a placeholder
  return {
    data: null,
    isLoading: false,
    error: null
  };
}
