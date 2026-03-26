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
import { GeniusAssistant } from '@/components/formarketing/GeniusAssistant';

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
  const { screenToFlowPosition, setNodes: rfSetNodes, setEdges: rfSetEdges, getNodes: rfGetNodes, getEdges: rfGetEdges } = useReactFlow();

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
        // Space is empty, set initial nodes AND persist them
        setNodes(initialNodes);
        if (spaceId && user) {
          const persistInitial = async () => {
            for (const node of initialNodes) {
               await supabase.from('canvas_nodes').insert({
                  id: node.id,
                  space_id: spaceId,
                  user_id: user.id,
                  type: node.type,
                  prompt: (node.data as any).title || 'Initial',
                  status: 'idle',
                  data_payload: node.data as any
               });
            }
          };
          persistInitial();
        }
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

  const ensureNodePersisted = async (nodeId: string) => {
    if (!spaceId || !user) return false;

    const { data: existing } = await supabase
        .from('canvas_nodes')
        .select('id')
        .eq('id', nodeId)
        .maybeSingle();

    if (existing) return true;

    console.log("Persisting node before execution:", nodeId);
    const currentNodes = rfGetNodes();
    const nodeToPersist = currentNodes.find(n => n.id === nodeId);
    
    if (!nodeToPersist) return false;

    const dbTypeMap: Record<string, string> = {
      'modelView': 'image',
      'videoModel': 'video',
      'characterBreakdown': 'text',
      'layoutBuilder': 'ui',
      'campaignManager': 'text'
    };
    
    const dbType = dbTypeMap[nodeToPersist.type || ""] || 'text';

    const { error: insertError } = await supabase.from('canvas_nodes').insert({
        id: nodeId,
        space_id: spaceId,
        user_id: user.id,
        type: dbType,
        prompt: (nodeToPersist.data as any).prompt || (nodeToPersist.data as any).title || 'auto-persisted',
        status: (nodeToPersist.data as any).status || 'idle',
        data_payload: nodeToPersist.data as any,
        pos_x: nodeToPersist.position.x,
        pos_y: nodeToPersist.position.y
    });
    
    if (insertError) {
        console.error("Critical: Failed to auto-persist node:", insertError);
        return false; 
    }
    return true;
  };

  const executeNode = async (nodeId: string) => {
    const isPersisted = await ensureNodePersisted(nodeId);
    
    setNodes((currentNodes) => {
      const node = currentNodes.find(n => n.id === nodeId);
      if (!node) return currentNodes;

      if (node.type === 'modelView') {
        (async () => {
          try {
            rfSetNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'loading' } } : n));
            
            const latestEdges = rfGetEdges();
            const contextEdges = latestEdges.filter(e => e.target === node.id);
            const sourceNodes = currentNodes.filter(n => contextEdges.some(e => e.source === n.id && n.type === 'characterBreakdown'));
            
            let finalPrompt = (node.data as any).prompt || "High quality marketing visual";
            if (sourceNodes.length > 0) {
              const contexts = sourceNodes.map(s => (s?.data as any).description || "").join(". ");
              finalPrompt = `${contexts}. ${finalPrompt}`;
            }

            const result = await aiService.processAction({
              action: 'image',
              prompt: finalPrompt,
              model: 'nano-banana-pro',
              node_id: (spaceId && isPersisted) ? node.id : undefined 
            });
            
            rfSetNodes((nds) => nds.map((n) => 
              n.id === node.id 
                ? { ...n, data: { ...n.data, status: 'ready', assetUrl: result.url } } 
                : n
            ));

            await supabase.from('canvas_nodes').update({ 
              asset_url: result.url, 
              status: 'ready' 
            }).eq('id', node.id);

            toast.success("Imagen generada correctamente");
          } catch (error: any) {
            rfSetNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'error' } } : n));
            toast.error(`Error: ${error.message}`);
          }
        })();
      } else if (node.type === 'videoModel') {
        (async () => {
          try {
            rfSetNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'rendering' } } : n));
            await new Promise(resolve => setTimeout(resolve, 3000));
            const videoUrl = 'https://cdn.pixabay.com/video/2023/10/20/185834-876356744_tiny.mp4';
            rfSetNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'ready', assetUrl: videoUrl } } : n));
            await supabase.from('canvas_nodes').update({ asset_url: videoUrl, status: 'ready', prompt: node.data.title || 'video' }).eq('id', node.id);
            toast.success("Video renderizado correctamente");
          } catch (error: any) {
            toast.error("Error al renderizar video");
          }
        })();
      }
      return currentNodes;
    });
  };

  const handleExecute = async () => {
    if (nodes.length === 0) {
      toast.error("No hay nodos que ejecutar");
      return;
    }

    toast.info("Iniciando motor de ejecución V5.3 Industrial...");
    
    const imageNodes = nodes.filter(n => n.type === 'modelView');
    for (const node of imageNodes) {
      await executeNode(node.id);
      
      const videoEdges = edges.filter(e => e.source === node.id);
      const targetVideoNodes = videoEdges.map(e => nodes.find(n => n.id === e.target)).filter(n => n?.type === 'videoModel');

      for (const vNode of targetVideoNodes) {
        if (vNode) await executeNode(vNode.id);
      }
    }

    toast.success("Flujo completo procesado.");
  };

  // Event listener for templates
  useEffect(() => {
    const handleAddTemplate = (e: any) => {
      const template = e.detail;
      const centerX = 400;
      const centerY = 300;
      
      const newNodes = template.nodes.map((n: any, idx: number) => ({
        id: crypto.randomUUID(),
        type: n.type,
        position: { x: centerX + (idx * 300) - 450, y: centerY },
        data: { ...n.data, onExecute: () => executeNode(n.id) }
      }));
      
      setNodes((nds) => [...nds, ...newNodes]);
      
      if (spaceId && user) {
          newNodes.forEach((n: any) => {
              supabase.from('canvas_nodes').insert({
                  id: n.id,
                  space_id: spaceId,
                  user_id: user.id,
                  type: n.type,
                  prompt: n.data.title || 'template_node',
                  pos_x: n.position.x,
                  pos_y: n.position.y,
                  data_payload: n.data
              }).then(({ error }) => {
                  if (error) console.error("Error persisting template node:", error);
              });
          });
      }
    };

    window.addEventListener('add-template', handleAddTemplate);
    return () => window.removeEventListener('add-template', handleAddTemplate);
  }, [nodes, edges, spaceId, user]);

  // Inject onExecute to initial/loaded nodes
  useEffect(() => {
     if (nodes.length > 0 && !nodes[0].data.onExecute) {
        setNodes(nds => nds.map(n => ({
          ...n,
          data: { ...n.data, onExecute: () => executeNode(n.id) }
        })));
     }
  }, [nodes.length]);

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden">
      <AppHeader userId={user?.id} onSignOut={signOut} />
      
      <div className="flex h-20 w-full items-center justify-between border-b border-white/5 bg-[#0a0a0b]/80 px-8 backdrop-blur-2xl shrink-0 z-50">
         <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="hover:bg-white/10 rounded-2xl w-10 h-10 border border-white/5 shadow-inner">
               <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </Button>
            <div className="flex flex-col">
               <div className="flex items-center gap-3">
                  <h1 className="text-sm font-black tracking-[0.2em] uppercase text-foreground/90">Formarketing Studio</h1>
                  <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">Cloud Persistent</span>
                  </div>
               </div>
               <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-black opacity-30 mt-1">Industrial Content Engine v5.3</span>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleClear} className="text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest gap-2.5 transition-all border border-transparent hover:border-destructive/20">
               <Trash2 className="w-3.5 h-3.5" />
               Limpiar Canvas
            </Button>
            <Button onClick={handleExecute} className="h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl gap-3 font-black px-8 shadow-2xl shadow-primary/30 text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10 ring-1 ring-primary/50 ring-offset-2 ring-offset-[#0a0a0b]">
               <Rocket className="w-4 h-4" />
               Ejecutar Flujo Sync
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
          <Controls className="bg-[#0a0a0b]/90 border border-white/10 fill-white !bottom-10 !left-8 rounded-2xl overflow-hidden scale-110 shadow-2xl backdrop-blur-3xl" />
          <MiniMap 
            className="bg-[#0a0a0b]/90 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-3xl !bottom-10 !right-8 shadow-2xl opacity-60 hover:opacity-100 transition-opacity" 
            maskColor="rgba(0,0,0,0.8)" 
            nodeColor={(n) => {
               if (n.type === 'characterBreakdown') return '#10b981';
               if (n.type === 'modelView') return '#3b82f6';
               if (n.type === 'videoModel') return '#f59e0b';
               return '#333';
            }}
          />
        </ReactFlow>
      </div>

      <GeniusAssistant />
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
