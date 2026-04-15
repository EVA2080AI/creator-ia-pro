import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { DATA_TYPE_COLORS, DataType, DATA_TYPE_LABELS } from './nodeConnections';

interface NodeHandleProps {
  type: 'target' | 'source';
  position: Position;
  id: string;
  dataType: DataType;
  label?: string;
  description?: string;
  required?: boolean;
  isConnected?: boolean;
}

const NodeHandle = memo(({
  type,
  position,
  id,
  dataType,
  label,
  required = false,
  isConnected = false
}: NodeHandleProps) => {
  const color = DATA_TYPE_COLORS[dataType];
  const isLeft = position === Position.Left;
  const isRight = position === Position.Right;

  return (
    <div className="absolute flex items-center" style={{
      [isLeft ? 'left' : 'right']: '-8px',
      top: '50%',
      transform: 'translateY(-50%)',
    }}>
      {/* Label for left handles (inputs) */}
      {isLeft && label && (
        <div className="mr-2 text-[9px] text-zinc-500 font-medium whitespace-nowrap opacity-60 group-hover:opacity-100 transition-opacity">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </div>
      )}

      {/* The actual handle */}
      <Handle
        type={type}
        position={position}
        id={id}
        className={`
          !w-4 !h-4 !border-2 !border-white !z-50
          transition-all duration-200 cursor-crosshair
          hover:!scale-125 hover:!shadow-lg hover:!ring-2 hover:!ring-offset-1
          ${isConnected ? '!scale-110 !ring-2 !ring-offset-1' : ''}
        `}
        style={{
          backgroundColor: color,
          boxShadow: `0 0 0 2px ${color}60`,
          ['--tw-ring-color' as string]: color,
        }}
      />

      {/* Label for right handles (outputs) */}
      {isRight && label && (
        <div className="ml-2 text-[9px] text-zinc-500 font-medium whitespace-nowrap opacity-60 group-hover:opacity-100 transition-opacity">
          {label}
        </div>
      )}
    </div>
  );
});

NodeHandle.displayName = 'NodeHandle';

export default NodeHandle;
