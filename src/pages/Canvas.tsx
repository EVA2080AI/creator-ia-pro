import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { UIBuilderNode } from "@/components/canvas/UIBuilderNode";
import { CanvasToolbar } from "@/components/canvas/CanvasToolbar";
import { PropertiesSidebar } from "@/components/canvas/PropertiesSidebar";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { aiService } from "@/services/ai-service";
import { toast } from "sonner";
import { Loader2, Box } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const nodeTypes = { 
  aiNode: AINode,
  uiNode: UIBuilderNode
};

const Canvas = () => {
  const { user, loading: authLoading, signOut } = useAuth("/auth");
  const { profile, refreshProfile } = useProfile(user?.id);
  const [searchParams] = useSearchParams();
  const spaceId = searchParams.get("space") || searchParams.get("spaceId");
  const { loading: nodesLoading } = useCanvasLoader(user?.id, spaceId);
  const setSpaceInStore = useCanvasStore((s) => s.setSpace);
  const currentSpaceName = useCanvasStore((s) => s.currentSpaceName);

  useEffect(() => {
    if (!spaceId) {
      setSpaceInStore(null, null);
      return;
    }
    
    const fetchSpaceInfo = async () => {
      const { data } = await supabase.from("spaces").select("name").eq("id", spaceId).single();
      if (data) setSpaceInStore(spaceId, data.name);
    };
    fetchSpaceInfo();
  }, [spaceId, setSpaceInStore]);

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
    async (type: "image" | "video" | "ui", prompt: string) => {
      if (!user) return;
      const centerX = Math.random() * 600 - 300;
      const centerY = Math.random() * 400 - 200;

      try {
        const { data, error } = await supabase
          .from("canvas_nodes")
          .insert({ user_id: user.id, type, prompt, pos_x: centerX, pos_y: centerY, status: "loading", ...(spaceId ? { space_id: spaceId } : {}) } as any)
          .select()
          .single();

        if (error || !data) throw new Error("No se pudo crear el nodo");

        addNodeToStore({
          id: data.id, 
          type: type === "ui" ? "uiNode" : "aiNode",
          position: { x: data.pos_x, y: data.pos_y },
          data: {
            dbId: data.id, 
            type: data.type as "image" | "video" | "ui",
            prompt: data.prompt, assetUrl: data.asset_url,
            status: "loading", errorMessage: null, dataPayload: {},
          },
        });

        setGenerating(true);
        try {
          const result = await aiService.processAction({ 
            action: type,
            prompt: data.prompt,
            model: type === "ui" ? "gemini-1.5-flash" : "nano-banana-25",
            node_id: data.id 
          });
          toast.success(`¡${type === "ui" ? "Diseño UI" : type === "image" ? "Imagen" : "Video"} generado con éxito! (Industrial V3.4)`);
        } catch (err: any) {
          toast.error(`${err.message} (Industrial V3.4)` || "Error en generación (V3.4)");
        }
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
        await aiService.processAction({ 
          action: node.data.type,
          prompt: node.data.prompt,
          model: node.data.type === "ui" ? "gemini-1.5-flash" : "nano-banana-25",
          node_id: node.data.dbId 
        });
        toast.success("¡Regeneración finalizada!");
        await refreshProfile();
      } catch (err: any) {
        toast.error(`${err.message} (Regen V3.4)` || "Error al generar (V3.4)");
      } finally {
        setGenerating(false);
      }
    },
    [user, setGenerating, updateNodeData, refreshProfile]
  );

  if (authLoading || nodesLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin-slow text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background">
      {/* Unified header */}
      <AppHeader userId={user?.id} onSignOut={signOut} />

      {/* Project Status Bar (V3.2) */}
      {spaceId && (
        <div className="bg-primary/5 border-b border-white/5 px-6 py-2 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Box className="h-3.5 w-3.5" />
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] leading-none opacity-50 font-bold">Proyecto Activo</span>
                <span className="text-sm font-black tracking-tight text-foreground">{currentSpaceName || "Cargando proyecto..."}</span>
             </div>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-bold py-0.5">Entorno Seguro Industrial</Badge>
        </div>
      )}

      {/* Canvas area fills remaining space */}
      <div className="relative flex-1">
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
      </div>
    </div>
  );
};

export default Canvas;
