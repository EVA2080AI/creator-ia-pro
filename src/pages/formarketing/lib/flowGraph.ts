// Orden de ejecución del canvas. Antes el orden se calculaba con una recursión
// sin guarda (calcDepth): un ciclo A→B→A recursaba infinito y colgaba la
// pestaña. Este DFS iterativo con coloreo detecta el ciclo y lo reporta en vez
// de morir, y además acepta varios objetivos a la vez deduplicando los
// ancestros compartidos (el botón EJECUTAR global corre cada nodo UNA vez
// aunque alimente a dos terminales — cada ejecución cobra créditos).

export interface EdgeLike {
  source: string;
  target: string;
}

export interface ExecutionOrder {
  /** Ids en orden de dependencias (primero las fuentes), objetivos incluidos. */
  order: string[];
  hasCycle: boolean;
}

export function upstreamExecutionOrder(targetIds: string[], edges: EdgeLike[]): ExecutionOrder {
  const incoming = new Map<string, string[]>();
  for (const e of edges) {
    const list = incoming.get(e.target);
    if (list) list.push(e.source);
    else incoming.set(e.target, [e.source]);
  }

  const order: string[] = [];
  // 1 = en la pila actual (gris), 2 = terminado (negro)
  const state = new Map<string, 1 | 2>();

  for (const root of targetIds) {
    if (state.get(root) === 2) continue;
    const stack: Array<{ id: string; next: number }> = [{ id: root, next: 0 }];
    state.set(root, 1);

    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      const deps = incoming.get(top.id) ?? [];
      if (top.next < deps.length) {
        const dep = deps[top.next++];
        const s = state.get(dep);
        if (s === 1) return { order: [], hasCycle: true };
        if (s !== 2) {
          state.set(dep, 1);
          stack.push({ id: dep, next: 0 });
        }
      } else {
        state.set(top.id, 2);
        order.push(top.id);
        stack.pop();
      }
    }
  }

  return { order, hasCycle: false };
}
