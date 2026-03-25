import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Background, Controls, MiniMap, ReactFlow, addEdge, 
  Connection, Edge, Node, ReactFlowProvider,
  useNodesState, useEdgesState, useReactFlow,
  type NodeChange, type EdgeChange
} from '@xyflow/react';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import CharacterBreakdownNode from '@/components/formarketing/CharacterBreakdownNode';
import ModelNode from '@/components/formarketing/ModelNode';
import VideoModelNode from '@/components/formarketing/VideoModelNode';
import LayoutBuilderNode from '@/components/formarketing/LayoutBuilderNode';
import CampaignManagerNode from '@/components/formarketing/CampaignManagerNode';
import { FormarketingSidebar } from '@/components/formarketing/FormarketingSidebar';
import { ArrowLeft, Rocket, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { aiService } from '@/services/ai-service';
import { supabase } from '@/integrations/supabase/client';

const nodeTypes = {
  characterBreakdown: CharacterBreakdownNode,
  modelView: ModelNode,
  videoModel: VideoModelNode,
  layoutBuilder: LayoutBuilderNode,
  campaignManager: CampaignManagerNode,
};

const initialNodes: Node[] = [
  {
    id: crypto.randomUUID(),
    type: 'characterBreakdown',
    position: { x: 50, y: 100 },
    data: { 
       title: 'The Slow Starter', 
       flavor: 'Morning Brew Blend',
       description: 'Starting point: Morning routine. Trying to wake up but loving the slow pace of the morning.'
    },
  },
  {
    id: crypto.randomUUID(),
    type: 'modelView',
    position: { x: 450, y: 50 },
    data: { 
       title: 'Escena 1: Cocina', 
       prompt: 'Cinematic shot of a cozy kitchen at sunrise, soft warm morning light.',
       imageUrl: ''
    },
  },
  {
    id: crypto.randomUUID(),
    type: 'videoModel',
    position: { x: 850, y: 100 },
    data: { 
       title: 'Secuencia de Desayuno', 
       status: 'pending',
       duration: '00:15'
    },
  }
];

const initialEdges: Edge[] = []; // Clear initial edges to avoid ID mismatches with randomUUID

function FormarketingContent() {
  const { user, signOut } = useAuth("/auth");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const spaceId = searchParams.get('spaceId') || searchParams.get('space');
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition, setNodes: rfSetNodes, setEdges: rfSetEdges } = useReactFlow();

  // Load from DB
  useEffect(() => {
    if (!user || !spaceId) {
       setNodes(initialNodes);
       return;
    }

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
      } else {
        setNodes(initialNodes);
      }
    };

    loadData();
  }, [user, spaceId]);

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
      
      // Save all edges to metadata node
      if (spaceId) {
        const saveEdges = async () => {
          const latestEdges = edges; // Note: Use refs or state correctly for immediate save
          await supabase
            .from('canvas_nodes')
            .upsert({
              space_id: spaceId,
              user_id: user?.id || '',
              type: 'flow_metadata',
              data_payload: { edges: latestEdges },
              prompt: 'metadata'
            } as any, { onConflict: 'space_id,type' });
        };
        saveEdges();
      }
    },
    [onEdgesChange, edges, spaceId, user]
  );

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');

      if (typeof type === 'undefined' || !type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNodeId = crypto.randomUUID();
      const newNode: Node = {
        id: newNodeId,
        type,
        position,
        data: { 
          title: label || 'Nuevo Elemento',
          status: 'idle',
          prompt: '',
          description: type === 'characterBreakdown' ? 'Describe tu personaje...' : ''
        },
      };

      setNodes((nds) => nds.concat(newNode));

      // Persist to DB if in a space
      if (spaceId && user) {
        supabase.from('canvas_nodes').insert({
          id: newNodeId,
          space_id: spaceId,
          user_id: user.id,
          type: type,
          pos_x: position.x,
          pos_y: position.y,
          prompt: label || 'Nuevo',
          status: 'idle',
          data_payload: newNode.data as any
        }).then(({ error }) => {
          if (error) console.error("Error persisting new node:", error);
        });
      }

      toast.success(`${label} añadido al canvas`);
    },
    [screenToFlowPosition, setNodes, spaceId, user]
  );

  const handleClear = async () => {
    if (!spaceId) {
      setNodes([]);
      setEdges([]);
      return;
    }
    
    if (confirm("¿Estás seguro de que deseas limpiar todo el canvas? Esta acción no se puede deshacer.")) {
      const { error } = await supabase.from('canvas_nodes').delete().eq('space_id', spaceId);
      if (!error) {
        setNodes([]);
        setEdges([]);
        toast.success("Canvas limpiado correctamente");
      }
    }
  };

  const handleExecute = async () => {
    if (nodes.length === 0) {
      toast.error("No hay nodos que ejecutar");
      return;
    }

    toast.info("Iniciando motor de ejecución V5.1 Industrial...");
    
    // 1. Identify processing order (Simplified Graph Traversal)
    const imageNodes = nodes.filter(n => n.type === 'modelView');
    
    for (const node of imageNodes) {
      try {
        setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'loading' } } : n));

        // Find connected character context
        const contextEdges = edges.filter(e => e.target === node.id);
        const sourceNodes = contextEdges.map(e => nodes.find(n => n.id === e.source)).filter(n => n?.type === 'characterBreakdown');
        
        let finalPrompt = (node.data as any).prompt || "High quality marketing visual";
        if (sourceNodes.length > 0) {
          const contexts = sourceNodes.map(s => (s?.data as any).description || "").join(". ");
          finalPrompt = `${contexts}. ${finalPrompt}`;
        }

        const result = await aiService.processAction({
          action: 'image',
          prompt: finalPrompt,
          model: 'nano-banana-pro',
          node_id: node.id
        });
        
        setNodes((nds) => nds.map((n) => 
          n.id === node.id 
            ? { ...n, data: { ...n.data, status: 'ready', assetUrl: result.url } } 
            : n
        ));

        // Update DB
        await supabase.from('canvas_nodes').update({ 
          asset_url: result.url, 
          status: 'ready' 
        }).eq('id', node.id);

        // 2. Chain to Video Nodes
        const videoEdges = edges.filter(e => e.source === node.id);
        const targetVideoNodes = videoEdges.map(e => nodes.find(n => n.id === e.target)).filter(n => n?.type === 'videoModel');

        for (const vNode of targetVideoNodes) {
          if (!vNode) continue;
          setNodes((nds) => nds.map((n) => n.id === vNode.id ? { ...n, data: { ...n.data, status: 'rendering' } } : n));
          
          // Mock high-end rendering
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const videoUrl = 'https://cdn.pixabay.com/video/2023/10/20/185834-876356744_tiny.mp4';
          setNodes((nds) => nds.map((n) => n.id === vNode.id ? { ...n, data: { ...n.data, status: 'ready', assetUrl: videoUrl } } : n));
          
          await supabase.from('canvas_nodes').update({ 
            asset_url: videoUrl, 
            status: 'ready' 
          }).eq('id', vNode.id);
        }

      } catch (error: any) {
        setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'error' } } : n));
        toast.error(`Error: ${error.message}`);
      }
    }

    toast.success("Flujo completado industrialmente.");
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden">
      <AppHeader userId={user?.id} onSignOut={signOut} />
      
      <div className="flex h-16 w-full items-center justify-between border-b border-white/5 bg-[#161616]/40 px-6 backdrop-blur-md shrink-0">
         <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="hover:bg-white/5 rounded-full">
               <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
               <div className="flex items-center gap-2">
                  <h1 className="text-sm font-black tracking-tight uppercase">Formarketing Studio</h1>
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                     <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Sincronizado</span>
                  </div>
               </div>
               <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold opacity-50">V5.1 Industrial Persistence</span>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleClear} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl px-4 text-xs font-bold gap-2">
               <Trash2 className="w-3.5 h-3.5" />
               Limpiar
            </Button>
            <Button onClick={handleExecute} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2 font-black px-6 shadow-xl shadow-primary/20 text-xs uppercase tracking-widest">
               <Rocket className="h-3.5 h-3.5" />
               Ejecutar Flujo
            </Button>
         </div>
      </div>

      <div className="relative h-full w-full flex-1" ref={reactFlowWrapper}>
        <FormarketingSidebar />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[#0a0a0a]"
          defaultEdgeOptions={{ type: 'smoothstep', style: { stroke: '#3b82f6', strokeWidth: 2, opacity: 0.4 }, animated: true }}
        >
          <Background color="#ffffff" gap={20} size={1} className="opacity-[0.03]" />
          <Controls className="bg-card/90 border border-white/10 fill-white !bottom-24 !left-4" />
          <MiniMap 
            className="bg-card/90 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl !bottom-24 !right-4" 
            maskColor="rgba(0,0,0,0.7)" 
            nodeColor={(n) => {
               if (n.type === 'characterBreakdown') return '#10b981';
               if (n.type === 'modelView') return '#3b82f6';
               if (n.type === 'videoModel') return '#f59e0b';
               return '#fff';
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function Formarketing() {
  return (
    <ReactFlowProvider>
      <FormarketingContent />
    </ReactFlowProvider>
  );
}
