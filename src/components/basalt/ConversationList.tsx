import { useMemo, useState } from "react";
import { Loader2, MessageSquare, Search, Trash2, X } from "lucide-react";
import { filterConversations, groupConversationsByDate, type StoredConversation } from "@/lib/basalt";

// Historial del menú lateral. Estaba copiado tal cual en Basalt.tsx y en
// Assistant.tsx (los Expertos); acá vive una sola vez y de paso gana lo que le
// faltaba con una lista larga: buscar por título y agrupar por fecha.

/** Debajo de esto, buscar estorba más de lo que ayuda: se ven todas de un vistazo. */
const SEARCH_FROM = 6;

export interface ConversationListProps {
  conversations: StoredConversation[];
  loading: boolean;
  activeId: string;
  onOpen: (c: StoredConversation) => void;
  onDelete: (id: string) => void;
}

export function ConversationList({ conversations, loading, activeId, onOpen, onDelete }: ConversationListProps) {
  const [query, setQuery] = useState("");
  const searching = query.trim().length > 0;

  const results = useMemo(() => filterConversations(conversations, query), [conversations, query]);
  // Buscando se muestra una lista plana: los grupos por fecha sobran cuando lo
  // que importa es el título que coincidió.
  const groups = useMemo(() => (searching ? [{ label: "", items: results }] : groupConversationsByDate(results)), [results, searching]);

  return (
    <>
      <div className="asst-switcher-label">Conversaciones</div>

      {conversations.length >= SEARCH_FROM && (
        <div className="asst-conv-search">
          <Search className="w-3.5 h-3.5" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar conversaciones"
            aria-label="Buscar conversaciones"
          />
          {searching && (
            <button type="button" onClick={() => setQuery("")} aria-label="Limpiar la búsqueda">
              <X className="w-3 h-3" aria-hidden />
            </button>
          )}
        </div>
      )}

      {/* Antes este contenedor tenía flex:1 — .asst-side-bottom usa margin-top:auto
          en el mismo flex column y le ganaba todo el espacio, dejándolo en 0px de
          alto. El cuerpo del menú ya scrollea completo. */}
      <div>
        {loading ? (
          <p className="asst-conv-note"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando…</p>
        ) : conversations.length === 0 ? (
          <p className="asst-conv-note">Todavía no hay conversaciones guardadas.</p>
        ) : results.length === 0 ? (
          <p className="asst-conv-note">Ninguna conversación coincide con «{query.trim()}».</p>
        ) : (
          groups.map((group) => (
            <div key={group.label || "resultados"}>
              {group.label && <div className="asst-group-label">{group.label}</div>}
              {group.items.map((c) => (
                <div key={c.id} className="asst-conv-row">
                  <button
                    className={`asst-switch-item ${c.id === activeId ? "active" : ""}`}
                    onClick={() => onOpen(c)}
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" aria-hidden />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                  </button>
                  <button className="asst-icon-btn" onClick={() => onDelete(c.id)} aria-label={`Borrar ${c.title}`}>
                    <Trash2 className="w-3.5 h-3.5" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );
}
