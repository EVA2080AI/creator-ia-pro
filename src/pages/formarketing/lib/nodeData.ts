// Qué produce cada nodo y qué le llega a un nodo por sus cables.
// Fase 1 del plan: antes la ejecución solo leía output/description/caption y
// el texto del nodo Texto (data.value) o el prompt compilado del Prompt
// Builder jamás llegaban a nadie — conectar era decorativo.

export interface NodeLike {
  id: string;
  type?: string;
  data: Record<string, unknown>;
}

export interface EdgeRef {
  source: string;
  target: string;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

/** El texto que un nodo aporta a quien lo consuma aguas abajo. */
export function textOutputOf(node: NodeLike): string {
  const d = node.data ?? {};
  switch (node.type) {
    case 'textInput':
      return str(d.value);
    case 'promptBuilder':
      return str(d.compiledPrompt) || str(d.template);
    case 'characterBreakdown':
      return str(d.description);
    case 'llmNode':
      return str(d.output) || str(d.prompt) || str(d.systemPrompt);
    case 'captionNode':
      return str(d.output) || str(d.caption);
    case 'layoutBuilder':
      return str(d.structure);
    default:
      return str(d.output);
  }
}

/** La imagen que un nodo aporta (hoy solo Imagen IA). */
export function imageOutputOf(node: NodeLike): string {
  return node.type === 'modelView' ? str(node.data?.assetUrl) : '';
}

/** Textos de los nodos conectados a la entrada de `targetId`, sin duplicar
 *  fuentes (dos cables del mismo nodo no repiten su texto) y sin vacíos. */
export function upstreamTexts(targetId: string, nodesById: Map<string, NodeLike>, edges: EdgeRef[]): string[] {
  const vistos = new Set<string>();
  const textos: string[] = [];
  for (const e of edges) {
    if (e.target !== targetId || vistos.has(e.source)) continue;
    vistos.add(e.source);
    const src = nodesById.get(e.source);
    if (!src) continue;
    const t = textOutputOf(src);
    if (t) textos.push(t);
  }
  return textos;
}
