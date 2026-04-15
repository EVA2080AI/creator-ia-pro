import { useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';

export function useConnectionData(nodeId: string) {
  const { getEdges } = useReactFlow();

  const edges = getEdges();

  const connectedHandles = useMemo(() => {
    const connected = new Set<string>();

    edges.forEach(edge => {
      if (edge.source === nodeId && edge.sourceHandle) {
        connected.add(edge.sourceHandle);
      }
      if (edge.target === nodeId && edge.targetHandle) {
        connected.add(edge.targetHandle);
      }
    });

    return connected;
  }, [edges, nodeId]);

  const isConnected = (handleId: string): boolean => {
    return connectedHandles.has(handleId);
  };

  const getConnectedSourceData = (handleId: string) => {
    const edge = edges.find(e => e.target === nodeId && e.targetHandle === handleId);
    if (!edge) return null;
    return edge;
  };

  const getConnectedTargetData = (handleId: string) => {
    const edge = edges.find(e => e.source === nodeId && e.sourceHandle === handleId);
    if (!edge) return null;
    return edge;
  };

  return {
    isConnected,
    connectedHandles,
    getConnectedSourceData,
    getConnectedTargetData,
  };
}
