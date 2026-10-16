import React, { useState, useCallback, useEffect, useMemo, useRef, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from "react-helmet-async";
import { Layers } from 'lucide-react';
import {
  Background, Controls, MiniMap, ReactFlow, addEdge,
  Connection, Edge, Node, NodeProps, ReactFlowProvider,
  useNodesState, useEdgesState, useReactFlow,
  type NodeChange, type EdgeChange, BackgroundVariant,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAuth } from "@/hooks/useAuth";
import { toast } from 'sonner';
import { createCanvasNode, deleteCanvasNode, updateCanvasNode, upsertCanvasEdges } from '@/lib/canvas-nodes';
import { createSpace } from '@/lib/spaces';
import { type Template } from '@/lib/templates';

// Components
import CharacterBreakdownNode from '@/components/formarketing/CharacterBreakdownNode';
import ModelNode from '@/components/formarketing/ModelNode';
import LayoutBuilderNode from '@/components/formarketing/LayoutBuilderNode';
import { FormarketingSidebar } from '@/components/formarketing/FormarketingSidebar';
import RetiredNode from '@/components/formarketing/RetiredNode';
import CaptionNode from '@/components/formarketing/CaptionNode';
import PromptBuilderNode from '@/components/formarketing/PromptBuilderNode';
import LLMNode from '@/components/formarketing/LLMNode';
import TextInputNode from '@/components/formarketing/TextInputNode';
import ExportNode from '@/components/formarketing/ExportNode';
import AnimatedEdge from '@/components/formarketing/AnimatedEdge';
import { BlueprintProjectNode } from '@/components/formarketing/BlueprintProjectNode';
import { BlueprintPageNode } from '@/components/formarketing/BlueprintPageNode';
import { CommandPalette } from '@/components/formarketing/CommandPalette';
import { PropertyInspector } from '@/components/formarketing/PropertyInspector';
import { ExportModal } from '@/components/formarketing/ExportModal';
import { StudioToolbar } from '@/components/studio/StudioToolbar';
import { Onboarding } from './formarketing/components/Onboarding';
import { ExecutionLog } from './formarketing/components/ExecutionLog';
import { EXECUTABLE_NODE_TYPES, NODE_META } from '@/components/formarketing/nodeConnections';

// Hooks
import { CanvasExecContext } from './formarketing/CanvasExecContext';
import { useCanvasPersistence } from './formarketing/hooks/useCanvasPersistence';
import { useCanvasExecution } from './formarketing/hooks/useCanvasExecution';
import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import { useCanvasSync } from './formarketing/hooks/useCanvasSync';

// --- Node Wrappers to satisfy IDE parser ---
// Pass only { id, data } to child nodes — they don't accept full NodeProps.
// La ejecución llega por CanvasExecContext (ver CanvasExecContext.ts), ya no
// viaja inyectada dentro de data._context.
const CharacterBreakdownNodeWrapper = memo((props: NodeProps) => {
  return <CharacterBreakdownNode id={props.id} data={props.data as any} />;
});

const ModelNodeWrapper = memo((props: NodeProps) => {
  return <ModelNode id={props.id} data={props.data as any} />;
});

const LayoutBuilderNodeWrapper = memo((props: NodeProps) => {
  return <LayoutBuilderNode id={props.id} data={props.data as any} />;
});

const CaptionNodeWrapper = memo((props: NodeProps) => {
  return <CaptionNode id={props.id} data={props.data as any} />;
});

const PromptBuilderNodeWrapper = memo((props: NodeProps) => {
  return <PromptBuilderNode id={props.id} data={props.data as any} />;
});

const LLMNodeWrapper = memo((props: NodeProps) => {
  return <LLMNode id={props.id} data={props.data as any} />;
});

const TextInputNodeWrapper = memo((props: NodeProps) => {
  return <TextInputNode id={props.id} data={props.data as any} />;
});

// Tipos retirados en Fase 0 (teatro / sin backend): las filas guardadas se
// muestran como RetiredNode con botón para borrarlas de verdad.
const RetiredNodeWrapper = memo((props: NodeProps) => {
  return <RetiredNode id={props.id} type={props.type} />;
});

CharacterBreakdownNodeWrapper.displayName = 'CharacterBreakdownNodeWrapper';
ModelNodeWrapper.displayName = 'ModelNodeWrapper';
LayoutBuilderNodeWrapper.displayName = 'LayoutBuilderNodeWrapper';
CaptionNodeWrapper.displayName = 'CaptionNodeWrapper';
PromptBuilderNodeWrapper.displayName = 'PromptBuilderNodeWrapper';
LLMNodeWrapper.displayName = 'LLMNodeWrapper';
TextInputNodeWrapper.displayName = 'TextInputNodeWrapper';
RetiredNodeWrapper.displayName = 'RetiredNodeWrapper';

// Blueprint node wrappers
const BlueprintProjectNodeWrapper = memo((props: NodeProps) => {
  return <BlueprintProjectNode id={props.id} data={props.data as any} />;
});
BlueprintProjectNodeWrapper.displayName = 'BlueprintProjectNodeWrapper';

const BlueprintPageNodeWrapper = memo((props: NodeProps) => {
  return <BlueprintPageNode id={props.id} data={props.data as any} />;
});
BlueprintPageNodeWrapper.displayName = 'BlueprintPageNodeWrapper';

const FormarketingContent = () => {
  const { user } = useAuth("/auth");
  const [searchParams, setSearchParams] = useSearchParams();
  const [autoSpaceId, setAutoSpaceId] = useState<string | null>(null);
  const spaceId = searchParams.get('spaceId') || searchParams.get('space') || autoSpaceId;
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition, getNodes, getEdges } = useReactFlow();

  // Canvas State
  const [cmdOpen, setCmdOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [execStatus, setExecStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('fm_onboarded'));
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [execLog, setExecLog] = useState<{ time: string; node: string; msg: string; type: 'info' | 'success' | 'error' }[]>([]);

  const addLog = useCallback((node: string, msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setExecLog(prev => [...prev.slice(-49), { time, node, msg, type }]);
  }, []);

  const { takeSnapshot, undo, redo, canUndo, canRedo } = useCanvasHistory();
  const record = useCallback(() => {
    takeSnapshot(getNodes(), getEdges());
  }, [takeSnapshot, getNodes, getEdges]);

  // Modular Logic
  // Espacios nacidos en esta sesión: la carga inicial se salta (ver hook).
  const espacioPropioRef = useRef<string | null>(null);

  const { handleNodesChange, handleEdgesChange } = useCanvasPersistence(
    spaceId, user, setNodes, setEdges, onNodesChange, onEdgesChange, edges, record, espacioPropioRef
  );

  // Entrar por el menú abría el canvas "Draft": nada se guardaba y no había
  // forma de guardar después. Ahora el primer nodo crea un espacio automático
  // ("Canvas sin título") y deja la URL apuntándole; no se crean espacios
  // vacíos por solo mirar la página.
  const spaceIdRef = useRef(spaceId);
  spaceIdRef.current = spaceId;
  const creatingSpaceRef = useRef<Promise<string | null> | null>(null);

  const ensureSpace = useCallback(async (): Promise<string | null> => {
    if (spaceIdRef.current) return spaceIdRef.current;
    if (!creatingSpaceRef.current) {
      creatingSpaceRef.current = createSpace({ name: 'Canvas sin título' }).then((space) => {
        if (!space) {
          creatingSpaceRef.current = null;
          toast.error('No se pudo crear el espacio: lo que hagas no quedará guardado.');
          return null;
        }
        espacioPropioRef.current = space.id;
        setAutoSpaceId(space.id);
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.set('spaceId', space.id);
          return next;
        }, { replace: true });
        toast.success('Espacio "Canvas sin título" creado: tu trabajo se guarda solo.');
        return space.id;
      });
    }
    return creatingSpaceRef.current;
  }, [setSearchParams]);

  // Crear un nodo lo guarda en la base al instante. Antes solo se persistía al
  // ejecutarlo: un nodo recién puesto desaparecía al recargar.
  const addNode = useCallback(async (type: string, label: string, position: { x: number; y: number }, extraData?: Record<string, unknown>) => {
    const node: Node = {
      id: crypto.randomUUID(),
      type,
      position,
      data: { title: label, status: 'idle', ...extraData },
    };
    setNodes((nds) => nds.concat(node));

    if (!user) return;
    const sid = await ensureSpace();
    if (!sid) return;
    const created = await createCanvasNode({
      id: node.id,
      spaceId: sid,
      type,
      prompt: '',
      status: 'idle',
      dataPayload: node.data,
      posX: position.x,
      posY: position.y,
    });
    if (!created) toast.error(`"${label}" no se pudo guardar — revisa tu conexión.`);
  }, [setNodes, user, ensureSpace]);

  // Enable bi-directional Reverse Sync (Canvas -> Blueprint)
  useCanvasSync(spaceId, user, nodes, edges);

  const execApi = useCanvasExecution(spaceId, user, setNodes, addLog, setEdges);
  const { executeNode, executeFlow } = execApi;

  // EJECUTAR global: corre las cadenas que terminan en nodos de IA sin salida
  // (los "terminales"), cada ancestro una sola vez. Antes era un no-op.
  const runFlow = useCallback(async () => {
    const nds = getNodes();
    const ejecutables = nds.filter(n => EXECUTABLE_NODE_TYPES.has(n.type || ''));
    const idsEjecutables = new Set(ejecutables.map(n => n.id));
    // Terminal = nodo de IA que no alimenta a OTRO nodo de IA. Una salida hacia
    // Exportar o Layout no lo descalifica (si no, las plantillas no corrían).
    const alimentaIA = new Set(getEdges().filter(e => idsEjecutables.has(e.target)).map(e => e.source));
    const terminales = ejecutables.filter(n => !alimentaIA.has(n.id)).map(n => n.id);

    if (terminales.length === 0) {
      toast.info('No hay nodos de IA al final del flujo. Agrega un LLM, una Imagen IA o un Caption.');
      return;
    }

    setExecStatus('running');
    try {
      await executeFlow(terminales);
      setExecStatus('success');
    } catch {
      setExecStatus('error');
    } finally {
      setTimeout(() => setExecStatus('idle'), 1500);
    }
  }, [getNodes, getEdges, executeFlow]);

  // Template Listener
  useEffect(() => {
    const handleAddTemplate = async (event: Event) => {
      const e = event as CustomEvent<Template>;
      const template = e.detail;
      if (!template) return;
      
      record(); // Snapshot for undo
      addLog('Sistema', `Aplicando plantilla: ${template.title}...`, 'info');
      
      const newNodes: Node[] = [];
      const idMap: Record<number, string> = {};
      
      // Transform Nodes
      template.nodes.forEach((tNode, idx) => {
        const id = crypto.randomUUID();
        idMap[idx] = id;
        newNodes.push({
          id,
          type: tNode.type,
          position: { x: 400 + (idx * 300), y: 300 },
          data: {
            ...tNode.data,
            status: 'idle',
            title: tNode.data.title || tNode.type,
          }
        });
      });
      
      // Transform Edges
      const newEdges: Edge[] = (template.edges || []).map(tEdge => ({
        id: crypto.randomUUID(),
        source: idMap[tEdge.source],
        target: idMap[tEdge.target],
        sourceHandle: tEdge.sourceHandle,
        targetHandle: tEdge.targetHandle
      }));
      
      const mergedEdges = [...getEdges(), ...newEdges];
      setNodes(nds => [...nds, ...newNodes]);
      setEdges(mergedEdges);

      // Persist to DB (si no había espacio, la plantilla crea uno). Las
      // conexiones de la plantilla también se guardan: antes quedaban solo en
      // memoria y la recarga las perdía.
      if (user) {
        const sid = await ensureSpace();
        if (!sid) return;
        const results = await Promise.all(newNodes.map(n => createCanvasNode({
          id: n.id,
          spaceId: sid,
          type: n.type || 'default',
          prompt: (n.data as any).prompt || (n.data as any).title || '',
          status: 'idle',
          dataPayload: n.data,
          posX: n.position.x,
          posY: n.position.y,
        })));
        const edgesOk = await upsertCanvasEdges(sid, mergedEdges);

        if (results.some(r => !r) || !edgesOk) {
          toast.error("Error al persistir la plantilla en la base de datos");
        } else {
          addLog('Sistema', `Plantilla '${template.title}' lista.`, 'success');
        }
      }
    };
    
    window.addEventListener('add-template', handleAddTemplate);
    return () => window.removeEventListener('add-template', handleAddTemplate);
  }, [user, setNodes, setEdges, getEdges, record, addLog, ensureSpace]);

  // Handlers
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    const label = event.dataTransfer.getData('application/label');
    if (!type) return;

    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    void addNode(type, label || 'Nuevo', position, { prompt: '' });
  }, [screenToFlowPosition, addNode]);

  const nodeTypes = useMemo(() => ({
    characterBreakdown: CharacterBreakdownNodeWrapper,
    modelView: ModelNodeWrapper,
    videoModel: RetiredNodeWrapper,
    layoutBuilder: LayoutBuilderNodeWrapper,
    campaignManager: RetiredNodeWrapper,
    antigravityBridge: RetiredNodeWrapper,
    captionNode: CaptionNodeWrapper,
    promptBuilder: PromptBuilderNodeWrapper,
    llmNode: LLMNodeWrapper,
    textInput: TextInputNodeWrapper,
    exportNode: ExportNode,
    // Blueprint Strategic Map nodes
    blueprint_project: BlueprintProjectNodeWrapper,
    blueprint_page: BlueprintPageNodeWrapper,
  }), []);

  // Custom edge types with animation
  const edgeTypes = useMemo(() => ({
    animated: AnimatedEdge,
  }), []);

  // Enhanced onConnect that adds data type information
  const handleConnect = useCallback((params: any) => {
    // Get data type from source node's output handle
    const sourceNode = nodes.find(n => n.id === params.source);
    const sourceMeta = sourceNode ? NODE_META[sourceNode.type || ''] : null;
    const outputHandle = sourceMeta?.outputHandles.find(h => h.id === params.sourceHandle);
    const dataType = outputHandle?.dataType || 'any';

    const newEdge = {
      ...params,
      type: 'animated',
      data: {
        dataType,
        isActive: false,
        isExecuting: false,
      },
      animated: true,
      style: { stroke: '#94a3b8', strokeWidth: 2 },
    };

    // Conectar ahora SÍ guarda: antes el edge vivía solo en memoria hasta que
    // otro cambio de edges disparara el guardado (y con el array desactualizado).
    const next = addEdge(newEdge, edges);
    setEdges(next);
    record();
    if (spaceId) void upsertCanvasEdges(spaceId, next);
  }, [nodes, edges, setEdges, record, spaceId]);

  return (
    <CanvasExecContext.Provider value={execApi}>
    <div className="h-full w-full bg-[#f8f9fa] flex flex-col relative overflow-hidden font-sans">
      <Helmet><title>Canvas IA — ForMarketing | Creator IA Pro</title></Helmet>

      {/* pl-16 en xs: la hamburguesa global flota en left-4 sobre el header */}
      <header className="h-[64px] border-b border-black/[0.04] bg-white/40 backdrop-blur-2xl pl-16 pr-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 aether-iridescent">
        <div className="flex items-center gap-4">
           <div className="hidden sm:flex h-10 w-10 rounded-2xl bg-zinc-900 items-center justify-center text-white shadow-xl shadow-zinc-900/10">
             <Layers className="h-5 w-5" />
           </div>
           <div className="min-w-0">
             <h1 className="hidden sm:block text-sm font-black text-zinc-900 tracking-tight uppercase leading-none mb-1">ForMarketing Canvas</h1>
             <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate max-w-[34vw] sm:max-w-none">{spaceId ? 'Se guarda solo' : 'Aún sin guardar: el primer nodo crea tu espacio'}</p>
           </div>
        </div>

        <div className="flex items-center gap-2">
           <StudioToolbar 
             onUndo={() => { const res = undo(nodes, edges); if (res) { setNodes(res.nodes); setEdges(res.edges); } }}
             onRedo={() => { const res = redo(nodes, edges); if (res) { setNodes(res.nodes); setEdges(res.edges); } }}
             canUndo={canUndo} 
             canRedo={canRedo}
             onAddNode={() => setCmdOpen(true)} 
             onExport={() => setExportOpen(true)}
             onToggleSnap={() => setSnapEnabled(s => !s)}
             snapEnabled={snapEnabled}
             onClear={async () => {
               const nds = getNodes();
               if (nds.length === 0) return;
               if (!window.confirm(`Esto borra ${nds.length} nodo(s) y sus conexiones, también de lo guardado. No se puede deshacer.`)) return;
               setNodes([]);
               setEdges([]);
               if (spaceId) {
                 const resultados = await Promise.all([
                   ...nds.map(n => deleteCanvasNode(n.id)),
                   upsertCanvasEdges(spaceId, []),
                 ]);
                 if (resultados.some(r => !r)) {
                   toast.error('No todo se pudo borrar del servidor. Recarga la página para ver lo que quedó.');
                 }
               }
             }}
             onExecute={runFlow}
             execStatus={execStatus}
             onOpenTemplates={() => window.dispatchEvent(new CustomEvent('open-template-modal'))}
             onBack={() => window.history.back()}
           />
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <FormarketingSidebar
          onOpenLogs={() => setLogOpen(true)}
          onAddNode={(type, label) => { void addNode(type, label, { x: 500, y: 300 }); }}
        />
        
        <div className="flex-1 relative flex flex-col h-full bg-white/50">
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onSelectionChange={({ nodes }) => setSelectedNodeId(nodes[0]?.id || null)}
            fitView selectionMode={SelectionMode.Partial}
            snapToGrid={snapEnabled}
            snapGrid={[24, 24]}
            defaultEdgeOptions={{
              type: 'animated',
              animated: true,
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#e5e7eb" />
            <Controls className="!bg-white !border-zinc-200 !rounded-2xl !shadow-xl !m-6" />

            {/* Mini Map for navigation */}
            <MiniMap
              className="hidden sm:block !bg-white/90 !backdrop-blur-xl !border !border-zinc-200 !rounded-2xl !shadow-xl !m-6"
              nodeColor={(node) => {
                const meta = NODE_META[node.type || ''];
                return meta?.color || '#94a3b8';
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
              maskStrokeColor="#3b82f6"
              maskStrokeWidth={2}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}
            />
          </ReactFlow>

          <ExecutionLog logs={execLog} isOpen={logOpen} onClose={() => setLogOpen(false)} />
        </div>

        {selectedNodeId && (
          <PropertyInspector 
            node={nodes.find(n => n.id === selectedNodeId)} 
            onClose={() => setSelectedNodeId(null)}
            onUpdate={(id, data) => {
              setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n));
              if (spaceId) {
                const actual = nodes.find(n => n.id === id);
                void updateCanvasNode(id, {
                  prompt: typeof data.prompt === 'string' ? data.prompt : undefined,
                  dataPayload: { ...(actual?.data ?? {}), ...data },
                });
              }
            }}
            onExecute={() => executeNode(selectedNodeId)}
            onDelete={() => {
              if (spaceId) void deleteCanvasNode(selectedNodeId);
              setNodes(nds => nds.filter(n => n.id !== selectedNodeId));
              const nextEdges = edges.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId);
              if (nextEdges.length !== edges.length) {
                setEdges(nextEdges);
                if (spaceId) void upsertCanvasEdges(spaceId, nextEdges);
              }
              setSelectedNodeId(null);
            }}
          />
        )}
      </main>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onSelect={(type, label) => {
        void addNode(type, label, { x: 500, y: 300 });
        setCmdOpen(false);
      }} />

      {exportOpen && <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} nodes={nodes} edges={edges} />}
      
      {showOnboarding && <Onboarding step={onboardingStep} setStep={setOnboardingStep} onDismiss={() => { localStorage.setItem('fm_onboarded', '1'); setShowOnboarding(false); }} />}
    </div>
    </CanvasExecContext.Provider>
  );
};

export default function Formarketing() {
  return (
    <ReactFlowProvider>
      <FormarketingContent />
    </ReactFlowProvider>
  );
}
