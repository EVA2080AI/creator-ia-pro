import { useCallback, useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Node } from "@xyflow/react";

export interface CanvasNodeData {
  dbId: string;
  type: "image" | "video";
  prompt: string;
  assetUrl: string | null;
  status: "loading" | "ready" | "error";
  errorMessage: string | null;
  [key: string]: unknown;
}

export function useCanvasNodes(userId: string | undefined) {
  const [nodes, setNodes] = useState<Node<CanvasNodeData>[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Fetch nodes on mount
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
          },
        }));
        setNodes(flowNodes);
      }
      setLoading(false);
    };

    fetchNodes();
  }, [userId]);

  // Debounced position update
  const updateNodePosition = useCallback(
    (nodeId: string, x: number, y: number) => {
      if (debounceTimers.current[nodeId]) {
        clearTimeout(debounceTimers.current[nodeId]);
      }

      debounceTimers.current[nodeId] = setTimeout(async () => {
        await supabase
          .from("canvas_nodes")
          .update({ pos_x: x, pos_y: y })
          .eq("id", nodeId);
      }, 500);
    },
    []
  );

  // Add a new node
  const addNode = useCallback(
    async (type: "image" | "video", prompt: string, x: number, y: number) => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("canvas_nodes")
        .insert({
          user_id: userId,
          type,
          prompt,
          pos_x: x,
          pos_y: y,
          status: "loading",
        })
        .select()
        .single();

      if (error || !data) return null;

      const newNode: Node<CanvasNodeData> = {
        id: data.id,
        type: "aiNode",
        position: { x: data.pos_x, y: data.pos_y },
        data: {
          dbId: data.id,
          type: data.type as "image" | "video",
          prompt: data.prompt,
          assetUrl: data.asset_url,
          status: data.status as "loading" | "ready" | "error",
          errorMessage: data.error_message,
        },
      };

      setNodes((prev) => [...prev, newNode]);
      return data.id;
    },
    [userId]
  );

  // Delete a node
  const deleteNode = useCallback(async (nodeId: string) => {
    await supabase.from("canvas_nodes").delete().eq("id", nodeId);
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
  }, []);

  return { nodes, setNodes, loading, updateNodePosition, addNode, deleteNode };
}
