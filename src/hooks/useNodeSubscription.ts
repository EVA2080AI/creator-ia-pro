import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCanvasStore } from "@/store/useCanvasStore";

/**
 * Listens for realtime UPDATE events on canvas_nodes for the current user.
 * When a node's status/asset_url changes in the DB, the Zustand store updates automatically.
 */
export function useNodeSubscription(userId: string | undefined) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("canvas-nodes-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "canvas_nodes",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as any;
          updateNodeData(row.id, {
            status: row.status,
            assetUrl: row.asset_url,
            errorMessage: row.error_message,
            name: row.name,
            dataPayload: row.data_payload ?? {},
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, updateNodeData]);
}
