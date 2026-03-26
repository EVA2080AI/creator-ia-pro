import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from "react-helmet-async";
import { 
  Background, Controls, MiniMap, ReactFlow, addEdge, 
  Connection, Edge, Node, ReactFlowProvider,
  useNodesState, useEdgesState, useReactFlow,
  type NodeChange, type EdgeChange, BackgroundVariant
} from '@xyflow/react';
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
import AntigravityBridgeNode from '@/components/formarketing/AntigravityBridgeNode';
import { ArrowLeft, Rocket, Trash2, Zap, LogOut, User } from 'lucide-react';
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
  antigravityBridge: AntigravityBridgeNode,
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
          model: type === 'modelView' ? 'nano-banana-pro' : type === 'videoModel' ? 'nano-banana-video' : type === 'layoutBuilder' ? 'claude-3.5-sonnet' : 'deepseek-chat',
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
      const node = currentNodes.find((n) => n.id === nodeId);
      if (!node) return currentNodes;

      if (node.type === 'characterBreakdown') {
        (async () => {
          try {
            rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'executing' } } : n));
            
            const selectedModel = (node.data as any).model || 'deepseek-chat';
            const profilePrompt = `Analiza este perfil de personaje y genera una descripción senior detallada: ${node.data.title}. Contexto: ${node.data.flavor}. Estilo: ${node.data.description}`;
            
            const result = await aiService.processAction({
              action: 'chat',
              prompt: profilePrompt,
              model: selectedModel,
              node_id: (spaceId && isPersisted) ? node.id : undefined
            });

            rfSetNodes((nds) => nds.map((n) => n.id === nodeId 
              ? { ...n, data: { ...n.data, status: 'ready', description: result.text } } 
              : n
            ));

            await supabase.from('canvas_nodes').update({ 
               status: 'ready',
               data_payload: { ...node.data, status: 'ready', description: result.text, model: selectedModel }
            }).eq('id', nodeId);

            toast.success(`${node.data.title || 'Personaje'} analizado con ${selectedModel}`);
          } catch (e) {
            rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'error' } } : n));
          }
        })();
      } else if (node.type === 'modelView') {
        (async () => {
          try {
            rfSetNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'executing' } } : n));
            
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
              model: (node.data as any).model || 'nano-banana-pro',
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
            rfSetNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'loading' } } : n));
            await new Promise(resolve => setTimeout(resolve, 3000));
            const videoUrl = 'https://cdn.pixabay.com/video/2023/10/20/185834-876356744_tiny.mp4';
            const selectedModel = (node.data as any).model || 'nano-banana-video';
            rfSetNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'ready', assetUrl: videoUrl } } : n));
            await supabase.from('canvas_nodes').update({ 
               asset_url: videoUrl, 
               status: 'ready', 
               prompt: node.data.title || 'video',
               data_payload: { ...node.data, assetUrl: videoUrl, status: 'ready', model: selectedModel }
            }).eq('id', node.id);
            toast.success(`Video renderizado con ${selectedModel}`);
          } catch (error: any) {
            toast.error("Error al renderizar video");
          }
        })();
      } else if (node.type === 'layoutBuilder') {
        (async () => {
          try {
            rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'executing' } } : n));
            
            const selectedModel = (node.data as any).model || 'claude-3.5-sonnet';
            const layoutPrompt = `Genera un mapa de componentes React/Tailwind para una landing page de tipo ${node.data.title}. Plataforma: ${node.data.platform}. Estructura deseada: ${node.data.structure}`;
            
            const result = await aiService.processAction({
              action: 'ui',
              prompt: layoutPrompt,
              model: selectedModel,
              node_id: (spaceId && isPersisted) ? node.id : undefined
            });

            rfSetNodes((nds) => nds.map((n) => n.id === nodeId 
              ? { ...n, data: { ...n.data, status: 'ready', structure: JSON.stringify(result.ui || result, null, 2) } } 
              : n
            ));

            await supabase.from('canvas_nodes').update({ 
               status: 'ready',
               data_payload: { ...node.data, status: 'ready', structure: JSON.stringify(result.ui || result, null, 2), model: selectedModel }
            }).eq('id', nodeId);

            toast.success(`Layout ${node.data.title} generado con ${selectedModel}`);
          } catch (e) {
            rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'error' } } : n));
            toast.error("Error al generar layout");
          }
        })();
      }
      return currentNodes;
    });
  };

  const executeVariation = async (nodeId: string) => {
    const isPersisted = await ensureNodePersisted(nodeId);
    setNodes((currentNodes) => {
      const node = currentNodes.find((n) => n.id === nodeId);
      if (!node || !node.data.assetUrl) return currentNodes;

      (async () => {
        try {
          rfSetNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'executing' } } : n));
          
          const result = await aiService.processAction({
            action: 'image',
            tool: 'variation',
            prompt: `variación de estilo de la imagen de referencia: ${(node.data as any).prompt || 'estética industrial'}`,
            model: (node.data as any).model || 'nano-banana-pro',
            image: node.data.assetUrl as string,
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

          toast.success("Variación generada correctamente");
        } catch (error: any) {
          rfSetNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'error' } } : n));
          toast.error(`Error: ${error.message}`);
        }
      })();
      return currentNodes;
    });
  };

  const handleExecute = async () => {
    if (nodes.length === 0) {
      toast.error("No hay nodos que ejecutar");
      return;
    }

    toast.info("Iniciando motor de ejecución Nexus V7.0 Industrial...");
    
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

  // Listen for template injection - Moved here to ensure executeNode/Variation are defined
  useEffect(() => {
    const handleAddTemplate = async (e: any) => {
      const template = e.detail;
      const basePos = { x: 100, y: 100 };
      
      const newNodes: Node[] = template.nodes.map((nodeData: any, index: number) => {
        const newNodeId = crypto.randomUUID();
        return {
          id: newNodeId,
          type: nodeData.type,
          position: { x: basePos.x + (index * 350), y: basePos.y + (index * 50) },
          data: { 
            ...nodeData.data,
            onExecute: () => executeNode(newNodeId),
            onVariation: () => executeVariation(newNodeId)
          }
        };
      });

      setNodes((nds) => nds.concat(newNodes));

      if (spaceId && user) {
        for (const node of newNodes) {
          await supabase.from('canvas_nodes').insert({
             id: node.id,
             space_id: spaceId,
             user_id: user.id,
             type: node.type,
             pos_x: node.position.x,
             pos_y: node.position.y,
             prompt: (node.data.title as string) || node.type,
             status: 'idle',
             data_payload: node.data as any
          });
        }
      }
      
      toast.success(`Inyectado pack: ${template.title}`);
    };

    window.addEventListener('add-template', handleAddTemplate);
    return () => window.removeEventListener('add-template', handleAddTemplate);
  }, [user, spaceId, setNodes, executeNode, executeVariation]);

  const handleManualAddNode = useCallback((type: string, label: string, assetUrl?: string) => {
    const newNodeId = crypto.randomUUID();
    const position = { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 };
    const flowPos = screenToFlowPosition(position);

    const newNode: Node = {
      id: newNodeId,
      type,
      position: flowPos,
      data: { 
        title: label || 'Nuevo Elemento',
        status: assetUrl ? 'ready' : 'idle',
        prompt: '',
        assetUrl: assetUrl || null,
        description: type === 'characterBreakdown' ? 'Describe tu personaje...' : '',
        onExecute: () => executeNode(newNodeId),
        onVariation: () => executeVariation(newNodeId)
      },
    };

    setNodes((nds) => nds.concat(newNode));

    if (spaceId && user) {
      supabase.from('canvas_nodes').insert({
        id: newNodeId,
        space_id: spaceId,
        user_id: user.id,
        type: type,
        pos_x: flowPos.x,
        pos_y: flowPos.y,
        prompt: label || 'Nuevo',
        status: assetUrl ? 'ready' : 'idle',
        asset_url: assetUrl || null,
        data_payload: newNode.data as any
      }).then(({ error }) => {
        if (error) console.error("Error persisting manual node:", error);
      });
    }
    toast.success(`${label} añadido`);
  }, [screenToFlowPosition, setNodes, spaceId, user, executeNode]);

  const handleAssistantAction = useCallback(async (action: string, data: any) => {
    switch (action) {
      case 'add_node': {
        const newNodeId = crypto.randomUUID();
        const newNode: Node = {
          id: newNodeId,
          type: data.type || 'modelView',
          position: data.position || { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
          data: { 
            ...data.data,
            title: data.data?.title || 'Generado por IA',
            onExecute: () => executeNode(newNodeId),
            onVariation: () => executeVariation(newNodeId)
          },
        };

        setNodes((nds) => nds.concat(newNode));

        if (spaceId && user) {
          await supabase.from('canvas_nodes').insert({
            id: newNodeId,
            space_id: spaceId,
            user_id: user.id,
            type: newNode.type,
            pos_x: newNode.position.x,
            pos_y: newNode.position.y,
            prompt: data.data?.prompt || data.data?.title || 'IA Node',
            status: 'idle',
            data_payload: newNode.data as any
          });
        }
        toast.success(`Nodo ${newNode.type} añadido por Genius`);
        break;
      }

      case 'connect_nodes': {
        const newEdge: Edge = {
          id: `e-${data.source}-${data.target}`,
          source: data.source,
          target: data.target,
          animated: true,
          type: 'smoothstep'
        };
        setEdges((eds) => addEdge(newEdge, eds));
        toast.success("Conexión creada por Genius");
        break;
      }

      case 'apply_template': {
        // Trigger the template logic or dispatch event
        window.dispatchEvent(new CustomEvent('add-template', { detail: data.template }));
        toast.success("Template aplicado por Genius");
        break;
      }

      default:
        console.warn("Acción de asistente no reconocida:", action);
    }
  }, [setNodes, setEdges, spaceId, user, executeNode]);

  // Inject onExecute to initial/loaded nodes
  useEffect(() => {
     if (nodes.length > 0 && !nodes[0].data.onExecute) {
        setNodes(nds => nds.map(n => ({
          ...n,
          data: { 
            ...n.data, 
            onExecute: () => executeNode(n.id),
            onVariation: () => executeVariation(n.id)
          }
        })));
     }
  }, [nodes, setNodes, executeNode, executeVariation]);

  return (
    <>
      <Helmet>
        <title>Nexus Studio V2.0 | Formarketing</title>
        <meta name="description" content="Lienzo infinito de inteligencia artificial multimodal. Crea, gestiona y escala campañas y flujos de marketing en tiempo real." />
      </Helmet>
      <div className="h-screen w-screen bg-[#050506] font-inter text-slate-100 flex flex-col overflow-hidden relative selection:bg-[#EC4699]/30 selection:text-[#020203]">
      {/* Nebula V8.0 Minimalist Studio Header */}
      <div className="flex h-20 w-full items-center justify-between border-b border-white/5 bg-[#020203]/40 px-10 backdrop-blur-3xl shrink-0 z-[90]">
         <div className="flex items-center gap-8">
             <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-5 hover:opacity-80 transition-all group"
             >
                <div className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] bg-gradient-to-r from-[#EC4699] to-[#FA8214] shadow-2xl shadow-[#EC4699]/20 group-hover:rotate-6 transition-transform">
                   <Rocket className="h-5.5 w-5.5 text-white" />
                </div>
                <div className="flex flex-col text-left">
                   <h1 className="text-2xl font-display tracking-tight text-white leading-none uppercase">creator <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#EC4699] to-[#FA8214]">ia studio</span></h1>
                   <span className="text-[9px] font-bold text-[#FA8214] uppercase tracking-[0.5em] mt-2">V2.1 Industrial</span>
                </div>
             </button>
            <div className="h-6 w-px bg-white/10 mx-2" />
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="hover:bg-white/5 rounded-2xl w-11 h-11 text-slate-500 hover:text-white transition-all">
               <ArrowLeft className="h-5 w-5" />
            </Button>
         </div>

         <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/5 shadow-2xl">
               <div className="w-2 h-2 rounded-full bg-[#ffb800] shadow-[0_0_15px_#ffb800] animate-pulse" />
               <span className="text-[10px] font-black text-[#ffb800] lowercase tracking-[0.2em]">en línea</span>
            </div>

            <Button 
               variant="ghost" 
               onClick={handleClear} 
               disabled={nodes.length === 0 && edges.length === 0}
               className="text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl px-6 h-11 text-[11px] font-black lowercase tracking-widest gap-3 transition-all disabled:opacity-20"
            >
               <Trash2 className="w-4 h-4" />
               limpiar_lienzo
            </Button>
            
            <Button 
               onClick={handleExecute} 
               disabled={nodes.length === 0}
               className="h-12 bg-gradient-to-r from-[#EC4699] to-[#FA8214] hover:opacity-90 text-white rounded-2xl gap-3 font-bold px-10 shadow-2xl shadow-[#EC4699]/20 text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
            >
               <Zap className="w-4 h-4" />
               Sincronizar Flujo
            </Button>

            <div className="h-6 w-px bg-white/10 mx-2" />
            
            <button onClick={signOut} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
               <LogOut className="h-4 w-4" />
            </button>
      </div>
      </div>

      <div className="relative h-full w-full flex-1" ref={reactFlowWrapper}>
        <FormarketingSidebar onAddNode={handleManualAddNode} />
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
          className="nebula-canvas bg-[#050506]"
          colorMode="dark"
          defaultEdgeOptions={{ 
            type: 'smoothstep', 
            animated: true,
            style: { stroke: '#EC469980', strokeWidth: 2 }
          }}
        >
          <Background 
            color="#ffffff05" 
            variant={BackgroundVariant.Dots} 
            gap={40} 
            size={1.5} 
          />
          <Controls className="!bg-[#0f0f12]/90 !border-white/5 !fill-slate-500 !bottom-12 !left-10 rounded-2xl overflow-hidden scale-110 shadow-3xl backdrop-blur-xl" />
          <MiniMap 
            className="!bg-[#0f0f12]/90 border !border-white/5 !rounded-2xl overflow-hidden backdrop-blur-xl !bottom-12 !right-10 shadow-3xl opacity-50 hover:opacity-100 transition-opacity" 
            maskColor="rgba(5,5,6,0.8)" 
            nodeColor={(n) => {
               if (n.type === 'characterBreakdown') return '#FA821480';
               if (n.type === 'modelView') return '#ffffff20';
               if (n.type === 'videoModel') return '#EC469980';
               if (n.type === 'antigravityBridge') return '#EC469980';
               return '#222';
            }}
          />
        </ReactFlow>
      </div>

      <GeniusAssistant onAction={handleAssistantAction} />
    </div>
    </>
  );
}

export default function Formarketing() {
  return (
    <ReactFlowProvider>
      <FormarketingContent />
    </ReactFlowProvider>
  );
}
