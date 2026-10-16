import { useCallback, useMemo, useRef } from "react";
import { createAsset } from "@/lib/assets";
import { createCanvasNode, updateCanvasNode } from "@/lib/canvas-nodes";
import { EXECUTABLE_NODE_TYPES } from "@/components/formarketing/nodeConnections";
import { aiService } from "@/services/ai-service";
import { toast } from "sonner";
import { Node, useReactFlow } from "@xyflow/react";
import { upstreamExecutionOrder } from "../lib/flowGraph";
import { upstreamTexts } from "../lib/nodeData";

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

// Todas las funciones devueltas están memoizadas con dependencias estables:
// este hook alimenta un React Context y antes sus funciones se recreaban en
// cada render (ver CanvasExecContext.ts para el bucle que causaba).
export function useCanvasExecution(
  spaceId: string | null,
  user: UserProfile | null,
  _setNodes: (nodes: Node<CanvasNodeData>[]) => void,
  addLog: (node: string, msg: string, type?: 'info' | 'success' | 'error') => void,
  setEdges?: (updater: (edges: any[]) => any[]) => void
) {
  const { getNodes, getEdges, setNodes: rfSetNodes } = useReactFlow<Node<CanvasNodeData>>();

  // Locks de ejecución: cada ejecución cobra créditos, así que ni el mismo
  // nodo puede correr dos veces a la vez (Play durante un flujo) ni dos
  // flujos pueden solaparse (dos "Ejecutar desde aquí" re-cobrando ancestros).
  const flowBusyRef = useRef(false);
  const nodeBusyRef = useRef<Set<string>>(new Set());

  const ensureNodePersisted = useCallback(async (nodeId: string) => {
    if (!spaceId || !user) return false;
    const nodeToPersist = getNodes().find(n => n.id === nodeId);
    if (!nodeToPersist) return false;

    // Idempotente por id (onConflictDoNothing en el servidor) — funciona igual si
    // el nodo ya existía o si se acaba de crear.
    const persisted = await createCanvasNode({
      id: nodeId,
      spaceId,
      type: nodeToPersist.type || 'default',
      prompt: nodeToPersist.data.prompt || nodeToPersist.data.title || 'auto-persisted',
      status: nodeToPersist.data.status || 'idle',
      dataPayload: nodeToPersist.data,
      posX: nodeToPersist.position.x,
      posY: nodeToPersist.position.y,
    });

    return !!persisted;
  }, [spaceId, user, getNodes]);

  const animateEdgesToNode = useCallback((targetNodeId: string, isActive: boolean) => {
    if (!setEdges) return;
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
  }, [setEdges]);

  const executeNodeInner = useCallback(async (nodeId: string) => {
    if (nodeBusyRef.current.has(nodeId)) return;
    const node = getNodes().find((n) => n.id === nodeId);
    if (!node) return;

    const nodeName = node.data.title || node.type || 'Unknown Node';

    // Un nodo apagado no ejecuta ni cobra (antes el bypass era solo cosmético).
    if (node.data.status === 'bypassed') {
      addLog(nodeName, 'Apagado (bypass): no se ejecuta ni consume créditos.', 'info');
      return;
    }

    // Los tipos sin lógica de ejecución (Texto, Prompt Builder, Exportar…) ya no
    // se marcan "listos" en verde sin haber hecho nada.
    if (!EXECUTABLE_NODE_TYPES.has(node.type || '')) {
      addLog(nodeName, 'Este nodo no ejecuta por sí mismo: aporta datos o recibe resultados.', 'info');
      return;
    }

    nodeBusyRef.current.add(nodeId);
    try {
    const isPersisted = await ensureNodePersisted(nodeId);
    const currentNodes = getNodes();

    // Animate incoming edges
    animateEdgesToNode(nodeId, true);

    rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'executing' }, style: { boxShadow: '0 0 0 2px rgba(245,158,11,0.5)', borderRadius: '24px' } } : n));
    addLog(nodeName, 'Iniciando ejecución…', 'info');

    try {
      let resultText = '';
      let assetUrl = '';

      // Fase 1: lo conectado llega de verdad — el contexto junta lo que cada
      // fuente produce (texto del nodo Texto, prompt compilado, output del
      // LLM, perfil del Personaje…), no solo output/description/caption.
      const nodesById = new Map(currentNodes.map(n => [n.id, n]));
      const textosConectados = upstreamTexts(node.id, nodesById, getEdges());
      const contexto = textosConectados.join('\n---\n');

      if (node.type === 'characterBreakdown') {
        const base = `Analiza este perfil: ${node.data.title}. Contexto: ${node.data.flavor}. Estilo: ${node.data.description}`;
        const res = await aiService.processAction({
          action: 'chat',
          prompt: contexto ? `${base}\n\nMaterial conectado:\n${contexto}` : base,
          model: node.data.model || 'deepseek-chat',
          node_id: (spaceId && isPersisted) ? node.id : undefined
        });
        resultText = res.text || '';
      } else if (node.type === 'llmNode' || node.type === 'captionNode') {
        // Las plantillas viejas guardaban el instructivo en systemPrompt.
        const prompt = node.data.prompt || node.data.systemPrompt || (node.type === 'captionNode' ? 'Genera un caption' : 'Analiza');
        const finalPrompt = contexto ? `Contexto:\n${contexto}\n\nInstrucción: ${prompt}` : prompt;
        const res = await aiService.processAction({
          action: 'chat',
          prompt: finalPrompt,
          model: node.data.model || 'deepseek-chat',
          node_id: (spaceId && isPersisted) ? node.id : undefined
        });
        resultText = res.text || '';
      } else if (node.type === 'modelView') {
        // El prompt de la imagen = lo conectado + lo propio. Sin ninguno de
        // los dos NO se genera (antes cobraba 3 cr por un visual genérico
        // con el fallback "Premium marketing visual").
        const propio = typeof node.data.prompt === 'string' ? node.data.prompt.trim() : '';
        const partes = [...textosConectados, propio].filter(Boolean);
        if (partes.length === 0) {
          throw new Error('El nodo Imagen no tiene prompt ni nada conectado que lo alimente. Escribe qué generar o conéctale un texto.');
        }
        const res = await aiService.processAction({
          action: 'image',
          prompt: partes.join('\n'),
          model: node.data.model || 'flux-schnell',
          node_id: (spaceId && isPersisted) ? node.id : undefined
        });
        assetUrl = res.url || '';

        // La imagen queda también en la Biblioteca (Mis Activos) — antes el
        // canvas nunca la alimentaba y el resultado vivía solo en el nodo.
        if (assetUrl) {
          void createAsset({
            assetUrl,
            type: 'image',
            prompt: partes.join('\n'),
            spaceId: spaceId || undefined,
            tags: ['canvas'],
          });
        }
      }

      const updatePayload: Partial<CanvasNodeData> = { status: 'ready' };
      if (resultText) {
        // CaptionNode muestra data.output: escribir solo en data.caption dejaba
        // el resultado del flujo invisible (nodo verde, texto en ninguna parte).
        if (node.type === 'llmNode' || node.type === 'captionNode') updatePayload.output = resultText;
        else updatePayload.description = resultText;
      }
      if (assetUrl) updatePayload.assetUrl = assetUrl;

      rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...updatePayload }, style: { boxShadow: '0 0 0 2px rgba(52,211,153,0.4)', borderRadius: '24px' } } : n));

      // Stop edge animation
      animateEdgesToNode(nodeId, false);

      if (spaceId) {
        await updateCanvasNode(nodeId, {
          status: 'ready',
          assetUrl: assetUrl || undefined,
          prompt: node.data.prompt || undefined,
          dataPayload: { ...node.data, ...updatePayload },
        });
      }

      addLog(nodeName, 'Completado ✓', 'success');
    } catch (e: any) {
      rfSetNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'error' }, style: { boxShadow: '0 0 0 2px rgba(239,68,68,0.5)', borderRadius: '24px' } } : n));
      // Stop edge animation on error
      animateEdgesToNode(nodeId, false);
      addLog(nodeName, 'Error: ' + e.message, 'error');
      toast.error(e.message);
    }
    } finally {
      nodeBusyRef.current.delete(nodeId);
    }
  }, [getNodes, getEdges, rfSetNodes, addLog, spaceId, ensureNodePersisted, animateEdgesToNode]);

  // Entrada pública (Play de un nodo, inspector): no corre si hay un flujo en
  // marcha — el flujo igual va a ejecutar ese nodo y sería doble cobro.
  const executeNode = useCallback(async (nodeId: string) => {
    if (flowBusyRef.current) {
      toast.info('Hay una ejecución en curso: espera a que termine.');
      return;
    }
    await executeNodeInner(nodeId);
  }, [executeNodeInner]);

  // Ejecuta las cadenas que terminan en los nodos objetivo: ancestros primero,
  // cada nodo UNA sola vez aunque alimente a varios objetivos (cada ejecución
  // cobra créditos), saltando apagados y tipos sin lógica.
  const executeFlow = useCallback(async (targetIds: string[]) => {
    if (flowBusyRef.current) {
      toast.info('Ya hay un flujo ejecutándose: espera a que termine.');
      return;
    }
    const { order, hasCycle } = upstreamExecutionOrder(targetIds, getEdges());

    if (hasCycle) {
      const msg = 'Hay un ciclo en las conexiones: un nodo termina alimentándose a sí mismo. Borra uno de los cables del ciclo.';
      addLog('Sistema', msg, 'error');
      toast.error(msg);
      return;
    }

    const nodesById = new Map(getNodes().map(n => [n.id, n]));
    const ejecutables = order.filter(id => {
      const n = nodesById.get(id);
      return !!n && EXECUTABLE_NODE_TYPES.has(n.type || '') && n.data.status !== 'bypassed';
    });

    const apagados = order.filter(id => {
      const n = nodesById.get(id);
      return !!n && EXECUTABLE_NODE_TYPES.has(n.type || '') && n.data.status === 'bypassed';
    });
    if (apagados.length > 0) {
      const nombres = apagados.map(id => nodesById.get(id)?.data.title || id).join(', ');
      addLog('Sistema', `Apagados y saltados: ${nombres}. Lo que dependa de ellos usará su última salida guardada (o ninguna).`, 'info');
    }

    if (ejecutables.length === 0) {
      addLog('Sistema', 'Nada que ejecutar: el flujo no tiene nodos de IA encendidos.', 'info');
      toast.info('Nada que ejecutar: agrega un nodo de IA (LLM, Imagen o Caption) o reactiva los apagados.');
      return;
    }

    if (ejecutables.length > 1) {
      addLog('Sistema', `Ejecutando ${ejecutables.length} nodos en orden…`, 'info');
    }

    flowBusyRef.current = true;
    try {
      for (let i = 0; i < ejecutables.length; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, 300));
        await executeNodeInner(ejecutables[i]);
      }
    } finally {
      flowBusyRef.current = false;
    }

    addLog('Sistema', 'Flujo completado ✓', 'success');
  }, [getNodes, getEdges, addLog, executeNodeInner]);

  // Execute all upstream nodes leading to target node (in topological order)
  const executeUpstream = useCallback(async (targetNodeId: string) => {
    await executeFlow([targetNodeId]);
  }, [executeFlow]);

  return useMemo(
    () => ({ executeNode, executeUpstream, executeFlow }),
    [executeNode, executeUpstream, executeFlow],
  );
}
