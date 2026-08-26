// Cliente de /api/assets — reemplaza supabase.from("saved_assets") en LibraryView/Dashboard.
// Mapea la forma camelCase de Drizzle a la forma snake_case que ya consumen los
// componentes existentes, para no tocar su JSX.
export interface SavedAsset {
  id: string;
  asset_url: string;
  prompt: string | null;
  type: string;
  is_favorite: boolean;
  tags: string[];
  created_at: string;
  space_id: string | null;
  content: string | null;
}

interface ApiAsset {
  id: string;
  userId: string;
  spaceId: string | null;
  nodeId: string | null;
  assetUrl: string;
  prompt: string | null;
  type: string;
  isFavorite: boolean;
  tags: string[];
  content: string | null;
  createdAt: string;
}

function fromApi(a: ApiAsset): SavedAsset {
  return {
    id: a.id,
    asset_url: a.assetUrl,
    prompt: a.prompt,
    type: a.type,
    is_favorite: a.isFavorite,
    tags: a.tags || [],
    created_at: a.createdAt,
    space_id: a.spaceId,
    content: a.content,
  };
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

export async function listAssets(opts?: { spaceId?: string; favoriteOnly?: boolean; limit?: number; offset?: number }): Promise<{ assets: SavedAsset[]; total: number }> {
  const params = new URLSearchParams();
  if (opts?.spaceId) params.set("spaceId", opts.spaceId);
  if (opts?.favoriteOnly) params.set("favoriteOnly", "true");
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.offset) params.set("offset", String(opts.offset));
  const res = await api<{ assets: ApiAsset[]; total: number }>(`/api/assets?${params.toString()}`);
  return res.ok ? { assets: res.data!.assets.map(fromApi), total: res.data!.total } : { assets: [], total: 0 };
}

export async function createAsset(input: { assetUrl: string; prompt?: string; type?: string; spaceId?: string | null; tags?: string[]; content?: string }): Promise<SavedAsset | null> {
  const res = await api<{ asset: ApiAsset }>("/api/assets", { method: "POST", body: JSON.stringify(input) });
  return res.ok ? fromApi(res.data!.asset) : null;
}

export async function updateAsset(id: string, patch: { isFavorite?: boolean; content?: string; tags?: string[]; spaceId?: string | null }): Promise<SavedAsset | null> {
  const res = await api<{ asset: ApiAsset }>(`/api/assets/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  return res.ok ? fromApi(res.data!.asset) : null;
}

export async function deleteAsset(id: string): Promise<boolean> {
  const res = await api(`/api/assets/${id}`, { method: "DELETE" });
  return res.ok;
}
