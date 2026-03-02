import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCanvasStore, type CanvasNodeData } from "@/store/useCanvasStore";
import type { Node } from "@xyflow/react";

/**
 * Fetches canvas_nodes from DB and hydrates the Zustand store once.
 */
export function useCanvasLoader(userId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const setNodes = useCanvasStore((s) => s.setNodes);

  useEffect(() => {
    if (!userId) return;

    const fetchNodes = async () => {
      const { data, error } = await supabase
        .from("canvas_nodes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        const flowNodes: Node<CanvasNodeData>[] = data.map((n: any) => ({
          id: n.id,
          type: "aiNode",
          position: { x: n.pos_x, y: n.pos_y },
          data: {
            dbId: n.id,
            type: n.type,
            prompt: n.prompt,
            assetUrl: n.asset_url,
            status: n.status,
            errorMessage: n.error_message,
            dataPayload: n.data_payload ?? {},
          },
        }));
        setNodes(flowNodes);
      }
      setLoading(false);
    };

    fetchNodes();
  }, [userId, setNodes]);

  return { loading };
}
