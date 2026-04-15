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
  style?: React.CSSProperties;
}

const NodeHandle = memo(({
  type,
  position,
  id,
  dataType,
  label,
  required = false,
  isConnected = false,
  style: customStyle
}: NodeHandleProps) => {
  const color = DATA_TYPE_COLORS[dataType];
  const isLeft = position === Position.Left;
  const isRight = position === Position.Right;

  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        [isLeft ? 'left' : 'right']: '0px',
        top: customStyle?.top || '50%',
        transform: customStyle?.top ? undefined : 'translateY(-50%)',
        width: '24px',
        height: '24px',
      }}
    >
      {/* Label for left handles (inputs) - shown on hover */}
      {isLeft && label && (
        <div className="absolute right-6 mr-1 px-2 py-0.5 bg-zinc-800 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
          {label}
          {required && <span className="text-red-300 ml-0.5">*</span>}
        </div>
      )}

      {/* The actual handle - VISIBLE DOT */}
      <div
        className={`
          w-4 h-4 rounded-full border-2 border-white shadow-md
          transition-all duration-200 cursor-crosshair
          hover:scale-125 hover:shadow-lg
          ${isConnected ? 'ring-2 ring-offset-1 scale-110' : ''}
        `}
        style={{
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}, 0 0 0 2px white`,
          ['--tw-ring-color' as string]: color,
        }}
      >
        <Handle
          type={type}
          position={position}
          id={id}
          className="!w-full !h-full !opacity-0 !border-0 !bg-transparent"
          style={{ position: 'absolute', inset: 0 }}
        />
      </div>

      {/* Label for right handles (outputs) - shown on hover */}
      {isRight && label && (
        <div className="absolute left-6 ml-1 px-2 py-0.5 bg-zinc-800 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
          {label}
        </div>
      )}
    </div>
  );
});

NodeHandle.displayName = 'NodeHandle';

export default NodeHandle;
