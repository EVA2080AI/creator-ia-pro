// Eventos propios del servidor por el MISMO stream SSE de OpenRouter.
//
// El chat reenvía los chunks de OpenRouter tal cual (api/ai/chat.ts), y el cliente
// solo mira `choices[0].delta.content`. Una línea `data:` sin `choices` se ignora en
// silencio en todos los clientes — así que es el lugar seguro para mandar lo nuestro:
// que empezó una búsqueda, qué fuentes trajo y cuántos créditos costó.
//
// Antes esto no existía y una respuesta con tres rondas de búsqueda se veía igual que
// una respuesta lenta: el shimmer mudo, sin fuentes y con 3 créditos cobrados sin
// avisar.
export interface SearchSource {
  title: string;
  url: string;
}

export type BasaltEvent =
  /** Empezó una búsqueda web. */
  | { type: "search"; query: string }
  /** Terminó: las fuentes que trajo (vacío si falló) y lo que se cobró de verdad. */
  | { type: "sources"; query: string; sources: SearchSource[]; credits: number }
  /** Está leyendo los datos de la cuenta del usuario (proyectos, assets, plan). */
  | { type: "account"; tool: string };

/** Línea SSE lista para `res.write`. */
export function basaltEventLine(event: BasaltEvent): string {
  return `data: ${JSON.stringify({ basalt: event })}\n\n`;
}

/** Solo http(s): la fuente se pinta como enlace, y un `javascript:` ahí sería un
 *  agujero aunque hoy las URLs vengan de Tavily y no del usuario. */
function isWebUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Devuelve el evento si este JSON del stream es uno nuestro, o null si es de OpenRouter. */
export function readBasaltEvent(json: unknown): BasaltEvent | null {
  const e = (json as { basalt?: unknown })?.basalt as BasaltEvent | undefined;
  if (!e || typeof e !== "object" || typeof (e as { type?: unknown }).type !== "string") return null;
  if (e.type === "search") return typeof e.query === "string" ? e : null;
  if (e.type === "sources") {
    return Array.isArray(e.sources) && typeof e.query === "string"
      ? { type: "sources", query: e.query, sources: e.sources.filter((s) => s && isWebUrl(s.url)), credits: Number(e.credits) || 0 }
      : null;
  }
  if (e.type === "account") return typeof e.tool === "string" ? e : null;
  return null;
}

const ACCOUNT_LABEL: Record<string, string> = {
  get_my_projects: "Revisando tus proyectos…",
  get_my_assets: "Revisando tus archivos guardados…",
  get_my_usage: "Revisando tu plan y tus créditos…",
};

/** Qué se le muestra al usuario mientras pasa. "" = nada que mostrar. */
export function activityLabel(event: BasaltEvent): string {
  if (event.type === "search") return `Buscando en la web: ${event.query}`;
  if (event.type === "account") return ACCOUNT_LABEL[event.tool] ?? "Revisando los datos de tu cuenta…";
  return "";
}

/** El dominio, que es lo que de verdad le dice al usuario de dónde salió el dato. */
export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Une fuentes nuevas sin repetir URL — una respuesta puede buscar varias veces. */
export function mergeSources(previous: SearchSource[] | undefined, incoming: SearchSource[]): SearchSource[] {
  const out = [...(previous ?? [])];
  for (const s of incoming) {
    if (isWebUrl(s.url) && !out.some((p) => p.url === s.url)) out.push({ title: s.title || sourceHost(s.url), url: s.url });
  }
  return out;
}
