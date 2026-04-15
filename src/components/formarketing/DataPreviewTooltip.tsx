import { memo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Image as ImageIcon, Type, FileJson, Clock } from 'lucide-react';

interface DataPreviewTooltipProps {
  nodeId: string;
  nodeType?: string;
  data?: any;
  position?: { x: number; y: number };
  isVisible: boolean;
}

const DataPreviewTooltip = memo(({
  nodeId,
  nodeType,
  data,
  position,
  isVisible
}: DataPreviewTooltipProps) => {
  if (!isVisible || !data) return null;

  const formatPreview = () => {
    if (typeof data === 'string') {
      // Image URL
      if (data.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i) || data.startsWith('data:image')) {
        return { type: 'image', preview: data };
      }
      // Text
      return {
        type: 'text',
        preview: data.slice(0, 150) + (data.length > 150 ? '...' : '')
      };
    }

    if (typeof data === 'object') {
      const keys = Object.keys(data);
      return {
        type: 'json',
        preview: `${keys.length} propiedades: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`
      };
    }

    return { type: 'text', preview: String(data) };
  };

  const formatted = formatPreview();

  const tooltip = (
    <div
      className="fixed z-[100] pointer-events-none animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: position?.x || 0,
        top: position?.y || 0,
        transform: 'translate(10px, -50%)'
      }}
    >
      <div className="bg-zinc-900/95 backdrop-blur-xl text-white p-3 rounded-xl shadow-2xl border border-zinc-700/50 min-w-[200px] max-w-[300px]">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-700/50">
          {formatted.type === 'image' && <ImageIcon className="w-4 h-4 text-purple-400" />}
          {formatted.type === 'text' && <Type className="w-4 h-4 text-amber-400" />}
          {formatted.type === 'json' && <FileJson className="w-4 h-4 text-cyan-400" />}
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            {formatted.type === 'image' && 'Imagen'}
            {formatted.type === 'text' && 'Texto'}
            {formatted.type === 'json' && 'Datos JSON'}
          </span>
        </div>

        {/* Preview Content */}
        <div className="space-y-2">
          {formatted.type === 'image' ? (
            <img
              src={formatted.preview}
              alt="Preview"
              className="w-full h-24 object-cover rounded-lg"
            />
          ) : (
            <p className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono">
              {formatted.preview}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-2 pt-2 border-t border-zinc-700/50 flex items-center justify-between"
003e
          <span className="text-[9px] text-zinc-500">
            ID: {nodeId.slice(0, 8)}...
          </span>
          <span className="text-[9px] text-zinc-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Preview
          </span>
        </div>
      </div>
    </div>
  );

  return createPortal(tooltip, document.body);
});

DataPreviewTooltip.displayName = 'DataPreviewTooltip';

export default DataPreviewTooltip;

// Hook for tooltip positioning
export function usePreviewTooltip() {
  const [tooltipState, setTooltipState] = useState<{
    isVisible: boolean;
    position: { x: number; y: number };
    data: any;
  }>({
    isVisible: false,
    position: { x: 0, y: 0 },
    data: null
  });

  const showTooltip = useCallback((data: any, event: MouseEvent) => {
    setTooltipState({
      isVisible: true,
      position: { x: event.clientX, y: event.clientY },
      data
    });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltipState(prev => ({ ...prev, isVisible: false }));
  }, []);

  const updatePosition = useCallback((event: MouseEvent) => {
    setTooltipState(prev => ({
      ...prev,
      position: { x: event.clientX, y: event.clientY }
    }));
  }, []);

  return {
    tooltipState,
    showTooltip,
    hideTooltip,
    updatePosition
  };
}
