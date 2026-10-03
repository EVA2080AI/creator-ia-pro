import { Globe, Loader2 } from "lucide-react";
import { sourceHost, type SearchSource } from "@/lib/stream-events";

// Lo que pasa mientras no hay texto todavía, y de dónde salió lo que hay.
//
// Antes el único indicio era el shimmer de tres puntos: una respuesta que buscaba en
// internet tres veces (Tavily + un stream completo por ronda, decenas de segundos) se
// veía idéntica a una respuesta lenta, y los 3 créditos se cobraban sin decirlo.

/** La línea de "buscando…" en lugar del shimmer mudo. */
export function Activity({ label }: { label: string }) {
  return (
    <div className="asst-activity" role="status">
      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

/** Las fuentes bajo la respuesta. `credits` = lo que costaron las búsquedas (0 = nada). */
export function Sources({ items, credits }: { items: SearchSource[]; credits?: number }) {
  if (!items.length) return null;
  return (
    <div className="asst-sources">
      <div className="asst-sources-head">
        <Globe className="w-3 h-3" aria-hidden />
        <span>
          {items.length} {items.length === 1 ? "fuente" : "fuentes"} de la web
        </span>
        {!!credits && (
          <span className="asst-sources-cost" title="Cada búsqueda en internet cuesta 1 crédito">
            {credits} {credits === 1 ? "crédito" : "créditos"}
          </span>
        )}
      </div>
      <ol className="asst-sources-list">
        {items.map((s, i) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer noopener">
              <span className="asst-source-n">{i + 1}</span>
              <span className="asst-source-title">{s.title || sourceHost(s.url)}</span>
              <span className="asst-source-host">{sourceHost(s.url)}</span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
