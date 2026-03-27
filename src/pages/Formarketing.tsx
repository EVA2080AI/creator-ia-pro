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
import { TEMPLATES, CATEGORIES, type Template } from '@/components/formarketing/TemplateModal';
import AntigravityBridgeNode from '@/components/formarketing/AntigravityBridgeNode';
import { ArrowLeft, Trash2, Zap, Monitor } from 'lucide-react';
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
  // Show template landing only when no spaceId (fresh session)
  const [showLanding, setShowLanding] = useState(!spaceId);
  const { screenToFlowPosition, setNodes: rfSetNodes, setEdges: rfSetEdges, getNodes: rfGetNodes, getEdges: rfGetEdges } = useReactFlow();

  // Handle template selection from landing page
  const handleTemplateSelect = useCallback((template: { title: string; nodes: Array<{ type: string; data: Record<string, any> }> }) => {
    const newNodes: Node[] = template.nodes.map((nodeData, index) => {
      const newNodeId = crypto.randomUUID();
      return {
        id: newNodeId,
        type: nodeData.type,
        position: { x: 120 + (index % 3) * 380, y: 120 + Math.floor(index / 3) * 280 },
        data: {
          ...nodeData.data,
          status: 'idle',
          onExecute: () => {},
          onVariation: () => {},
        },
      } as Node;
    });

    // Auto-connect nodes sequentially so the flow is pre-wired
    const newEdges: Edge[] = newNodes.slice(0, -1).map((node, i) => ({
      id: `e-${node.id}-${newNodes[i + 1].id}`,
      source: node.id,
      target: newNodes[i + 1].id,
      type: 'smoothstep',
      animated: true,
      style: { stroke: 'rgba(168,85,247,0.35)', strokeWidth: 2 },
    }));

    setNodes(newNodes);
    setEdges(newEdges);
    setShowLanding(false);
  }, [setNodes, setEdges]);

  // Load from DB
  useEffect(() => {
    if (!user || !spaceId) {
       if (!spaceId) return; // Landing will handle initial state
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

    toast.info("Synchronizing Aether V8.0 Neural Engine...");
    
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

  // Handle "add next node" suggestion from NodeNextAction component
  useEffect(() => {
    const handleAddNextNode = async (e: any) => {
      const { sourceId, nodeType, nodeLabel } = e.detail;
      const newNodeId = crypto.randomUUID();

      // Find source node to position relative to it
      const currentNodes = rfGetNodes();
      const sourceNode = currentNodes.find(n => n.id === sourceId);
      const sourcePos = sourceNode?.position || { x: 200, y: 200 };

      const newNode: Node = {
        id: newNodeId,
        type: nodeType,
        position: { x: sourcePos.x + 380, y: sourcePos.y },
        data: {
          title: nodeLabel,
          status: 'idle',
          prompt: '',
          onExecute: () => executeNode(newNodeId),
          onVariation: () => executeVariation(newNodeId),
        },
      };

      // Add new edge connecting source → new node
      const newEdge: Edge = {
        id: `e-${sourceId}-${newNodeId}`,
        source: sourceId,
        target: newNodeId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'rgba(168,85,247,0.35)', strokeWidth: 2 },
      };

      setNodes((nds) => nds.concat(newNode));
      setEdges((eds) => addEdge(newEdge, eds));

      if (spaceId && user) {
        await supabase.from('canvas_nodes').insert({
          id: newNodeId,
          space_id: spaceId,
          user_id: user.id,
          type: nodeType,
          pos_x: newNode.position.x,
          pos_y: newNode.position.y,
          prompt: nodeLabel,
          status: 'idle',
          data_payload: newNode.data as any,
        });
      }

      toast.success(`${nodeLabel} añadido`);
    };

    window.addEventListener('add-next-node', handleAddNextNode);
    return () => window.removeEventListener('add-next-node', handleAddNextNode);
  }, [user, spaceId, setNodes, setEdges, rfGetNodes, executeNode, executeVariation]);

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
        <title>Studio · Canvas | Creator IA Pro</title>
        <meta name="description" content="Crea campañas visuales con IA. Conecta personajes, imágenes y videos en un lienzo intuitivo." />
      </Helmet>
      <AppHeader userId={user?.id} onSignOut={signOut} />
      <div className="w-screen bg-[#020203] font-sans text-white/90 flex flex-col overflow-hidden relative selection:bg-aether-purple/20" style={{ height: 'calc(100vh - 64px)', marginTop: '64px' }}>
      {/* Canvas Toolbar */}
      <div className="flex h-14 w-full items-center justify-between border-b border-white/[0.08] bg-black/40 px-6 backdrop-blur-3xl shrink-0 z-[90]">
         <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="hover:bg-white/5 rounded-xl w-9 h-9 text-white/30 hover:text-white transition-all">
               <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px bg-white/10" />
            <button
              onClick={() => setShowLanding(true)}
              className="hidden sm:flex items-center gap-2 bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/5 hover:border-aether-purple/30 hover:bg-aether-purple/5 transition-all"
            >
               <div className="w-1.5 h-1.5 rounded-full bg-aether-blue shadow-[0_0_8px_rgba(0,194,255,0.4)] animate-pulse" />
               <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none">Plantillas</span>
            </button>
         </div>

         <div className="flex items-center gap-2">
            {/* Share screen */}
            <Button
               variant="ghost"
               onClick={() => navigate('/sharescreen')}
               className="hidden sm:flex items-center gap-2 text-aether-blue/50 hover:text-aether-blue hover:bg-aether-blue/5 rounded-xl px-3 h-9 text-xs font-bold transition-all"
               title="Compartir pantalla"
            >
               <Monitor className="w-3.5 h-3.5" />
               <span className="hidden md:inline">Compartir</span>
            </Button>

            <Button
               variant="ghost"
               onClick={handleClear}
               disabled={nodes.length === 0 && edges.length === 0}
               className="text-white/30 hover:text-white hover:bg-white/5 rounded-xl px-3 h-9 text-xs font-bold gap-2 transition-all disabled:opacity-20"
            >
               <Trash2 className="w-3.5 h-3.5" />
               <span className="hidden md:inline">Limpiar</span>
            </Button>

            <Button
               onClick={handleExecute}
               disabled={nodes.length === 0}
               className="h-9 bg-white hover:bg-white/90 text-black rounded-xl gap-2 font-bold px-5 shadow-xl shadow-white/5 text-xs transition-all active:scale-95 disabled:opacity-20 font-display"
            >
               <Zap className="w-3.5 h-3.5 fill-current" />
               Ejecutar
            </Button>
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
          className="aether-canvas"
          colorMode="dark"
          defaultEdgeOptions={{ 
            type: 'smoothstep', 
            animated: true,
            style: { stroke: 'rgba(255,255,255,0.08)', strokeWidth: 2 }
          }}
        >
          <Background 
            color="#ffffff03" 
            variant={BackgroundVariant.Dots} 
            gap={40} 
            size={1} 
          />
          <Controls className="!bg-[#0a0a0b]/90 !border-white/5 !fill-white/20 !bottom-12 !left-10 rounded-2xl overflow-hidden scale-110 shadow-3xl backdrop-blur-xl transition-all hover:bg-[#0a0a0b]" />
          <MiniMap 
            className="!bg-[#0a0a0b]/90 border !border-white/5 !rounded-2xl overflow-hidden backdrop-blur-xl !bottom-12 !right-10 shadow-3xl opacity-30 hover:opacity-100 transition-opacity" 
            maskColor="rgba(0,0,0,0.8)" 
            nodeColor={(n) => {
               if (n.type === 'characterBreakdown') return '#ffffff10';
               if (n.type === 'modelView') return '#ffffff20';
               if (n.type === 'videoModel') return '#ffffff15';
               if (n.type === 'antigravityBridge') return '#ffffff30';
               return '#111';
            }}
          />
        </ReactFlow>
      </div>

      <GeniusAssistant onAction={handleAssistantAction} />

      {/* Template Landing Overlay */}
      {showLanding && (
        <TemplateLanding
          onSelect={handleTemplateSelect}
          onSkip={() => { setShowLanding(false); setNodes(initialNodes); }}
        />
      )}
    </div>
    </>
  );
}

// ─── Template Landing Component ────────────────────────────────────────────
function TemplateLanding({
  onSelect,
  onSkip,
}: {
  onSelect: (template: Template) => void;
  onSkip: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [search, setSearch] = useState('');

  const filtered = TEMPLATES.filter((t) => {
    const matchCat = activeCategory === 'Todos' || t.category === activeCategory;
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="absolute inset-0 z-50 bg-[#050506]/98 backdrop-blur-2xl overflow-y-auto">
      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-aether-purple animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Studio · Plantillas</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight font-display mb-4">
            Elige una <span className="bg-gradient-to-r from-aether-purple to-aether-blue bg-clip-text text-transparent">plantilla</span>
          </h1>
          <p className="text-sm text-white/30 font-medium max-w-md mx-auto">
            Carga el flujo completo en segundos. Puedes editarlo como quieras.
          </p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar plantilla..."
              className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-2xl pl-4 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-aether-purple/30 transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all font-display ${
                  activeCategory === cat
                    ? 'bg-white text-black'
                    : 'bg-white/[0.03] border border-white/5 text-white/30 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className="group aether-card rounded-[2rem] border border-white/5 p-6 text-left hover:border-aether-purple/30 hover:scale-[1.02] transition-all duration-300 active:scale-[0.98]"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${template.color}`}>
                  <template.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate font-display tracking-tight">{template.title}</h3>
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{template.category}</span>
                </div>
              </div>
              <p className="text-[12px] text-white/30 leading-relaxed line-clamp-2">{template.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/15 uppercase tracking-widest">
                  {template.nodes.length} nodo{template.nodes.length !== 1 ? 's' : ''}
                </span>
                <span className="text-[10px] font-bold text-aether-purple opacity-0 group-hover:opacity-100 transition-opacity">Usar →</span>
              </div>
            </button>
          ))}
        </div>

        {/* Skip */}
        <div className="mt-12 text-center">
          <button
            onClick={onSkip}
            className="text-xs font-bold text-white/20 hover:text-white/50 transition-colors uppercase tracking-widest"
          >
            Empezar con canvas vacío →
          </button>
        </div>
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
