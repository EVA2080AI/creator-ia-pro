import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
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

// Components
import CharacterBreakdownNode from '@/components/formarketing/CharacterBreakdownNode';
import ModelNode from '@/components/formarketing/ModelNode';
import VideoModelNode from '@/components/formarketing/VideoModelNode';
import LayoutBuilderNode from '@/components/formarketing/LayoutBuilderNode';
import CampaignManagerNode from '@/components/formarketing/CampaignManagerNode';
import { FormarketingSidebar } from '@/components/formarketing/FormarketingSidebar';
import AntigravityBridgeNode from '@/components/formarketing/AntigravityBridgeNode';
import CaptionNode from '@/components/formarketing/CaptionNode';
import PromptBuilderNode from '@/components/formarketing/PromptBuilderNode';
import LLMNode from '@/components/formarketing/LLMNode';
import TextInputNode from '@/components/formarketing/TextInputNode';
import ExportNode from '@/components/formarketing/ExportNode';
import { CommandPalette } from '@/components/formarketing/CommandPalette';
import { PropertyInspector } from '@/components/formarketing/PropertyInspector';
import { ExportModal } from '@/components/formarketing/ExportModal';
import { StudioToolbar } from '@/components/studio/StudioToolbar';
import { Onboarding } from './formarketing/components/Onboarding';
import { ExecutionLog } from './formarketing/components/ExecutionLog';

// Hooks
import { useCanvasPersistence } from './formarketing/hooks/useCanvasPersistence';
import { useCanvasExecution } from './formarketing/hooks/useCanvasExecution';
import { useCanvasHistory } from '@/hooks/useCanvasHistory';

const FormarketingContent = () => {
  const { user } = useAuth("/auth");
  const [searchParams] = useSearchParams();
  const spaceId = searchParams.get('spaceId') || searchParams.get('space');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition, getNodes, getEdges } = useReactFlow();

  // Canvas State
  const [cmdOpen, setCmdOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
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
  const { handleNodesChange, handleEdgesChange, onConnect } = useCanvasPersistence(
    spaceId, user, setNodes, setEdges, onNodesChange, onEdgesChange, edges, record
  );

  const { executeNode } = useCanvasExecution(spaceId, user, setNodes, addLog);

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
    const newNode: Node = {
      id: crypto.randomUUID(),
      type,
      position,
      data: { title: label || 'Nuevo', status: 'idle', prompt: '' },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [screenToFlowPosition, setNodes]);

  const nodeTypes = useMemo(() => ({
    characterBreakdown: (props: NodeProps) => <CharacterBreakdownNode {...props} onExecute={() => executeNode(props.id)} />,
    modelView: (props: NodeProps) => <ModelNode {...props} onExecute={() => executeNode(props.id)} />,
    videoModel: (props: NodeProps) => <VideoModelNode {...props} onExecute={() => executeNode(props.id)} />,
    layoutBuilder: (props: NodeProps) => <LayoutBuilderNode {...props} onExecute={() => executeNode(props.id)} />,
    campaignManager: (props: NodeProps) => <CampaignManagerNode {...props} onExecute={() => executeNode(props.id)} />,
    antigravityBridge: AntigravityBridgeNode,
    captionNode: (props: NodeProps) => <CaptionNode {...props} onExecute={() => executeNode(props.id)} />,
    promptBuilder: (props: NodeProps) => <PromptBuilderNode {...props} onExecute={() => executeNode(props.id)} />,
    llmNode: (props: NodeProps) => <LLMNode {...props} onExecute={() => executeNode(props.id)} />,
    textInput: (props: NodeProps) => <TextInputNode {...props} onExecute={() => executeNode(props.id)} />,
    exportNode: ExportNode,
  }), [executeNode]);

  return (
    <div className="h-full w-full bg-[#f8f9fa] flex flex-col relative overflow-hidden font-sans">
      <Helmet><title>Canvas IA — ForMarketing | Creator IA Pro</title></Helmet>

      {/* Modern Header — Glassmorphism & Iridescent */}
      <header className="h-[64px] border-b border-black/[0.04] bg-white/40 backdrop-blur-2xl px-6 flex items-center justify-between z-30 sticky top-0 aether-iridescent">
        <div className="flex items-center gap-4">
           <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shadow-xl shadow-zinc-900/10">
             <Layers className="h-5 w-5" />
           </div>
           <div>
             <h1 className="text-sm font-black text-zinc-900 tracking-tight uppercase leading-none mb-1">ForMarketing Canvas</h1>
             <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Workspace ID: {spaceId || 'Draft'}</p>
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
             onToggleSnap={() => {}} 
             snapEnabled={false}
             onLayout={() => {}}
             onClear={() => { setNodes([]); setEdges([]); }}
             onExecute={() => {}}
             execStatus="idle"
             onOpenTemplates={() => {}}
             onBack={() => window.history.back()}
           />
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <FormarketingSidebar onAddNode={(type, label) => {
          const position = { x: 500, y: 300 };
          setNodes(nds => nds.concat({ id: crypto.randomUUID(), type, position, data: { title: label, status: 'idle' } }));
        }} />
        
        <div className="flex-1 relative flex flex-col h-full bg-white/50">
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onSelectionChange={({ nodes }) => setSelectedNodeId(nodes[0]?.id || null)}
            fitView selectionMode={SelectionMode.Partial}
            snapToGrid={false}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#e5e7eb" />
            <Controls className="!bg-white !border-zinc-200 !rounded-2xl !shadow-xl !m-6" />
          </ReactFlow>

          <ExecutionLog logs={execLog} isOpen={logOpen} onClose={() => setLogOpen(false)} />
        </div>

        {selectedNodeId && (
          <PropertyInspector 
            node={nodes.find(n => n.id === selectedNodeId)} 
            onClose={() => setSelectedNodeId(null)}
            onUpdate={(id, data) => setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n))}
            onExecute={() => executeNode(selectedNodeId)}
            onDelete={() => {
              setNodes(nds => nds.filter(n => n.id !== selectedNodeId));
              setSelectedNodeId(null);
            }}
          />
        )}
      </main>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onSelect={(type, label) => {
        const position = { x: 500, y: 300 };
        setNodes(nds => nds.concat({ id: crypto.randomUUID(), type, position, data: { title: label, status: 'idle' } }));
        setCmdOpen(false);
      }} />

      {exportOpen && <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} nodes={nodes} edges={edges} />}
      
      {showOnboarding && <Onboarding step={onboardingStep} setStep={setOnboardingStep} onDismiss={() => { localStorage.setItem('fm_onboarded', '1'); setShowOnboarding(false); }} />}
    </div>
  );
};

export default function Formarketing() {
  return (
    <ReactFlowProvider>
      <FormarketingContent />
    </ReactFlowProvider>
  );
}
