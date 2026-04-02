import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from "react-helmet-async";
import {
  Background, Controls, MiniMap, ReactFlow, addEdge,
  Connection, Edge, Node, ReactFlowProvider,
  useNodesState, useEdgesState, useReactFlow,
  type NodeChange, type EdgeChange, BackgroundVariant,
  SelectionMode,
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
import CaptionNode from '@/components/formarketing/CaptionNode';
import PromptBuilderNode from '@/components/formarketing/PromptBuilderNode';
import LLMNode from '@/components/formarketing/LLMNode';
import TextInputNode from '@/components/formarketing/TextInputNode';
import ExportNode from '@/components/formarketing/ExportNode';
import { CommandPalette } from '@/components/formarketing/CommandPalette';
import { ArrowLeft, Trash2, Zap, Monitor, Grid3X3, RotateCcw, RotateCw, LayoutDashboard, Circle, MessageSquare, Download, Smartphone, Layers, GitBranch, Play as PlayIcon, ChevronRight, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { aiService, classifyError } from '@/services/ai-service';
import { supabase } from '@/integrations/supabase/client';
import { PropertyInspector } from '@/components/formarketing/PropertyInspector';
import { ExportModal } from '@/components/formarketing/ExportModal';

// Dynamic nodeTypes will be defined inside the component


const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

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
  const { screenToFlowPosition, setNodes: rfSetNodes, setEdges: rfSetEdges, getNodes: rfGetNodes, getEdges: rfGetEdges, fitView } = useReactFlow();

  // HU25/26 — Snap & zoom state
  const [snapEnabled, setSnapEnabled]         = useState(false);

  // HU28 — Command palette
  const [cmdOpen, setCmdOpen]                 = useState(false);


  // Property Inspector
  const [selectedNodeId, setSelectedNodeId]   = useState<string | null>(null);

  // Export modal
  const [exportOpen, setExportOpen]           = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Onboarding overlay (first visit)
  const [onboardingStep, setOnboardingStep]   = useState(0);
  const [showOnboarding, setShowOnboarding]   = useState(() => !localStorage.getItem('fm_onboarded'));
  const ONBOARDING_STEPS = [
    { icon: Layers,      title: 'Arrastra un nodo',          desc: 'Desde la barra lateral izquierda elige un módulo y arrástralo al canvas.' },
    { icon: GitBranch,   title: 'Conecta los nodos',          desc: 'Haz clic en el punto de salida de un nodo y conéctalo al siguiente.' },
    { icon: PlayIcon,    title: 'Ejecuta el flujo',           desc: 'Presiona ▶ dentro de cada nodo para que la IA genere el contenido.' },
  ];
  const dismissOnboarding = () => {
    localStorage.setItem('fm_onboarded', '1');
    setShowOnboarding(false);
  };

  // HU33 — Execution status
  const [execStatus, setExecStatus]           = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [execNodeCount, setExecNodeCount]     = useState(0);
  const [execDone, setExecDone]               = useState(0);

  // Execution log
  const [execLog, setExecLog] = useState<{ time: string; node: string; msg: string; type: 'info' | 'success' | 'error' }[]>([]);
  const [logOpen, setLogOpen] = useState(false);

  // HU34 — Undo/Redo history
  const history   = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const historyIdx = useRef(-1);
  const skipHistory = useRef(false);

  const pushHistory = useCallback((ns: Node[], es: Edge[]) => {
    if (skipHistory.current) return;
    // Trim forward history
    history.current = history.current.slice(0, historyIdx.current + 1);
    history.current.push({ nodes: ns, edges: es });
    historyIdx.current = history.current.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (historyIdx.current <= 0) return;
    historyIdx.current--;
    const snap = history.current[historyIdx.current];
    skipHistory.current = true;
    setNodes(snap.nodes);
    setEdges(snap.edges);
    skipHistory.current = false;
    toast.info("Cambio deshecho");
  }, [setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIdx.current >= history.current.length - 1) return;
    historyIdx.current++;
    const snap = history.current[historyIdx.current];
    skipHistory.current = true;
    setNodes(snap.nodes);
    setEdges(snap.edges);
    skipHistory.current = false;
    toast.info("Cambio rehecho");
  }, [setNodes, setEdges]);

  // Auto-layout: arrange nodes left-to-right based on edge topology
  const autoLayout = useCallback(() => {
    const ns = rfGetNodes();
    const es = rfGetEdges();
    if (ns.length === 0) return;

    // Build adjacency: find roots (no incoming edges)
    const hasIncoming = new Set(es.map(e => e.target));
    const roots = ns.filter(n => !hasIncoming.has(n.id));
    const rootIds = new Set(roots.map(n => n.id));

    const levels: string[][] = [[]];
    const visited = new Set<string>();

    // BFS from roots
    const queue: { id: string; level: number }[] = roots.map(n => ({ id: n.id, level: 0 }));
    if (queue.length === 0) queue.push({ id: ns[0].id, level: 0 });

    while (queue.length) {
      const { id, level } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      if (!levels[level]) levels[level] = [];
      levels[level].push(id);
      es.filter(e => e.source === id).forEach(e => {
        if (!visited.has(e.target)) queue.push({ id: e.target, level: level + 1 });
      });
    }

    // Remaining unvisited nodes (disconnected)
    const disconnected = ns.filter(n => !visited.has(n.id));
    if (disconnected.length) levels.push(disconnected.map(n => n.id));

    const COL_GAP = 400;
    const ROW_GAP = 300;
    const nodeMap = new Map(ns.map(n => [n.id, n]));

    const positioned = levels.flatMap((col, ci) =>
      col.map((id, ri) => {
        const node = nodeMap.get(id)!;
        return { ...node, position: { x: 80 + ci * COL_GAP, y: 80 + ri * ROW_GAP } };
      })
    );

    rfSetNodes(positioned);
    setTimeout(() => fitView({ padding: 0.15, duration: 600 }), 50);
    toast.success("Canvas organizado automáticamente");
  }, [rfGetNodes, rfGetEdges, rfSetNodes, fitView]);

  // Handle template selection from landing page
  const handleTemplateSelect = useCallback((template: { title: string; nodes: Array<{ type: string; data: Record<string, any> }> }) => {
    // Demo content so templates load looking alive
    const DEMO_VIDEO = 'https://cdn.pixabay.com/video/2023/10/20/185834-876356744_tiny.mp4';
    const DEMO_IMAGES = [
      'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&q=80',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&q=80',
    ];
    let imgIdx = 0;

    const newNodes: Node[] = template.nodes.map((nodeData, index) => {
      const newNodeId = crypto.randomUUID();
      // Pre-populate with demo content so the canvas looks ready
      let demoData: Record<string, any> = {};
      if (nodeData.type === 'videoModel') {
        demoData = { assetUrl: DEMO_VIDEO, status: 'ready' };
      } else if (nodeData.type === 'modelView') {
        demoData = { assetUrl: DEMO_IMAGES[imgIdx++ % DEMO_IMAGES.length], status: 'ready' };
      } else if (nodeData.type === 'layoutBuilder') {
        demoData = { structure: 'Hero > Características > Testimonios > Precios > CTA', status: 'idle' };
      }
      return {
        id: newNodeId,
        type: nodeData.type,
        position: { x: 120 + (index % 3) * 380, y: 120 + Math.floor(index / 3) * 290 },
        data: {
          ...nodeData.data,
          ...demoData,
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

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => {
      const next = addEdge(params, eds);
      pushHistory(rfGetNodes(), next);
      return next;
    });
  }, [setEdges, pushHistory, rfGetNodes]);

  // HU28 + HU34 — Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;

      // Ctrl/Cmd+Z → Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      // Ctrl/Cmd+Y or Ctrl+Shift+Z → Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }

      if (isInput) return;

      // Space → Command palette
      if (e.key === ' ') { e.preventDefault(); setCmdOpen(true); return; }
      // Shift+A → Command palette
      if (e.shiftKey && e.key === 'A') { e.preventDefault(); setCmdOpen(true); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

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
          model: type === 'modelView' ? 'flux-schnell' : type === 'videoModel' ? 'video' : type === 'layoutBuilder' ? 'claude-3.5-sonnet' : 'deepseek-chat',
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

  const addLog = useCallback((node: string, msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setExecLog(prev => [...prev.slice(-49), { time, node, msg, type }]);
  }, []);

  const executeNode = async (nodeId: string) => {
    const isPersisted = await ensureNodePersisted(nodeId);
    
    setNodes((currentNodes) => {
      const node = currentNodes.find((n) => n.id === nodeId);
      if (!node) return currentNodes;

      if (node.type === 'characterBreakdown') {
        (async () => {
          const nodeName = (node.data as any).title || 'Personaje';
          try {
            rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'executing' }, style: { boxShadow: '0 0 0 2px rgba(245,158,11,0.5)', borderRadius: '24px' } } : n));
            addLog(nodeName, 'Iniciando ejecución…', 'info');

            const selectedModel = (node.data as any).model || 'deepseek-chat';
            const profilePrompt = `Analiza este perfil de personaje y genera una descripción senior detallada: ${node.data.title}. Contexto: ${node.data.flavor}. Estilo: ${node.data.description}`;

            const result = await aiService.processAction({
              action: 'chat',
              prompt: profilePrompt,
              model: selectedModel,
              node_id: (spaceId && isPersisted) ? node.id : undefined
            });

            rfSetNodes((nds) => nds.map((n) => n.id === nodeId
              ? { ...n, data: { ...n.data, status: 'ready', description: result.text }, style: { boxShadow: '0 0 0 2px rgba(52,211,153,0.4)', borderRadius: '24px' } }
              : n
            ));

            await supabase.from('canvas_nodes').update({
               status: 'ready',
               data_payload: { ...node.data, status: 'ready', description: result.text, model: selectedModel }
            }).eq('id', nodeId);

            addLog(nodeName, 'Completado ✓', 'success');
            toast.success(`${node.data.title || 'Personaje'} analizado con ${selectedModel}`);
          } catch (e: any) {
            rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'error' }, style: { boxShadow: '0 0 0 2px rgba(239,68,68,0.5)', borderRadius: '24px' } } : n));
            const { userMessage } = classifyError(e?.message ?? '');
            addLog(nodeName, 'Error: ' + (e?.message ?? 'desconocido'), 'error');
            toast.error(userMessage);
          }
        })();
      } else if (node.type === 'textInput') {
        (async () => {
          const nodeName = (node.data as any).title || 'Texto';
          try {
            rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'ready' }, style: { boxShadow: '0 0 0 2px rgba(52,211,153,0.4)', borderRadius: '24px' } } : n));
            addLog(nodeName, 'Listo ✓', 'success');
            
            await supabase.from('canvas_nodes').update({ 
               status: 'ready', 
               data_payload: { ...node.data, status: 'ready' }
            }).eq('id', nodeId);
          } catch (e: any) {
            console.error("Error setting text input status:", e);
          }
        })();
      } else if (node.type === 'llmNode') {
        (async () => {
          const nodeName = (node.data as any).title || 'LLM';
          try {
            rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'executing' }, style: { boxShadow: '0 0 0 2px rgba(245,158,11,0.5)', borderRadius: '24px' } } : n));
            addLog(nodeName, 'Iniciando razonamiento…', 'info');

            const latestEdges = rfGetEdges();
            const incomingEdges = latestEdges.filter(e => e.target === node.id);
            const upstreamContext: string[] = [];
            for (const edge of incomingEdges) {
              const srcNode = currentNodes.find(n => n.id === edge.source);
              if (srcNode?.type === 'characterBreakdown') upstreamContext.push(`Personaje: ${(srcNode.data as any).description || (srcNode.data as any).flavor}`);
              if (srcNode?.type === 'promptBuilder') upstreamContext.push(`Prompt: ${(srcNode.data as any).compiledPrompt}`);
              if (srcNode?.type === 'textInput') upstreamContext.push(`Entrada: ${(srcNode.data as any).value || (srcNode.data as any).prompt}`);
              if (srcNode?.type === 'llmNode') upstreamContext.push(`Previo: ${(srcNode.data as any).output}`);
            }

            const prompt = (node.data as any).prompt || "Genera una respuesta profesional";
            const finalPrompt = upstreamContext.length > 0 
              ? `Contexto:\n${upstreamContext.join('\n---\n')}\n\nInstrucción: ${prompt}`
              : prompt;

            const selectedModel = (node.data as any).model || 'deepseek-chat';
            const result = await aiService.processAction({
              action: 'chat',
              prompt: finalPrompt,
              model: selectedModel,
              node_id: (spaceId && isPersisted) ? node.id : undefined
            });

            rfSetNodes((nds) => nds.map((n) => n.id === nodeId
              ? { ...n, data: { ...n.data, status: 'ready', output: result.text }, style: { boxShadow: '0 0 0 2px rgba(52,211,153,0.4)', borderRadius: '24px' } }
              : n
            ));

            await supabase.from('canvas_nodes').update({
               status: 'ready',
               data_payload: { ...node.data, status: 'ready', output: result.text, model: selectedModel }
            }).eq('id', nodeId);

            addLog(nodeName, 'Completado ✓', 'success');
            toast.success("Respuesta de IA generada");
          } catch (e: any) {
            rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'error' }, style: { boxShadow: '0 0 0 2px rgba(239,68,68,0.5)', borderRadius: '24px' } } : n));
            addLog(nodeName, 'Error: ' + (e?.message ?? 'desconocido'), 'error');
            toast.error("Error en LLM: " + (e?.message || 'IA ocupada'));
          }
        })();
      } else if (node.type === 'modelView') {
        (async () => {
          const nodeName = (node.data as any).title || 'Imagen';
          try {
            rfSetNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'executing' }, style: { boxShadow: '0 0 0 2px rgba(245,158,11,0.5)', borderRadius: '24px' } } : n));
            addLog(nodeName, 'Iniciando ejecución…', 'info');

            const latestEdges = rfGetEdges();
            const incomingEdges = latestEdges.filter(e => e.target === node.id);
            const upstreamContext: string[] = [];
            for (const edge of incomingEdges) {
              const srcNode = currentNodes.find(n => n.id === edge.source);
              if (srcNode?.type === 'characterBreakdown') upstreamContext.push(`Personaje: ${(srcNode.data as any).description}`);
              if (srcNode?.type === 'promptBuilder') upstreamContext.push((srcNode.data as any).compiledPrompt);
              if (srcNode?.type === 'textInput') upstreamContext.push((srcNode.data as any).value || (srcNode.data as any).prompt);
              if (srcNode?.type === 'llmNode') upstreamContext.push((srcNode.data as any).output);
            }

            const nodePrompt = (node.data as any).prompt || "High quality marketing visual";
            const finalPrompt = upstreamContext.length > 0 ? `${upstreamContext.join('. ')}. ${nodePrompt}` : nodePrompt;

            const result = await aiService.processAction({
              action: 'image',
              prompt: finalPrompt,
              model: (node.data as any).model || 'flux-schnell',
              node_id: (spaceId && isPersisted) ? node.id : undefined
            });

            rfSetNodes((nds) => nds.map((n) =>
              n.id === node.id
                ? { ...n, data: { ...n.data, status: 'ready', assetUrl: result.url }, style: { boxShadow: '0 0 0 2px rgba(52,211,153,0.4)', borderRadius: '24px' } }
                : n
            ));

            await supabase.from('canvas_nodes').update({
              asset_url: result.url,
              status: 'ready'
            }).eq('id', node.id);

            addLog(nodeName, 'Completado ✓', 'success');
            toast.success("Imagen generada correctamente");
          } catch (error: any) {
            rfSetNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'error' }, style: { boxShadow: '0 0 0 2px rgba(239,68,68,0.5)', borderRadius: '24px' } } : n));
            const { userMessage, canRetry } = classifyError(error?.message ?? '');
            addLog(nodeName, 'Error: ' + (error?.message ?? 'desconocido'), 'error');
            toast.error(userMessage, {
              action: canRetry ? { label: 'Reintentar', onClick: () => executeNode(node.id) } : undefined,
            });
          }
        })();
      } else if (node.type === 'videoModel') {
        (async () => {
          const nodeName = (node.data as any).title || 'Video';
          try {
            rfSetNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'loading' }, style: { boxShadow: '0 0 0 2px rgba(245,158,11,0.5)', borderRadius: '24px' } } : n));
            addLog(nodeName, 'Iniciando ejecución…', 'info');
            await new Promise(resolve => setTimeout(resolve, 3000));
            const videoUrl = 'https://cdn.pixabay.com/video/2023/10/20/185834-876356744_tiny.mp4';
            const selectedModel = (node.data as any).model || 'video';
            rfSetNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'ready', assetUrl: videoUrl }, style: { boxShadow: '0 0 0 2px rgba(52,211,153,0.4)', borderRadius: '24px' } } : n));
            await supabase.from('canvas_nodes').update({
               asset_url: videoUrl,
               status: 'ready',
               data_payload: { ...node.data, assetUrl: videoUrl, status: 'ready', model: selectedModel }
            }).eq('id', node.id);
            addLog(nodeName, 'Completado ✓', 'success');
            toast.success(`Video renderizado con ${selectedModel}`);
          } catch (error: any) {
            rfSetNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, status: 'error' }, style: { boxShadow: '0 0 0 2px rgba(239,68,68,0.5)', borderRadius: '24px' } } : n));
            addLog(nodeName, 'Error: ' + (error?.message ?? 'desconocido'), 'error');
            toast.error("Error al renderizar video");
          }
        })();
      } else if (node.type === 'captionNode') {
        (async () => {
          const nodeName = (node.data as any).title || 'Caption';
          try {
            rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'executing' }, style: { boxShadow: '0 0 0 2px rgba(245,158,11,0.5)', borderRadius: '24px' } } : n));
            addLog(nodeName, 'Generando caption…', 'info');

            const latestEdges = rfGetEdges();
            const incomingEdges = latestEdges.filter(e => e.target === node.id);
            const upstreamContext: string[] = [];
            for (const edge of incomingEdges) {
              const srcNode = currentNodes.find(n => n.id === edge.source);
              if (srcNode?.type === 'characterBreakdown') upstreamContext.push(`Identidad: ${(srcNode.data as any).description}`);
              if (srcNode?.type === 'llmNode') upstreamContext.push(`Draft: ${(srcNode.data as any).output}`);
              if (srcNode?.type === 'textInput') upstreamContext.push(`Notas: ${(srcNode.data as any).value}`);
            }

            const platform = (node.data as any).platform || 'Instagram';
            const style = (node.data as any).style || 'Persuasivo';
            const finalPrompt = `Genera un copy/caption de alto impacto para ${platform}. Estilo: ${style}. Contexto upstream:\n${upstreamContext.join('\n')}`;

            const result = await aiService.processAction({
              action: 'chat',
              prompt: finalPrompt,
              model: 'deepseek-chat',
              node_id: (spaceId && isPersisted) ? node.id : undefined
            });

            rfSetNodes((nds) => nds.map((n) => n.id === nodeId
              ? { ...n, data: { ...n.data, status: 'ready', caption: result.text }, style: { boxShadow: '0 0 0 2px rgba(52,211,153,0.4)', borderRadius: '24px' } }
              : n
            ));

            await supabase.from('canvas_nodes').update({
               status: 'ready',
               data_payload: { ...node.data, status: 'ready', caption: result.text }
            }).eq('id', nodeId);

            addLog(nodeName, 'Listo ✓', 'success');
            toast.success(`Caption para ${platform} listo`);
          } catch (e: any) {
            rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'error' }, style: { boxShadow: '0 0 0 2px rgba(239,68,68,0.5)', borderRadius: '24px' } } : n));
            addLog(nodeName, 'Error: ' + (e?.message ?? 'desconocido'), 'error');
          }
        })();
      } else if (node.type === 'promptBuilder') {
        (async () => {
          const nodeName = (node.data as any).title || 'Prompt Builder';
          try {
            rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'executing' } } : n));
            addLog(nodeName, 'Compilando variables…', 'info');

            const latestEdges = rfGetEdges();
            const incomingEdges = latestEdges.filter(e => e.target === node.id);
            const variables: Record<string, string> = {};
            for (const edge of incomingEdges) {
              const srcNode = currentNodes.find(n => n.id === edge.source);
              if (!srcNode) continue;
              if (srcNode.type === 'textInput') variables['input'] = (srcNode.data as any).value || '';
              if (srcNode.type === 'llmNode') variables['context'] = (srcNode.data as any).output || '';
            }

            let compiled = (node.data as any).template || '';
            const firstText = Object.values(variables)[0] || '';
            compiled = compiled.replace(/{{input}}/gi, firstText);

            rfSetNodes((nds) => nds.map((n) => n.id === nodeId
              ? { ...n, data: { ...n.data, status: 'ready', compiledPrompt: compiled }, style: { boxShadow: '0 0 0 2px rgba(52,211,153,0.4)', borderRadius: '24px' } }
              : n
            ));

            await supabase.from('canvas_nodes').update({
               status: 'ready',
               data_payload: { ...node.data, status: 'ready', compiledPrompt: compiled }
            }).eq('id', nodeId);

            addLog(nodeName, 'Compilado ✓', 'success');
          } catch (e: any) {
             rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'error' } } : n));
          }
        })();
      } else if (node.type === 'layoutBuilder') {
        (async () => {
          const nodeName = (node.data as any).title || 'Layout';
          try {
            rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'executing' }, style: { boxShadow: '0 0 0 2px rgba(245,158,11,0.5)', borderRadius: '24px' } } : n));
            addLog(nodeName, 'Iniciando ejecución…', 'info');

            const latestEdges = rfGetEdges();
            const incomingEdges = latestEdges.filter(e => e.target === node.id);
            const upstreamContext: string[] = [];
            for (const edge of incomingEdges) {
              const srcNode = currentNodes.find(n => n.id === edge.source);
              if (srcNode?.type === 'characterBreakdown') upstreamContext.push(`Identidad: ${(srcNode.data as any).description}`);
              if (srcNode?.type === 'llmNode') upstreamContext.push(`Contenido: ${(srcNode.data as any).output}`);
              if (srcNode?.type === 'textInput') upstreamContext.push(`Instrucciones: ${(srcNode.data as any).value}`);
            }

            const selectedModel = (node.data as any).model || 'claude-3.5-sonnet';
            const layoutPrompt = `Genera un mapa de componentes React/Tailwind para una landing page de tipo ${node.data.title}. Plataforma: ${node.data.platform}. Estructura deseada: ${node.data.structure}. Contexto: ${upstreamContext.join(' ')}`;

            const result = await aiService.processAction({
              action: 'ui',
              prompt: layoutPrompt,
              model: selectedModel,
              node_id: (spaceId && isPersisted) ? node.id : undefined
            });

            rfSetNodes((nds) => nds.map((n) => n.id === nodeId
              ? { ...n, data: { ...n.data, status: 'ready', structure: JSON.stringify(result.ui || result, null, 2) }, style: { boxShadow: '0 0 0 2px rgba(52,211,153,0.4)', borderRadius: '24px' } }
              : n
            ));

            await supabase.from('canvas_nodes').update({
               status: 'ready',
               data_payload: { ...node.data, status: 'ready', structure: JSON.stringify(result.ui || result, null, 2), model: selectedModel }
            }).eq('id', nodeId);

            addLog(nodeName, 'Completado ✓', 'success');
            toast.success(`Layout ${node.data.title} generado`);
          } catch (e: any) {
            rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'error' }, style: { boxShadow: '0 0 0 2px rgba(239,68,68,0.5)', borderRadius: '24px' } } : n));
            addLog(nodeName, 'Error: ' + (e?.message ?? 'desconocido'), 'error');
            toast.error("Error al generar layout");
          }
        })();
      } else if (node.type === 'campaignManager') {
        (async () => {
          const nodeName = (node.data as any).title || 'Campaign Mgr';
          try {
            rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'executing' } } : n));
            addLog(nodeName, 'Orquestando campaña…', 'info');
            
            const latestEdges = rfGetEdges();
            const incomingEdges = latestEdges.filter(e => e.target === node.id);
            const assets: any[] = [];
            for (const edge of incomingEdges) {
              const srcNode = currentNodes.find(n => n.id === edge.source);
              if (!srcNode) continue;
              if (srcNode.data.assetUrl) assets.push({ type: srcNode.type, url: srcNode.data.assetUrl });
              if (srcNode.data.output || srcNode.data.caption) assets.push({ type: srcNode.type, text: srcNode.data.output || srcNode.data.caption });
            }

            await new Promise(r => setTimeout(r, 2000));
            
            rfSetNodes((nds) => nds.map((n) => n.id === nodeId
              ? { ...n, data: { ...n.data, status: 'ready', assets_found: assets.length }, style: { boxShadow: '0 0 0 2px rgba(52,211,153,0.4)', borderRadius: '24px' } }
              : n
            ));

            await supabase.from('canvas_nodes').update({
               status: 'ready',
               data_payload: { ...node.data, status: 'ready', assets_found: assets.length }
            }).eq('id', nodeId);

            addLog(nodeName, 'Campaña orquestada ✓', 'success');
            toast.success("Campaña lista para distribución");
          } catch (e: any) {
             rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'error' } } : n));
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
            model: (node.data as any).model || 'flux-schnell',
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


  // --- NODE HANDLERS & FACTORY ---
  const handleAddConnected = useCallback(async (sourceId: string, targetType: string) => {
    const newNodeId = crypto.randomUUID();
    const currentNodes = rfGetNodes();
    const sourceNode = currentNodes.find(n => n.id === sourceId);
    if (!sourceNode) return;
    
    const position = { x: sourceNode.position.x + 400, y: sourceNode.position.y };
    const newNode: Node = {
      id: newNodeId,
      type: targetType,
      position,
      data: {
        title: `Nuevo ${targetType}`,
        status: 'idle',
        prompt: '',
      },
    };

    setNodes((nds) => nds.concat(newNode));

    const newEdge: Edge = {
      id: `e-${sourceId}-${newNodeId}`,
      source: sourceId,
      target: newNodeId,
      type: 'smoothstep',
      animated: true,
      style: { stroke: 'rgba(168,85,247,0.35)', strokeWidth: 2 },
    };
    setEdges((eds) => addEdge(newEdge, eds));

    if (spaceId && user) {
      await supabase.from('canvas_nodes').insert({
        id: newNodeId,
        space_id: spaceId,
        user_id: user.id,
        type: targetType,
        pos_x: position.x,
        pos_y: position.y,
        prompt: targetType,
        status: 'idle',
        data_payload: newNode.data as any
      });
    }

    toast.success(`Nodo ${targetType} conectado`);
  }, [rfGetNodes, setNodes, setEdges, spaceId, user]);

  // Refs keep callbacks stable so nodeTypes never re-creates (prevents ReactFlow node remounts)
  const executeNodeRef = useRef<typeof executeNode>(executeNode);
  useEffect(() => { executeNodeRef.current = executeNode; });
  const executeVariationRef = useRef<typeof executeVariation>(executeVariation);
  useEffect(() => { executeVariationRef.current = executeVariation; });
  const handleAddConnectedRef = useRef<typeof handleAddConnected>(handleAddConnected);
  useEffect(() => { handleAddConnectedRef.current = handleAddConnected; });

  const nodeTypes = useMemo(() => {
    const inject = (Component: any) => memo((props: any) => (
      <Component
        {...props}
        data={{
          ...props.data,
          onExecute: () => executeNodeRef.current(props.id),
          onVariation: () => executeVariationRef.current(props.id),
          onAddConnected: (sourceId: string, targetType: string) => handleAddConnectedRef.current(sourceId, targetType)
        }}
      />
    ));

    return {
      characterBreakdown: inject(CharacterBreakdownNode),
      textInput: inject(TextInputNode),
      llmNode: inject(LLMNode),
      modelView: inject(ModelNode),
      videoModel: inject(VideoModelNode),
      layoutBuilder: inject(LayoutBuilderNode),
      campaignManager: inject(CampaignManagerNode),
      captionNode: inject(CaptionNode),
      promptBuilder: inject(PromptBuilderNode),
      exportNode: inject(ExportNode),
      antigravityBridge: inject(AntigravityBridgeNode),
    };
  }, []); // empty deps — nodeTypes never re-creates, no node remounts

  const handleManualAddNode = useCallback((type: string, label: string) => {
    const newNodeId = crypto.randomUUID();
    const newNode: Node = {
      id: newNodeId,
      type,
      position: screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }),
      data: {
        title: label,
        status: 'idle',
        prompt: '',
      },
    };
    setNodes((nds) => nds.concat(newNode));
    toast.success(`${label} añadido`);
  }, [screenToFlowPosition, setNodes]);

  const handleExecute = async () => {
    if (nodes.length === 0) { toast.error("No hay nodos que ejecutar"); return; }

    const ORDER = ['textInput', 'characterBreakdown', 'promptBuilder', 'llmNode', 'modelView', 'videoModel', 'layoutBuilder', 'captionNode', 'campaignManager', 'antigravityBridge'];
    const sorted = [...nodes].sort((a, b) => ORDER.indexOf(a.type as string) - ORDER.indexOf(b.type as string));

    setExecStatus('running');
    setExecNodeCount(sorted.length);
    setExecDone(0);
    toast.info(`Ejecutando ${sorted.length} nodo${sorted.length > 1 ? 's' : ''}...`);

    try {
      for (let i = 0; i < sorted.length; i++) {
        await executeNode(sorted[i].id);
        setExecDone(i + 1);
      }
      setExecStatus('success');
      toast.success("Flujo completado.");
      setTimeout(() => setExecStatus('idle'), 4000);
    } catch {
      setExecStatus('error');
      setTimeout(() => setExecStatus('idle'), 4000);
    }
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
            // Handlers injected by nodeTypes factory
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

  // Harmonized listener for event-based node generation (NodeNextAction)
  useEffect(() => {
    const onAddRequest = (e: any) => {
      const { sourceId, nodeType } = e.detail;
      handleAddConnected(sourceId, nodeType);
    };
    window.addEventListener('add-next-node', onAddRequest);
    return () => window.removeEventListener('add-next-node', onAddRequest);
  }, [handleAddConnected]);


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
            // Handlers injected by factory
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


  return (
    <>
      <Helmet>
        <title>Studio · Canvas | Creator IA Pro</title>
        <meta name="description" content="Crea campañas visuales con IA. Conecta personajes, imágenes y videos en un lienzo intuitivo." />
      </Helmet>
      <AppHeader userId={user?.id} onSignOut={signOut} />

      {/* ── Mobile Warning Overlay ──────────────────────────────────────────── */}
      {isMobile && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-8 bg-[#020203]/95 backdrop-blur-2xl px-8 text-center">
          <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
            <Smartphone className="w-10 h-10 text-primary/70" />
          </div>
          <div className="space-y-3 max-w-xs">
            <h2 className="text-xl font-bold text-white font-display">Experiencia de escritorio</h2>
            <p className="text-sm text-white/40 leading-relaxed">El Studio Canvas requiere un teclado y pantalla grande para la mejor experiencia creativa.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white text-sm font-bold transition-all hover:bg-primary/90 active:scale-95"
          >
            Ir al Dashboard
          </button>
          <button
            onClick={() => setIsMobile(false)}
            className="text-xs text-white/20 hover:text-white/50 transition-colors"
          >
            Continuar de todas formas
          </button>
        </div>
      )}

      {/* ── Onboarding Overlay (primera visita) ─────────────────────────────── */}
      {showOnboarding && !isMobile && (
        <div className="fixed bottom-8 right-8 z-[150] w-80 bg-card border border-border hover:border-border/80 hover:bg-muted/50 transition-colors rounded-3xl p-6 shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] font-display">Primeros pasos</span>
            <button onClick={dismissOnboarding} className="text-white/20 hover:text-white/60 transition-colors text-xs">Saltar</button>
          </div>
          <div className="space-y-4">
            {ONBOARDING_STEPS.map((step, i) => (
              <div key={i} className={`flex items-start gap-3 transition-all duration-300 ${i === onboardingStep ? 'opacity-100' : 'opacity-30'}`}>
                <div className={`p-2 rounded-xl shrink-0 ${i === onboardingStep ? 'bg-primary/20 border border-primary/30' : 'bg-white/5 border border-white/5'}`}>
                  <step.icon className={`w-4 h-4 ${i === onboardingStep ? 'text-primary' : 'text-white/20'}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/80">{step.title}</p>
                  {i === onboardingStep && <p className="text-[11px] text-white/40 mt-1 leading-relaxed">{step.desc}</p>}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-6">
            <div className="flex gap-1">
              {ONBOARDING_STEPS.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all ${i === onboardingStep ? 'w-4 bg-primary' : 'w-2 bg-white/10'}`} />
              ))}
            </div>
            {onboardingStep < ONBOARDING_STEPS.length - 1 ? (
              <button
                onClick={() => setOnboardingStep(s => s + 1)}
                className="flex items-center gap-1 text-xs font-bold text-white/60 hover:text-white transition-colors"
              >
                Siguiente <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={dismissOnboarding}
                className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              >
                Empezar <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      <AppHeader onSignOut={signOut} />
      <div className="w-screen bg-[#020203] font-sans text-white/90 flex flex-col overflow-hidden relative selection:bg-primary/20" style={{ height: 'calc(100vh - 64px)', marginTop: '64px' }}>
      {/* Canvas Toolbar */}
      <div className="flex h-14 w-full items-center justify-between border-b border-white/[0.06] bg-[#050506]/80 px-5 backdrop-blur-3xl shrink-0 z-[90]">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="hover:bg-white/5 rounded-xl w-9 h-9 text-white/30 hover:text-white transition-all">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-5 w-px bg-white/[0.06]" />
          {/* Templates */}
          <button
            onClick={() => setShowLanding(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.06] hover:border-primary/30 hover:bg-primary/5 transition-all"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-pulse" />
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Plantillas</span>
          </button>
          {/* Quick-add node (HU28) */}
          <button
            onClick={() => setCmdOpen(true)}
            title="Añadir nodo (Espacio)"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.06] hover:border-white/20 hover:bg-white/5 transition-all"
          >
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">+ Nodo</span>
            <kbd className="text-[9px] font-mono text-white/15 border border-white/[0.06] px-1 rounded">Espacio</kbd>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Undo/Redo (HU34) */}
          <Button variant="ghost" size="icon" onClick={undo} title="Deshacer (Ctrl+Z)" className="w-8 h-8 rounded-lg text-white/25 hover:text-white hover:bg-white/5 transition-all">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} title="Rehacer (Ctrl+Y)" className="w-8 h-8 rounded-lg text-white/25 hover:text-white hover:bg-white/5 transition-all">
            <RotateCw className="w-3.5 h-3.5" />
          </Button>
          <div className="h-5 w-px bg-white/[0.06] mx-1" />
          {/* Auto-layout */}
          <Button variant="ghost" onClick={autoLayout} title="Auto-organizar (Dagre)" className="h-8 px-3 rounded-lg text-white/25 hover:text-white hover:bg-white/5 text-xs gap-1.5 transition-all">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider">Organizar</span>
          </Button>
          {/* Snap grid toggle (HU26) */}
          <Button
            variant="ghost"
            onClick={() => setSnapEnabled(s => !s)}
            title="Snap a rejilla"
            className={`h-8 px-3 rounded-lg text-xs gap-1.5 transition-all ${snapEnabled ? 'text-primary bg-primary/10' : 'text-white/25 hover:text-white hover:bg-white/5'}`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </Button>
          <div className="h-5 w-px bg-white/[0.06] mx-1" />
          {/* Share screen */}
          <Button variant="ghost" onClick={() => navigate('/sharescreen')} className="hidden sm:flex items-center gap-1.5 text-primary/50 hover:text-primary hover:bg-primary/5 rounded-xl px-3 h-8 text-[10px] font-bold transition-all">
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Compartir</span>
          </Button>
          {/* Export */}
          <Button variant="ghost" onClick={() => setExportOpen(true)} disabled={nodes.length === 0} className="hidden sm:flex items-center gap-1.5 text-white/25 hover:text-white hover:bg-white/5 rounded-xl px-3 h-8 text-[10px] font-bold transition-all disabled:opacity-20">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Exportar</span>
          </Button>
          <Button variant="ghost" onClick={handleClear} disabled={nodes.length === 0 && edges.length === 0} className="text-white/25 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl px-3 h-8 text-[10px] font-bold gap-1.5 transition-all disabled:opacity-20">
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Limpiar</span>
          </Button>
          <div className="h-5 w-px bg-white/[0.06] mx-1" />
          <Button
            onClick={handleExecute}
            disabled={nodes.length === 0 || execStatus === 'running'}
            className="h-8 bg-white hover:bg-white/90 text-black rounded-xl gap-2 font-bold px-4 shadow-lg text-xs transition-all active:scale-95 disabled:opacity-30"
          >
            <Zap className={`w-3.5 h-3.5 fill-current ${execStatus === 'running' ? 'animate-pulse' : ''}`} />
            {execStatus === 'running' ? `${execDone}/${execNodeCount}` : 'Ejecutar'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
      {/* ── Left Sidebar ────────────────────────────────────────────────── */}
      <FormarketingSidebar onAddNode={handleManualAddNode} />

      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <div className="relative flex-1 flex flex-col" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={(_, node) => {
            setSelectedNodeId(node.id);
          }}
          onPaneClick={() => setSelectedNodeId(null)}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background"
          colorMode="dark"
          minZoom={0.1}
          maxZoom={4}
          snapToGrid={snapEnabled}
          snapGrid={[20, 20]}
          selectionMode={SelectionMode.Partial}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: {
              stroke: execStatus === 'running' ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.08)',
              strokeWidth: execStatus === 'running' ? 2.5 : 2,
            },
          }}
        >
          <Background
            color="#ffffff03"
            variant={BackgroundVariant.Dots}
            gap={40}
            size={1}
          />
          <Controls className="!bg-[#0a0a0b]/90 !border-white/5 !fill-white/20 !bottom-16 !right-40 !left-auto rounded-2xl overflow-hidden scale-110 shadow-3xl backdrop-blur-xl transition-all hover:bg-[#0a0a0b]" />
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

        {/* Execution log panel */}
        <div className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ${logOpen ? 'h-48' : 'h-8'}`}
          style={{ background: 'rgba(10,10,16,0.92)', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setLogOpen(!logOpen)}
            className="flex items-center gap-2 px-4 h-8 w-full text-left"
          >
            <div className={`h-1.5 w-1.5 rounded-full ${execStatus === 'running' ? 'bg-yellow-400 animate-pulse' : execLog.some(l => l.type === 'error') ? 'bg-red-400' : 'bg-[#34d399]'}`} />
            <Terminal className="w-3 h-3 text-white/20" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Execution Log</span>
            <span className="text-[10px] text-white/20">{execLog.length} eventos</span>
            <div className="flex-1" />
            <span className="text-[10px] text-white/20">{logOpen ? '▼' : '▲'}</span>
          </button>
          {logOpen && (
            <div className="overflow-y-auto h-40 px-4 py-2 space-y-0.5 font-mono">
              {execLog.length === 0 ? (
                <p className="text-[10px] text-white/20 py-4 text-center">Sin eventos. Ejecuta el flujo para ver logs.</p>
              ) : [...execLog].reverse().map((log, i) => (
                <div key={i} className="flex items-start gap-2 py-0.5">
                  <span className="text-[9px] text-white/20 shrink-0 w-16">{log.time}</span>
                  <span className="text-[9px] font-bold shrink-0 w-20 truncate" style={{ color: log.type === 'error' ? '#f87171' : log.type === 'success' ? '#34d399' : '#8AB4F8' }}>{log.node}</span>
                  <span className="text-[9px] text-white/40">{log.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Property Inspector (selected node) ──────────────────────────── */}
      {selectedNodeId && (
        <PropertyInspector
          node={nodes.find(n => n.id === selectedNodeId) ?? null}
          onClose={() => setSelectedNodeId(null)}
          onUpdate={(nodeId, data) => {
            rfSetNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n));
          }}
          onExecute={(nodeId) => { executeNode(nodeId); }}
          onDelete={(nodeId) => {
            setNodes(nds => nds.filter(n => n.id !== nodeId));
            toast.success('Nodo eliminado');
          }}
        />
      )}

      </div>

      {/* ── Export Modal ─────────────────────────────────────────────────── */}
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        nodes={nodes}
        edges={edges}
        spaceName={spaceId ? `space-${spaceId.slice(0, 6)}` : 'canvas'}
      />

      {/* HU28 — Command Palette */}
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onSelect={(type, label) => handleManualAddNode(type, label)}
      />

      {/* HU33 — Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-8 border-t border-white/[0.04] bg-[#020203]/80 backdrop-blur-sm flex items-center px-4 gap-4 z-[80] pointer-events-none">
        <div className="flex items-center gap-2">
          <Circle className={`w-2 h-2 fill-current shrink-0 ${
            execStatus === 'running' ? 'text-amber-400 animate-pulse' :
            execStatus === 'success' ? 'text-green-400' :
            execStatus === 'error'   ? 'text-rose-400' : 'text-white/15'
          }`} />
          <span className={`text-[10px] font-medium ${
            execStatus === 'running' ? 'text-amber-400/70' :
            execStatus === 'success' ? 'text-green-400/70' :
            execStatus === 'error'   ? 'text-rose-400/70' : 'text-white/20'
          }`}>
            {execStatus === 'running' ? `Ejecutando... ${execDone}/${execNodeCount}` :
             execStatus === 'success' ? 'Flujo completado' :
             execStatus === 'error'   ? 'Error en ejecución' : 'Listo'}
          </span>
        </div>
        <div className="h-3 w-px bg-white/[0.06]" />
        <span className="text-[10px] text-white/15">{nodes.length} nodo{nodes.length !== 1 ? 's' : ''} · {edges.length} conex.</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[10px] text-white/10">Espacio: añadir nodo</span>
          <span className="text-[10px] text-white/10">Ctrl+Z: deshacer</span>
          {snapEnabled && <span className="text-[10px] text-primary/50">Snap ON</span>}
        </div>
      </div>

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
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Studio · Plantillas</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight font-display mb-4">
            Elige una <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">plantilla</span>
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
              className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-2xl pl-4 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/30 transition-all"
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
              className="group bg-card border border-border hover:border-border/80 hover:bg-muted/50 transition-colors rounded-[2rem] border border-white/5 p-6 text-left hover:border-primary/30 hover:scale-[1.02] transition-all duration-300 active:scale-[0.98]"
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
                <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">Usar →</span>
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
