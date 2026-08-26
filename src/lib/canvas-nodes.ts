// Cliente de /api/canvas-nodes — reemplaza supabase.from("canvas_nodes") en
// todo Canvas IA (src/pages/formarketing/**, src/components/formarketing/**).
export interface CanvasNode {
  id: string;
  userId: string;
  spaceId: string | null;
  type: string;
  name: string | null;
  prompt: string;
  assetUrl: string | null;
  posX: number;
  posY: number;
  width: number;
  height: number;
  status: string;
  errorMessage: string | null;
  dataPayload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

async function api<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; error?: string; data?: T }> {
  try {
    const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...init });
    const json = await res.json();
    if (!res.ok || !json.ok) return { ok: false, error: json.error || `Error ${res.status}` };
    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de red" };
  }
}

export async function listCanvasNodes(spaceId: string): Promise<CanvasNode[]> {
  const res = await api<{ nodes: CanvasNode[] }>(`/api/canvas-nodes?spaceId=${encodeURIComponent(spaceId)}`);
  return res.ok ? res.data!.nodes : [];
}

export interface CreateCanvasNodeInput {
  id?: string;
  spaceId?: string | null;
  type: string;
  name?: string;
  prompt?: string;
  assetUrl?: string;
  posX?: number;
  posY?: number;
  width?: number;
  height?: number;
  status?: string;
  dataPayload?: unknown;
}

export async function createCanvasNode(input: CreateCanvasNodeInput): Promise<CanvasNode | null> {
  const res = await api<{ node: CanvasNode }>("/api/canvas-nodes", { method: "POST", body: JSON.stringify(input) });
  return res.ok ? res.data!.node : null;
}

export interface UpdateCanvasNodeInput {
  name?: string;
  prompt?: string;
  assetUrl?: string | null;
  posX?: number;
  posY?: number;
  width?: number;
  height?: number;
  status?: string;
  errorMessage?: string | null;
  dataPayload?: unknown;
}

export async function updateCanvasNode(id: string, patch: UpdateCanvasNodeInput): Promise<CanvasNode | null> {
  const res = await api<{ node: CanvasNode }>(`/api/canvas-nodes/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  return res.ok ? res.data!.node : null;
}

export async function deleteCanvasNode(id: string): Promise<boolean> {
  const res = await api(`/api/canvas-nodes/${id}`, { method: "DELETE" });
  return res.ok;
}

/** Guarda los edges del grafo — fila especial `flow_metadata`, upsert por espacio. */
export async function upsertCanvasEdges(spaceId: string, edges: unknown[]): Promise<boolean> {
  const res = await api("/api/canvas-nodes/metadata", { method: "POST", body: JSON.stringify({ spaceId, edges }) });
  return res.ok;
}
