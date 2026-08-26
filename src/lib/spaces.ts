// Cliente de /api/spaces — reemplaza supabase.from("spaces") en Dashboard/Spaces.
export interface Space {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  settings: Record<string, unknown>;
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

export async function listSpaces(): Promise<Space[]> {
  const res = await api<{ spaces: Space[] }>("/api/spaces");
  return res.ok ? res.data!.spaces : [];
}

export async function getSpace(id: string): Promise<Space | null> {
  const res = await api<{ space: Space }>(`/api/spaces/${id}`);
  return res.ok ? res.data!.space : null;
}

export async function createSpace(input: { name: string; description?: string; settings?: Record<string, unknown> }): Promise<Space | null> {
  const res = await api<{ space: Space }>("/api/spaces", { method: "POST", body: JSON.stringify(input) });
  return res.ok ? res.data!.space : null;
}

export async function updateSpace(id: string, patch: { name?: string; description?: string | null; settings?: Record<string, unknown> }): Promise<Space | null> {
  const res = await api<{ space: Space }>(`/api/spaces/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  return res.ok ? res.data!.space : null;
}

export async function deleteSpace(id: string): Promise<boolean> {
  const res = await api(`/api/spaces/${id}`, { method: "DELETE" });
  return res.ok;
}
