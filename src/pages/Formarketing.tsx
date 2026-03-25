import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Background, Controls, MiniMap, ReactFlow, addEdge, Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import CharacterBreakdownNode from '@/components/formarketing/CharacterBreakdownNode';
import ModelNode from '@/components/formarketing/ModelNode';
import VideoModelNode from '@/components/formarketing/VideoModelNode';
import { ArrowLeft, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';

const nodeTypes = {
  characterBreakdown: CharacterBreakdownNode,
  modelView: ModelNode,
  videoModel: VideoModelNode,
};

const initialNodes: Node[] = [
  {
    id: 'char-1',
    type: 'characterBreakdown',
    position: { x: 50, y: 100 },
    data: { 
       title: 'The Slow Starter', 
       flavor: 'Morning Brew Blend',
       description: 'Starting point: Morning routine. Trying to wake up but loving the slow pace of the morning.'
    },
  },
  {
    id: 'img-1',
    type: 'modelView',
    position: { x: 450, y: 50 },
    data: { 
       title: 'Escena 1: Cocina', 
       prompt: 'Cinematic shot of a cozy kitchen at sunrise, soft warm morning light.',
       imageUrl: ''
    },
  },
  {
    id: 'vid-1',
    type: 'videoModel',
    position: { x: 850, y: 100 },
    data: { 
       title: 'Secuencia de Desayuno', 
       status: 'pending',
       duration: '00:15'
    },
  }
];

const initialEdges: Edge[] = [
   { id: 'e1-2', source: 'char-1', target: 'img-1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
   { id: 'e2-3', source: 'img-1', target: 'vid-1', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } }
];

export default function Formarketing() {
  const { user, signOut } = useAuth("/auth");
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), []);

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <AppHeader userId={user?.id} onSignOut={signOut} />
      
      <div className="flex h-16 w-full items-center justify-between border-b border-white/5 bg-card/40 px-6 backdrop-blur-md">
         <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="hover:bg-white/5">
               <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
               <h1 className="text-lg font-black tracking-tight">Formarketing Studio</h1>
               <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Flujos V4.2</span>
            </div>
         </div>
         <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-2 font-bold px-6 shadow-xl shadow-primary/20">
            <Rocket className="h-4 w-4" />
            Ejecutar Flujo
         </Button>
      </div>

      <div className="relative h-full w-full flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background/50"
          defaultEdgeOptions={{ type: 'smoothstep' }}
        >
          <Background color="#ffffff" gap={20} size={1} className="opacity-5" />
          <Controls className="bg-card border-white/10 fill-white [&>button]:border-white/10" />
          <MiniMap 
            className="bg-card/90 border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl" 
            maskColor="rgba(0,0,0,0.5)" 
            nodeColor={(n) => {
               if (n.type === 'characterBreakdown') return '#8b5cf6';
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
