import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { aiService, classifyError } from "@/services/ai-service";
import { toast } from "sonner";
import { Node, Edge, useReactFlow } from "@xyflow/react";

export function useCanvasExecution(
  spaceId: string | null,
  user: any,
  setNodes: any,
  addLog: (node: string, msg: string, type?: 'info' | 'success' | 'error') => void
) {
  const { getNodes, getEdges, setNodes: rfSetNodes } = useReactFlow();

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
        type: nodeToPersist.type,
        prompt: (nodeToPersist.data as any).prompt || (nodeToPersist.data as any).title || 'auto-persisted',
        status: (nodeToPersist.data as any).status || 'idle',
        data_payload: nodeToPersist.data as any,
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

    const nodeName = (node.data as any).title || node.type;
    rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'executing' }, style: { boxShadow: '0 0 0 2px rgba(245,158,11,0.5)', borderRadius: '24px' } } : n));
    addLog(nodeName!, 'Iniciando ejecución…', 'info');

    try {
      let resultText = '';
      let assetUrl = '';

      if (node.type === 'characterBreakdown') {
        const res = await aiService.processAction({
          action: 'chat',
          prompt: `Analiza este perfil: ${node.data.title}. Contexto: ${node.data.flavor}. Estilo: ${node.data.description}`,
          model: (node.data as any).model || 'deepseek-chat',
          node_id: (spaceId && isPersisted) ? node.id : undefined
        });
        resultText = res.text;
      } else if (node.type === 'llmNode' || node.type === 'captionNode') {
        const latestEdges = getEdges();
        const incomingEdges = latestEdges.filter(e => e.target === node.id);
        const upstreamContext = incomingEdges.map(edge => {
          const src = currentNodes.find(n => n.id === edge.source);
          return (src?.data as any).output || (src?.data as any).description || (src?.data as any).caption || '';
        }).join('\n---\n');

        const prompt = (node.data as any).prompt || (node.type === 'captionNode' ? 'Genera un caption' : 'Analiza');
        const finalPrompt = `Contexto:\n${upstreamContext}\n\nInstrucción: ${prompt}`;
        const res = await aiService.processAction({
          action: 'chat',
          prompt: finalPrompt,
          model: (node.data as any).model || 'deepseek-chat',
          node_id: (spaceId && isPersisted) ? node.id : undefined
        });
        resultText = res.text;
      } else if (node.type === 'modelView' || node.type === 'videoModel') {
        const action = node.type === 'modelView' ? 'image' : 'video';
        const res = await aiService.processAction({
          action,
          prompt: (node.data as any).prompt || "Premium marketing visual",
          model: (node.data as any).model || (action === 'image' ? 'flux-schnell' : 'video'),
          node_id: (spaceId && isPersisted) ? node.id : undefined
        });
        assetUrl = res.url;
      }

      // Update State & DB
      const updatePayload: any = { status: 'ready' };
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
          data_payload: { ...(node.data as any), ...updatePayload }
        }).eq('id', nodeId);
      }

      addLog(nodeName!, 'Completado ✓', 'success');
    } catch (e: any) {
      rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'error' }, style: { boxShadow: '0 0 0 2px rgba(239,68,68,0.5)', borderRadius: '24px' } } : n));
      addLog(nodeName!, 'Error: ' + e.message, 'error');
      toast.error(e.message);
    }
  };

  return { executeNode };
}
