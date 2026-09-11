// Búsqueda web real para el tool-calling del chat — ver api/ai/chat.ts.
// Reemplaza la sección "HERRAMIENTAS ACTIVAS" que existía en el system
// prompt de conversación (retirada 2026-09-10 por prometer una búsqueda que
// ningún código interceptaba). Esta vez la interceptación existe primero.
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

const TAVILY_URL = "https://api.tavily.com/search";

/** Lanza en caso de error — el llamador decide créditos/reembolso, igual que generateOpenRouterImage. */
export async function tavilySearch(query: string, apiKey: string): Promise<SearchResult[]> {
  const res = await fetch(TAVILY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: 5,
      search_depth: "basic",
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Tavily ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json().catch(() => null)) as { results?: { title?: string; url?: string; content?: string }[] } | null;
  const results = data?.results ?? [];
  return results.map((r) => ({
    title: r.title || "",
    url: r.url || "",
    snippet: (r.content || "").slice(0, 500),
  }));
}

/** Definición de la tool en formato OpenAI/OpenRouter — pasada en `tools` a la request de chat. */
export const WEB_SEARCH_TOOL = {
  type: "function",
  function: {
    name: "web_search",
    description:
      "Busca información actual en internet — documentación de librerías, versiones, APIs que pueden haber cambiado después de tu entrenamiento. No la uses para saludos ni cosas que ya sabés con certeza.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Consulta de búsqueda, en el idioma que sea más probable encontrar buenos resultados (usualmente inglés para documentación técnica)." },
      },
      required: ["query"],
    },
  },
} as const;
