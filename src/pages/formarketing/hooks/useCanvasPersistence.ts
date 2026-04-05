import { useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Node, Edge, NodeChange, EdgeChange, addEdge } from "@xyflow/react";
import { toast } from "sonner";

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
      const { data: dbNodes, error } = await supabase
        .from('canvas_nodes')
        .select('*')
        .eq('space_id', spaceId);

      if (error) {
        toast.error("Error al cargar el espacio");
        return;
      }

      const flowNodes: Node[] = [];
      let flowEdges: Edge[] = [];

      dbNodes?.forEach(dbNode => {
        if (dbNode.type === 'flow_metadata') {
          flowEdges = (dbNode.data_payload as any)?.edges || [];
        } else {
          flowNodes.push({
            id: dbNode.id,
            type: dbNode.type,
            position: { x: dbNode.pos_x || 0, y: dbNode.pos_y || 0 },
            data: { 
              ...(dbNode.data_payload as any),
              assetUrl: dbNode.asset_url,
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

    loadData();
  }, [user, spaceId, setNodes, setEdges]);

  // Persist Changes (Positions)
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      changes.forEach(async (change) => {
        if (change.type === 'position' && change.position && !change.dragging) {
           await supabase
             .from('canvas_nodes')
             .update({ pos_x: change.position.x, pos_y: change.position.y })
             .eq('id', change.id);
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
        const saveEdges = async () => {
          await supabase
            .from('canvas_nodes')
            .upsert({
              space_id: spaceId,
              user_id: user?.id || '',
              type: 'flow_metadata',
              data_payload: { edges },
              prompt: 'metadata'
            } as any, { onConflict: 'space_id,type' });
        };
        saveEdges();
      }
    },
    [onEdgesChange, edges, spaceId, user]
  );

  const onConnect = useCallback((params: any) => {
    record();
    setEdges((eds: Edge[]) => addEdge(params, eds));
  }, [setEdges, record]);

  return { handleNodesChange, handleEdgesChange, onConnect };
}
