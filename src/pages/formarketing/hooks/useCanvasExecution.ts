import { supabase } from "@/integrations/supabase/client";
import { aiService } from "@/services/ai-service";
import { toast } from "sonner";
import { Node, useReactFlow, Edge } from "@xyflow/react";

interface CanvasNodeData {
  title?: string;
  flavor?: string;
  description?: string;
  prompt?: string;
  model?: string;
  status?: string;
  output?: string;
  caption?: string;
  assetUrl?: string;
  [key: string]: any;
}

interface UserProfile {
  id: string;
}

export function useCanvasExecution(
  spaceId: string | null,
  user: UserProfile | null,
  _setNodes: (nodes: Node<CanvasNodeData>[]) => void,
  addLog: (node: string, msg: string, type?: 'info' | 'success' | 'error') => void,
  setEdges?: (updater: (edges: any[]) => any[]) => void
) {
  const { getNodes, getEdges, setNodes: rfSetNodes } = useReactFlow<Node<CanvasNodeData>>();

  const ensureNodePersisted = async (nodeId: string) => {
    if (!spaceId || !user) return false;
    const { data: existing } = await supabase
        .from('canvas_nodes')
        .select('id')
        .eq('id', nodeId)
        .maybeSingle();

    if (existing) return true;

    const nodeToPersist = getNodes().find(n => n.id === nodeId);
    if (!nodeToPersist) return false;

    const { error: insertError } = await supabase.from('canvas_nodes').insert({
        id: nodeId,
        space_id: spaceId,
        user_id: user.id,
        type: nodeToPersist.type || 'default',
        prompt: nodeToPersist.data.prompt || nodeToPersist.data.title || 'auto-persisted',
        status: nodeToPersist.data.status || 'idle',
        data_payload: nodeToPersist.data,
        pos_x: nodeToPersist.position.x,
        pos_y: nodeToPersist.position.y
    });
    
    return !insertError;
  };

  const animateEdgesToNode = (targetNodeId: string, isActive: boolean) => {
    if (!setEdges) return;
    const edges = getEdges();
    const incomingEdges = edges.filter(e => e.target === targetNodeId);

    setEdges((eds) => eds.map(edge => {
      if (edge.target === targetNodeId) {
        return {
          ...edge,
          data: {
            ...edge.data,
            isActive,
            isExecuting: isActive,
          },
        };
      }
      return edge;
    }));
  };

  const executeNode = async (nodeId: string) => {
    const isPersisted = await ensureNodePersisted(nodeId);
    const currentNodes = getNodes();
    const node = currentNodes.find((n) => n.id === nodeId);
    if (!node) return;

    const nodeName = node.data.title || node.type || 'Unknown Node';

    // Animate incoming edges
    animateEdgesToNode(nodeId, true);

    rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'executing' }, style: { boxShadow: '0 0 0 2px rgba(245,158,11,0.5)', borderRadius: '24px' } } : n));
    addLog(nodeName, 'Iniciando ejecución…', 'info');

    try {
      let resultText = '';
      let assetUrl = '';

      if (node.type === 'characterBreakdown') {
        const res = await aiService.processAction({
          action: 'chat',
          prompt: `Analiza este perfil: ${node.data.title}. Contexto: ${node.data.flavor}. Estilo: ${node.data.description}`,
          model: node.data.model || 'deepseek-chat',
          node_id: (spaceId && isPersisted) ? node.id : undefined
        });
        resultText = res.text || '';
      } else if (node.type === 'llmNode' || node.type === 'captionNode') {
        const latestEdges = getEdges();
        const incomingEdges = latestEdges.filter(e => e.target === node.id);
        const upstreamContext = incomingEdges.map(edge => {
          const src = currentNodes.find(n => n.id === edge.source);
          if (!src) return '';
          return src.data.output || src.data.description || src.data.caption || '';
        }).join('\n---\n');

        const prompt = node.data.prompt || (node.type === 'captionNode' ? 'Genera un caption' : 'Analiza');
        const finalPrompt = `Contexto:\n${upstreamContext}\n\nInstrucción: ${prompt}`;
        const res = await aiService.processAction({
          action: 'chat',
          prompt: finalPrompt,
          model: node.data.model || 'deepseek-chat',
          node_id: (spaceId && isPersisted) ? node.id : undefined
        });
        resultText = res.text || '';
      } else if (node.type === 'modelView' || node.type === 'videoModel') {
        const action = node.type === 'modelView' ? 'image' : 'video';
        const res = await aiService.processAction({
          action,
          prompt: node.data.prompt || "Premium marketing visual",
          model: node.data.model || (action === 'image' ? 'flux-schnell' : 'video'),
          node_id: (spaceId && isPersisted) ? node.id : undefined
        });
        assetUrl = res.url || '';
      }

      const updatePayload: Partial<CanvasNodeData> = { status: 'ready' };
      if (resultText) {
        if (node.type === 'llmNode') updatePayload.output = resultText;
        else if (node.type === 'captionNode') updatePayload.caption = resultText;
        else updatePayload.description = resultText;
      }
      if (assetUrl) updatePayload.assetUrl = assetUrl;

      rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...updatePayload }, style: { boxShadow: '0 0 0 2px rgba(52,211,153,0.4)', borderRadius: '24px' } } : n));

      // Stop edge animation
      animateEdgesToNode(nodeId, false);

      if (spaceId) {
        await supabase.from('canvas_nodes').update({
          status: 'ready',
          asset_url: assetUrl || undefined,
          data_payload: { ...node.data, ...updatePayload }
        } as any).eq('id', nodeId);
      }

      addLog(nodeName, 'Completado ✓', 'success');
    } catch (e: any) {
      rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'error' }, style: { boxShadow: '0 0 0 2px rgba(239,68,68,0.5)', borderRadius: '24px' } } : n));
      // Stop edge animation on error
      animateEdgesToNode(nodeId, false);
      addLog(nodeName, 'Error: ' + e.message, 'error');
      toast.error(e.message);
    }
  };

  // Execute all upstream nodes leading to target node (in topological order)
  const executeUpstream = async (targetNodeId: string) => {
    const currentNodes = getNodes();
    const currentEdges = getEdges();

    // Build adjacency list (reverse direction - who connects TO each node)
    const incomingEdges: Record<string, string[]> = {};
    currentEdges.forEach(edge => {
      if (!incomingEdges[edge.target]) incomingEdges[edge.target] = [];
      incomingEdges[edge.target].push(edge.source);
    });

    // Collect all upstream nodes using BFS backwards
    const upstream = new Set<string>();
    const queue = [targetNodeId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      if (current !== targetNodeId) upstream.add(current);

      const sources = incomingEdges[current] || [];
      sources.forEach(src => {
        if (!visited.has(src)) queue.push(src);
      });
    }

    // Topological sort: order nodes by dependency depth
    const depth: Record<string, number> = {};
    const calcDepth = (nodeId: string): number => {
      if (depth[nodeId] !== undefined) return depth[nodeId];
      const sources = incomingEdges[nodeId] || [];
      if (sources.length === 0) {
        depth[nodeId] = 0;
        return 0;
      }
      depth[nodeId] = Math.max(...sources.map(calcDepth)) + 1;
      return depth[nodeId];
    };

    // Calculate depth for all upstream nodes
    upstream.forEach(nodeId => calcDepth(nodeId));

    // Sort upstream nodes by depth (ascending = execute dependencies first)
    const sortedUpstream = Array.from(upstream).sort((a, b) => depth[a] - depth[b]);

    if (sortedUpstream.length === 0) {
      // No upstream nodes, just execute the target
      await executeNode(targetNodeId);
      return;
    }

    addLog('Sistema', `Ejecutando ${sortedUpstream.length} nodo(s) upstream + objetivo...`, 'info');

    // Execute upstream nodes sequentially
    for (const nodeId of sortedUpstream) {
      await executeNode(nodeId);
      // Small delay between executions for visual feedback
      await new Promise(r => setTimeout(r, 300));
    }

    // Finally execute the target node
    await executeNode(targetNodeId);

    addLog('Sistema', 'Flujo completado ✓', 'success');
  };

  return { executeNode, executeUpstream };
}
