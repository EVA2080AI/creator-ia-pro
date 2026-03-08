import { useCallback, useEffect } from "react";
import {
  ReactFlow, Background, Controls, MiniMap,
  type NodeChange, type Node, type Connection, addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useCanvasLoader } from "@/hooks/useCanvasLoader";
import { useNodeSubscription } from "@/hooks/useNodeSubscription";
import { useCanvasStore, type CanvasNodeData } from "@/store/useCanvasStore";
import { AINode } from "@/components/canvas/AINode";
import { CanvasToolbar } from "@/components/canvas/CanvasToolbar";
import { PropertiesSidebar } from "@/components/canvas/PropertiesSidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

const nodeTypes = { aiNode: AINode };

const Canvas = () => {
  const { user, loading: authLoading, signOut } = useAuth("/auth");
  const { profile, refreshProfile } = useProfile(user?.id);
  const { loading: nodesLoading } = useCanvasLoader(user?.id);
  useNodeSubscription(user?.id);

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const setEdges = useCanvasStore((s) => s.setEdges);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const persistPosition = useCanvasStore((s) => s.persistPosition);
  const setSelectedNode = useCanvasStore((s) => s.setSelectedNode);
  const addNodeToStore = useCanvasStore((s) => s.addNodeToStore);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const generating = useCanvasStore((s) => s.generating);
  const setGenerating = useCanvasStore((s) => s.setGenerating);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  const handleNodesChange = useCallback(
    (changes: NodeChange<Node<CanvasNodeData>>[]) => {
      onNodesChange(changes);
      changes.forEach((change) => {
        if (change.type === "position" && change.position && !change.dragging) {
          persistPosition(change.id, change.position.x, change.position.y);
        }
      });
    },
    [onNodesChange, persistPosition]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      setEdges(addEdge({ ...connection, animated: true }, useCanvasStore.getState().edges));
    },
    [setEdges]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<CanvasNodeData>) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  useEffect(() => {
    const handler = async (e: Event) => {
      const nodeId = (e as CustomEvent).detail;
      await supabase.from("canvas_nodes").delete().eq("id", nodeId);
      removeNode(nodeId);
      toast.success("Nodo eliminado");
    };
    window.addEventListener("delete-node", handler);
    return () => window.removeEventListener("delete-node", handler);
  }, [removeNode]);

  const handleGenerate = useCallback(
    async (type: "image" | "video", prompt: string) => {
      if (!user) return;
      const centerX = Math.random() * 600 - 300;
      const centerY = Math.random() * 400 - 200;

      try {
        const { data, error } = await supabase
          .from("canvas_nodes")
          .insert({ user_id: user.id, type, prompt, pos_x: centerX, pos_y: centerY, status: "loading" })
          .select()
          .single();

        if (error || !data) throw new Error("No se pudo crear el nodo");

        addNodeToStore({
          id: data.id, type: "aiNode",
          position: { x: data.pos_x, y: data.pos_y },
          data: {
            dbId: data.id, type: data.type as "image" | "video",
            prompt: data.prompt, assetUrl: data.asset_url,
            status: "loading", errorMessage: null, dataPayload: {},
          },
        });

        setGenerating(true);
        const { error: fnError } = await supabase.functions.invoke("generate-image", { body: { node_id: data.id } });
        if (fnError) toast.error(fnError.message || "Error en generación");
        else toast.success(type === "image" ? "¡Imagen generada!" : "Video en proceso...");
        await refreshProfile();
      } catch (error: any) {
        toast.error(error.message || "Error al generar");
      } finally {
        setGenerating(false);
      }
    },
    [user, addNodeToStore, setGenerating, refreshProfile]
  );

  const handleRunNode = useCallback(
    async (nodeId: string) => {
      if (!user) return;
      const node = useCanvasStore.getState().nodes.find((n) => n.id === nodeId);
      if (!node) return;

      setGenerating(true);
      updateNodeData(nodeId, { status: "loading", errorMessage: null });
      await supabase.from("canvas_nodes").update({ status: "loading", error_message: null }).eq("id", nodeId);

      try {
        const { error: fnError } = await supabase.functions.invoke("generate-image", { body: { node_id: nodeId } });
        if (fnError) toast.error(fnError.message || "Error en generación");
        else toast.success("¡Regeneración iniciada!");
        await refreshProfile();
      } catch (error: any) {
        toast.error(error.message || "Error al generar");
      } finally {
        setGenerating(false);
      }
    },
    [user, setGenerating, updateNodeData, refreshProfile]
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
        nodes={nodes} edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        className="canvas-grid"
        minZoom={0.05} maxZoom={2}
      >
        <Background color="hsl(222 30% 16%)" gap={24} size={1} />
        <Controls className="!bg-card !border-border !rounded-xl !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted !bottom-6 !right-6 !left-auto" />
        <MiniMap className="!bg-card !border-border !rounded-xl" nodeColor="hsl(43 74% 49%)" maskColor="hsl(222 47% 4% / 0.8)" />
      </ReactFlow>

      <CanvasToolbar creditsBalance={profile?.credits_balance ?? 0} onGenerate={handleGenerate} onSignOut={signOut} generating={generating} />
      <PropertiesSidebar onRun={handleRunNode} generating={generating} />

      {/* Branding */}
      <div className="absolute left-20 top-5 z-50 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card/80 backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground">
          <span className="gradient-text">Creator IA</span>
          <span className="text-muted-foreground"> Formaketing</span>
        </span>
      </div>
    </div>
  );
};

export default Canvas;
