import { memo } from 'react';
import { Position } from '@xyflow/react';
import NodeHandle from './NodeHandle';
import { HandleDef } from './nodeConnections';
import { useConnectionData } from './useConnectionData';

interface NodeHandlesProps {
  handles: HandleDef[];
  type: 'target' | 'source';
  position: Position;
  nodeId: string;
}

export const NodeHandles = memo(({
  handles,
  type,
  position,
  nodeId
}: NodeHandlesProps) => {
  const { isConnected } = useConnectionData(nodeId);

  if (handles.length === 0) return null;

  // Calculate spacing for multiple handles
  const totalHandles = handles.length;
  const spacing = totalHandles > 1 ? 100 / (totalHandles + 1) : 50;

  return (
    <>
      {handles.map((handle, index) => {
        const topPosition = totalHandles > 1
          ? `${(index + 1) * spacing}%`
          : '50%';

        return (
        <NodeHandle
          key={handle.id}
          type={type}
          position={position}
          id={handle.id}
          dataType={handle.dataType}
          label={handle.label}
          description={handle.description}
          required={handle.required}
          isConnected={isConnected(handle.id)}
          style={{
            top: topPosition,
          }}
        />
      );
      })}
    </>
  );
});

NodeHandles.displayName = 'NodeHandles';

export default NodeHandles;
