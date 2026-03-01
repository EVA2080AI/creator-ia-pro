import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  type NodeChange,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useCanvasNodes, type CanvasNodeData } from "@/hooks/useCanvasNodes";
import { AINode } from "@/components/canvas/AINode";
import { CanvasToolbar } from "@/components/canvas/CanvasToolbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const nodeTypes = { aiNode: AINode };

const Canvas = () => {
  const { user, loading: authLoading, signOut } = useAuth("/auth");
  const { profile, refreshProfile } = useProfile(user?.id);
  const { nodes: dbNodes, loading: nodesLoading, updateNodePosition, addNode, deleteNode } = useCanvasNodes(user?.id);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CanvasNodeData>>([]);
  const [generating, setGenerating] = useState(false);

  // Sync dbNodes to flow state
  useEffect(() => {
    setNodes(dbNodes);
  }, [dbNodes, setNodes]);

  // Handle node position changes with debounce
  const handleNodesChange = useCallback(
    (changes: NodeChange<Node<CanvasNodeData>>[]) => {
      onNodesChange(changes);

      changes.forEach((change) => {
        if (change.type === "position" && change.position && !change.dragging) {
          updateNodePosition(change.id, change.position.x, change.position.y);
        }
      });
    },
    [onNodesChange, updateNodePosition]
  );

  // Listen for delete events from nodes
  useEffect(() => {
    const handler = (e: Event) => {
      const nodeId = (e as CustomEvent).detail;
      deleteNode(nodeId);
      toast.success("Nodo eliminado");
    };
    window.addEventListener("delete-node", handler);
    return () => window.removeEventListener("delete-node", handler);
  }, [deleteNode]);

  const handleGenerate = useCallback(
    async (type: "image" | "video", prompt: string) => {
      if (!user) return;
      setGenerating(true);

      const cost = type === "image" ? 1 : 20;

      // Debit credits locally first (optimistic)
      const centerX = Math.random() * 600 - 300;
      const centerY = Math.random() * 400 - 200;

      try {
        // Create node in DB
        const nodeId = await addNode(type, prompt, centerX, centerY);
        if (!nodeId) throw new Error("No se pudo crear el nodo");

        // Debit credits
        await supabase.from("profiles").update({
          credits_balance: (profile?.credits_balance ?? 0) - cost,
        }).eq("user_id", user.id);

        // Record transaction
        await supabase.from("transactions").insert({
          user_id: user.id,
          node_id: nodeId,
          type: "debit",
          amount: cost,
          description: `${type} generation: ${prompt.slice(0, 50)}`,
        });

        await refreshProfile();

        // Simulate AI generation (placeholder - will be replaced with real API)
        setTimeout(async () => {
          // For demo: set node to ready with a placeholder
          const placeholderUrl = type === "image"
            ? `https://picsum.photos/seed/${nodeId}/512/512`
            : null;

          await supabase
            .from("canvas_nodes")
            .update({
              status: placeholderUrl ? "ready" : "error",
              asset_url: placeholderUrl,
              error_message: placeholderUrl ? null : "Video generation coming soon",
            })
            .eq("id", nodeId);

          // Update local state
          setNodes((prev) =>
            prev.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      status: (placeholderUrl ? "ready" : "error") as "ready" | "error",
                      assetUrl: placeholderUrl,
                      errorMessage: placeholderUrl ? null : "Video generation coming soon",
                    },
                  }
                : n
            )
          );

          toast.success(type === "image" ? "¡Imagen generada!" : "Video en proceso...");
          setGenerating(false);
        }, 2000);
      } catch (error: any) {
        toast.error(error.message || "Error al generar");
        setGenerating(false);
      }
    },
    [user, profile, addNode, refreshProfile, setNodes]
  );

  if (authLoading || nodesLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-canvas">
        <Loader2 className="h-8 w-8 animate-spin-slow text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-canvas">
      <ReactFlow
        nodes={nodes}
        edges={[]}
        onNodesChange={handleNodesChange}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        className="canvas-grid"
        minZoom={0.1}
        maxZoom={2}
      >
        <Background color="hsl(222 30% 16%)" gap={24} size={1} />
        <Controls
          className="!bg-card !border-border !rounded-xl !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted"
        />
        <MiniMap
          className="!bg-card !border-border !rounded-xl"
          nodeColor="hsl(187 80% 48%)"
          maskColor="hsl(222 47% 4% / 0.8)"
        />
      </ReactFlow>

      {/* Toolbar */}
      <CanvasToolbar
        creditsBalance={profile?.credits_balance ?? 0}
        onGenerate={handleGenerate}
        onSignOut={signOut}
        generating={generating}
      />

      {/* Branding */}
      <div className="absolute left-6 top-6 z-50 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/80 backdrop-blur-sm">
          <span className="gradient-text text-lg font-bold">C</span>
        </div>
        <span className="text-sm font-semibold text-foreground">
          Canvas<span className="text-primary">AI</span>
        </span>
      </div>
    </div>
  );
};

export default Canvas;
