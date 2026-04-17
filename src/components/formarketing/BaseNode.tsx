import { memo, ReactNode, useState } from 'react';
import { Position, useReactFlow } from '@xyflow/react';
import { Trash2, Play, Loader2, AlertCircle, PlayCircle, ArrowRight, ArrowLeft, Eye, Database, Minimize2, Maximize2, Power, PowerOff } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from 'sonner';
import { NODE_META, DATA_TYPE_COLORS, DataType } from './nodeConnections';
import { NodeHandles } from './NodeHandles';
import NodeDataPreview from './NodeDataPreview';

interface BaseNodeProps {
  nodeId: string;
  type: string;
  title?: string;
  status?: 'idle' | 'loading' | 'executing' | 'ready' | 'error' | 'done' | 'running' | 'bypassed';
  error?: string;
  onDelete?: () => void;
  onExecute?: () => void;
  children: ReactNode;
  minWidth?: string;
  outputData?: any;
  outputType?: 'text' | 'image' | 'json' | 'any';
  defaultCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  onToggleBypass?: () => void;
}

interface NodeDataWithContext extends Record<string, unknown> {
  _context?: {
    executeUpstream?: (id: string) => Promise<void>;
  };
}

const BaseNode = memo(({
  nodeId,
  type,
  title,
  status = 'idle',
  error,
  onDelete,
  onExecute,
  children,
  minWidth = '280px',
  outputData,
  outputType = 'any',
  defaultCollapsed = false,
  onToggleCollapsed,
  onToggleBypass
}: BaseNodeProps) => {
  const { getNode } = useReactFlow();
  const [isUpstreamExecuting, setIsUpstreamExecuting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const meta = NODE_META[type];
  const isExecuting = status === 'executing' || status === 'running';
  const isError = status === 'error';
  const isReady = status === 'ready' || status === 'done';
  const isBypassed = status === 'bypassed';
  const hasOutput = outputData && (isReady || status === 'done') && !isBypassed;

  const handleToggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
    onToggleCollapsed?.();
  };

  const handleToggleBypass = () => {
    onToggleBypass?.();
  };

  // Get executeUpstream from node data context
  const node = getNode(nodeId);
  const nodeData = node?.data as NodeDataWithContext;
  const executeUpstream = nodeData?._context?.executeUpstream;

  const handleExecuteUpstream = async () => {
    if (!executeUpstream || isUpstreamExecuting) return;
    setIsUpstreamExecuting(true);
    try {
      await executeUpstream(nodeId);
    } catch (err) {
      toast.error('Error ejecutando flujo upstream');
    } finally {
      setIsUpstreamExecuting(false);
    }
  };

  const borderColor = isExecuting ? 'border-primary' :
                     isError ? 'border-red-400' :
                     isReady ? 'border-emerald-400' :
                     isBypassed ? 'border-zinc-300' :
                     'border-zinc-200';

  const bgColor = isBypassed ? 'bg-zinc-50' : 'bg-white';

  const nodeContent = (
    <div
      className={`
        group relative rounded-2xl overflow-hidden
        ${bgColor} border-2 transition-all duration-300
        hover:shadow-xl hover:scale-[1.01]
        ${isExecuting ? 'shadow-lg ring-2 ring-primary/20' : 'shadow-sm'}
        ${borderColor}
        ${isBypassed ? 'opacity-60' : ''}
      `}
      style={{ minWidth: isCollapsed ? '180px' : minWidth, maxWidth: isCollapsed ? '200px' : '340px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/80">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{
              backgroundColor: meta?.color ? `${meta.color}15` : '#f3f4f6',
              color: meta?.color || '#6b7280',
            }}
          >
            {meta?.emoji || '🔹'}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider">
              {title || meta?.label || type}
            </span>
            {meta?.description && (
              <span className="text-[9px] text-zinc-400 truncate max-w-[140px]">
                {meta.description}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Status indicator */}
          {isExecuting && (
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
          {isReady && !isBypassed && (
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
          {isError && (
            <div className="w-2 h-2 rounded-full bg-red-400" />
          )}
          {isBypassed && (
            <div className="w-2 h-2 rounded-full bg-zinc-400" title="Bypassed" />
          )}

          {/* Collapse/Expand button */}
          <button
            onClick={handleToggleCollapsed}
            className="p-1.5 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 rounded-lg transition-colors"
            title={isCollapsed ? 'Expandir' : 'Contraer'}
          >
            {isCollapsed ? (
              <Maximize2 className="w-3.5 h-3.5" />
            ) : (
              <Minimize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Bypass button */}
          {onToggleBypass && (
            <button
              onClick={handleToggleBypass}
              className={`p-1.5 rounded-lg transition-colors ${
                isBypassed
                  ? 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300'
                  : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600'
              }`}
              title={isBypassed ? 'Reactivar nodo' : 'Bypass (desactivar)'}
            >
              {isBypassed ? (
                <PowerOff className="w-3.5 h-3.5" />
              ) : (
                <Power className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Execute button */}
          {onExecute && !isBypassed && status !== 'executing' && status !== 'running' && (
            <button
              onClick={onExecute}
              className="p-1.5 hover:bg-primary/10 text-zinc-400 hover:text-primary rounded-lg transition-colors"
              title="Ejecutar nodo"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          {/* Loading spinner */}
          {isExecuting && (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          )}

          {/* Delete button */}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-lg transition-colors"
              title="Eliminar nodo"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-[10px] text-red-600">{error}</span>
        </div>
      )}

      {/* Content - Hidden when collapsed */}
      {!isCollapsed && (
        <div className="relative p-4">
          {children}
        </div>
      )}

      {/* Data Preview Section - Shows when node has output and not collapsed */}
      {!isCollapsed && hasOutput && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                Output
              </span>
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1 text-[9px] text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <Eye className="w-3 h-3" />
              {showPreview ? 'Ocultar' : 'Ver'}
            </button>
          </div>
          {showPreview && (
            <NodeDataPreview
              data={outputData}
              type={outputType}
              maxLength={150}
            />
          )}
        </div>
      )}

      {/* Bypass indicator */}
      {isBypassed && (
        <div className="px-4 py-2 bg-zinc-100 border-t border-zinc-200 flex items-center justify-center gap-2">
          <PowerOff className="w-3 h-3 text-zinc-400" />
          <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-wider">Nodo Desactivado (Bypass)</span>
        </div>
      )}

      {/* Connection indicators footer - Hidden when collapsed */}
      {!isCollapsed && (
      <div className="px-4 py-2 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400">
        {/* Input indicators */}
        <div className="flex items-center gap-2">
          {meta?.inputHandles && meta.inputHandles.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <ArrowLeft className="w-3 h-3" />
              <div className="flex items-center gap-1">
                {meta.inputHandles.map((h) => (
                  <span
                    key={h.id}
                    className="w-2 h-2 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: DATA_TYPE_COLORS[h.dataType] }}
                    title={`${h.label} (${h.dataType})`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <span className="text-zinc-300">Sin entradas</span>
          )}
        </div>

        {/* Output indicators */}
        <div className="flex items-center gap-2">
          {meta?.outputHandles && meta.outputHandles.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1">
                {meta.outputHandles.map((h) => (
                  <span
                    key={h.id}
                    className="w-2 h-2 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: DATA_TYPE_COLORS[h.dataType] }}
                    title={`${h.label} (${h.dataType})`}
                  />
                ))}
              </div>
              <ArrowRight className="w-3 h-3" />
            </div>
          ) : (
            <span className="text-zinc-300">Sin salidas</span>
          )}
        </div>
      </div>
      )}

      {/* Input handles (left side) - ALWAYS CLICKABLE */}
      {meta?.inputHandles && meta.inputHandles.length > 0 && (
        <div className="absolute inset-y-0 -left-2 w-6 z-50">
          <NodeHandles
            handles={meta.inputHandles}
            type="target"
            position={Position.Left}
            nodeId={nodeId}
          />
        </div>
      )}

      {/* Output handles (right side) - ALWAYS CLICKABLE */}
      {meta?.outputHandles && meta.outputHandles.length > 0 && (
        <div className="absolute inset-y-0 -right-2 w-6 z-50">
          <NodeHandles
            handles={meta.outputHandles}
            type="source"
            position={Position.Right}
            nodeId={nodeId}
          />
        </div>
      )}
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {nodeContent}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48" align="end" alignOffset={-10}>
        <ContextMenuItem
          onClick={handleExecuteUpstream}
          disabled={!executeUpstream || isUpstreamExecuting}
          className="cursor-pointer"
        >
          <PlayCircle className="mr-2 h-4 w-4 text-primary" />
          <span className="text-xs">
            {isUpstreamExecuting ? 'Ejecutando...' : 'Ejecutar desde aquí'}
          </span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={onExecute}
          disabled={!onExecute || isExecuting || isBypassed}
          className="cursor-pointer"
        >
          <Play className="mr-2 h-4 w-4 text-emerald-500" />
          <span className="text-xs">
            {isExecuting ? 'Ejecutando...' : 'Ejecutar este nodo'}
          </span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={handleToggleCollapsed}
          className="cursor-pointer"
        >
          {isCollapsed ? (
            <>
              <Maximize2 className="mr-2 h-4 w-4 text-zinc-500" />
              <span className="text-xs">Expandir nodo</span>
            </>
          ) : (
            <>
              <Minimize2 className="mr-2 h-4 w-4 text-zinc-500" />
              <span className="text-xs">Contraer nodo</span>
            </>
          )}
        </ContextMenuItem>
        <ContextMenuSeparator />
        {onToggleBypass && (
          <>
            <ContextMenuItem
              onClick={handleToggleBypass}
              className="cursor-pointer"
            >
              {isBypassed ? (
                <>
                  <Power className="mr-2 h-4 w-4 text-emerald-500" />
                  <span className="text-xs">Reactivar nodo</span>
                </>
              ) : (
                <>
                  <PowerOff className="mr-2 h-4 w-4 text-zinc-500" />
                  <span className="text-xs">Bypass (desactivar)</span>
                </>
              )}
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem
          onClick={onDelete}
          disabled={!onDelete}
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span className="text-xs">Eliminar nodo</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

BaseNode.displayName = 'BaseNode';

export default BaseNode;
