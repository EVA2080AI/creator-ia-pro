import { supabase } from "@/integrations/supabase/client";
import { aiService } from "@/services/ai-service";
import { toast } from "sonner";
import { Node, useReactFlow } from "@xyflow/react";

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
  _setNodes: (nodes: Node<CanvasNodeData>[]) => void, // Kept for signature compatibility if needed
  addLog: (node: string, msg: string, type?: 'info' | 'success' | 'error') => void
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

  const executeNode = async (nodeId: string) => {
    const isPersisted = await ensureNodePersisted(nodeId);
    const currentNodes = getNodes();
    const node = currentNodes.find((n) => n.id === nodeId);
    if (!node) return;

    const nodeName = node.data.title || node.type || 'Unknown Node';
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
      addLog(nodeName, 'Error: ' + e.message, 'error');
      toast.error(e.message);
    }
  };

  return { executeNode };
}
