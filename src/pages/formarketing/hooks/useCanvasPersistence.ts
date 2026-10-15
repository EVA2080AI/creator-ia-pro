import { useCallback, useEffect } from "react";
import { Node, Edge, NodeChange, EdgeChange, applyEdgeChanges, useReactFlow } from "@xyflow/react";
import { toast } from "sonner";
import { deleteCanvasNode, listCanvasNodes, updateCanvasNode, upsertCanvasEdges } from "@/lib/canvas-nodes";

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
  const { getNodes } = useReactFlow();

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
              // Un 'executing' guardado (pestaña cerrada a mitad de ejecución)
              // volvía como spinner eterno al recargar.
              status: dbNode.status === 'executing' ? 'idle' : dbNode.status,
              prompt: dbNode.prompt
            }
          });
        }
      });

      // No pisar el lienzo si el usuario ya puso nodos localmente y la base aún
      // no los tiene: es la transición "sin espacio → espacio automático" (el
      // espacio se crea con el primer nodo y esta carga corre en paralelo).
      if (flowNodes.length > 0 || getNodes().length === 0) {
        setNodes(flowNodes);
        setEdges(flowEdges);
      }
    };

    loadData().catch(() => toast.error("Error al cargar el espacio"));
  }, [user, spaceId, setNodes, setEdges, getNodes]);

  // Persist Changes (Positions + borrado real: antes Supr/Backspace dejaba la
  // fila huérfana en la base y el nodo resucitaba al recargar)
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      if (!spaceId) return;
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && !change.dragging) {
          void updateCanvasNode(change.id, { posX: change.position.x, posY: change.position.y });
        } else if (change.type === 'remove') {
          void deleteCanvasNode(change.id);
        }
      });
    },
    [onNodesChange, spaceId]
  );

  // Persist Edges. El bug anterior: se guardaba `edges` del render previo (el
  // cambio recién hecho siempre quedaba fuera) y se disparaba hasta al
  // seleccionar un cable. Ahora se calcula el array resultante con los mismos
  // changes que aplica ReactFlow y solo se guarda cuando algo cambió de verdad.
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      if (!spaceId) return;
      const relevante = changes.some(c => c.type === 'remove' || c.type === 'add' || c.type === 'replace');
      if (!relevante) return;
      const next = applyEdgeChanges(changes, edges);
      void upsertCanvasEdges(spaceId, next as Edge[]);
    },
    [onEdgesChange, edges, spaceId]
  );

  return { handleNodesChange, handleEdgesChange };
}
