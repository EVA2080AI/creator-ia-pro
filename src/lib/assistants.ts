// Cliente de /api/assistants — ver db/schema/assistants.ts.
export interface AssistantBrand {
  gradient?: string;
  accent?: string;
  accentSoft?: string;
  panel?: string;
  theme?: "light" | "dark" | "system";
}

export interface AssistantWelcomeCard {
  label: string;
  prompt: string;
  icon?: string;
}

export interface AssistantWelcome {
  title?: string;
  subtitle?: string;
  cards?: AssistantWelcomeCard[];
}

export interface AssistantPersona {
  role?: string;
  systemPrompt?: string;
  language?: string;
}

export interface AssistantCapabilities {
  code?: boolean;
  image?: boolean;
  text?: boolean;
  charts?: boolean;
  vision?: boolean;
  web?: boolean;
}

export interface Assistant {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  avatarUrl: string | null;
  brand: AssistantBrand;
  welcome: AssistantWelcome;
  persona: AssistantPersona;
  capabilities: AssistantCapabilities;
  defaultModel: string;
  visibility: "system" | "organization" | "private";
  minTier: string;
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

export async function listAssistants(): Promise<Assistant[]> {
  const res = await api<{ assistants: Assistant[] }>("/api/assistants");
  return res.ok ? res.data!.assistants : [];
}

export async function getAssistant(slug: string): Promise<Assistant | null> {
  const res = await api<{ assistant: Assistant }>(`/api/assistants/${slug}`);
  return res.ok ? res.data!.assistant : null;
}

export async function createAssistant(input: Partial<Assistant> & { name: string }): Promise<Assistant | null> {
  const res = await api<{ assistant: Assistant }>("/api/assistants", { method: "POST", body: JSON.stringify(input) });
  return res.ok ? res.data!.assistant : null;
}

export async function updateAssistant(slug: string, patch: Partial<Assistant>): Promise<Assistant | null> {
  const res = await api<{ assistant: Assistant }>(`/api/assistants/${slug}`, { method: "PATCH", body: JSON.stringify(patch) });
  return res.ok ? res.data!.assistant : null;
}

export async function deleteAssistant(slug: string): Promise<boolean> {
  const res = await api(`/api/assistants/${slug}`, { method: "DELETE" });
  return res.ok;
}

/** Variables CSS derivadas de la marca del asistente — se inyectan como `style` en el contenedor raíz. */
export function brandCssVars(brand: AssistantBrand): Record<string, string> {
  return {
    "--a-grad": brand.gradient || "linear-gradient(74deg,#A855F7 0%,#6366F1 100%)",
    "--a-accent": brand.accent || "#A855F7",
    "--a-accent-soft": brand.accentSoft || "#F3E8FF",
    "--a-panel": brand.panel || "#F5F5F7",
  };
}
