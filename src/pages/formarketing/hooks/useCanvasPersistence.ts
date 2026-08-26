import { useCallback, useEffect } from "react";
import { Node, Edge, NodeChange, EdgeChange, addEdge } from "@xyflow/react";
import { toast } from "sonner";
import { listCanvasNodes, updateCanvasNode, upsertCanvasEdges } from "@/lib/canvas-nodes";

export function useCanvasPersistence(
  spaceId: string | null,
  user: any,
  setNodes: any,
  setEdges: any,
  onNodesChange: any,
  onEdgesChange: any,
  edges: Edge[],
  record: () => void
) {
  // Load from DB
  useEffect(() => {
    if (!user || !spaceId) return;

    const loadData = async () => {
      const dbNodes = await listCanvasNodes(spaceId);

      const flowNodes: Node[] = [];
      let flowEdges: Edge[] = [];

      dbNodes.forEach((dbNode) => {
        if (dbNode.type === 'flow_metadata') {
          flowEdges = (dbNode.dataPayload as any)?.edges || [];
        } else {
          flowNodes.push({
            id: dbNode.id,
            type: dbNode.type,
            position: { x: dbNode.posX || 0, y: dbNode.posY || 0 },
            data: {
              ...(dbNode.dataPayload as any),
              assetUrl: dbNode.assetUrl,
              status: dbNode.status,
              prompt: dbNode.prompt
            }
          });
        }
      });

      if (flowNodes.length > 0) {
        setNodes(flowNodes);
        setEdges(flowEdges);
      }
    };

    loadData().catch(() => toast.error("Error al cargar el espacio"));
  }, [user, spaceId, setNodes, setEdges]);

  // Persist Changes (Positions)
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && !change.dragging) {
          void updateCanvasNode(change.id, { posX: change.position.x, posY: change.position.y });
        }
      });
    },
    [onNodesChange]
  );

  // Persist Edges
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      if (spaceId) {
        void upsertCanvasEdges(spaceId, edges);
      }
    },
    [onEdgesChange, edges, spaceId]
  );

  const onConnect = useCallback((params: any) => {
    record();
    setEdges((eds: Edge[]) => addEdge(params, eds));
  }, [setEdges, record]);

  return { handleNodesChange, handleEdgesChange, onConnect };
}
