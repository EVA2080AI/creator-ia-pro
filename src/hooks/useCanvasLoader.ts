import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCanvasStore, type CanvasNodeData } from "@/store/useCanvasStore";
import type { Node } from "@xyflow/react";

/**
 * Fetches canvas_nodes from DB and hydrates the Zustand store once.
 * If spaceId is provided, filters by space.
 */
export function useCanvasLoader(userId: string | undefined, spaceId?: string | null) {
  const [loading, setLoading] = useState(true);
  const setNodes = useCanvasStore((s) => s.setNodes);

  useEffect(() => {
    if (!userId) return;

    const fetchNodes = async () => {
      let query = supabase
        .from("canvas_nodes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (spaceId) {
        query = query.eq("space_id", spaceId);
      } else {
        query = query.is("space_id", null);
      }

      const { data, error } = await query;

      if (!error && data) {
        const flowNodes: Node<CanvasNodeData>[] = data.map((n: any) => ({
          id: n.id,
          type: n.type === "ui" ? "uiNode" : "aiNode",
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
  }, [userId, spaceId, setNodes]);

  return { loading };
}