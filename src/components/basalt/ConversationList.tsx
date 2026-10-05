import { useMemo, useRef, useState } from "react";
import { AlertCircle, Check, Loader2, MessageSquare, Pencil, Pin, PinOff, RotateCw, Search, Trash2, X } from "lucide-react";
import { filterConversations, groupConversationsByDate, type ConversationSummary } from "@/lib/basalt";

// Historial del menú lateral. Estaba copiado tal cual en Basalt.tsx y en
// Assistant.tsx (los Expertos); acá vive una sola vez y de paso gana lo que le
// faltaba con una lista larga: buscar por título y agrupar por fecha.

/** Debajo de esto, buscar estorba más de lo que ayuda: se ven todas de un vistazo. */
const SEARCH_FROM = 6;

export interface ConversationListProps {
  conversations: ConversationSummary[];
  loading: boolean;
  activeId: string;
  onOpen: (c: ConversationSummary) => void;
  onDelete: (id: string) => void;
  onTogglePin: (c: ConversationSummary) => void;
  /** Renombrar: el título se deriva del primer mensaje y muchas veces no dice nada
   *  ("Hola", "Analiza este do…"). Encontrar una conversación vieja dependía de eso. */
  onRename?: (id: string, title: string) => void;
  /** El historial NO se pudo cargar. Distinto de una lista vacía: decir "todavía no
   *  hay conversaciones" cuando se cayó la red se lee como "las perdí". */
  error?: boolean;
  onRetry?: () => void;
  /** Al pasar el cursor o el foco por una fila se piden sus mensajes: al soltar el
   *  clic la conversación ya está en memoria y abre sin esqueleto. */
  onPrefetch?: (id: string) => void;
}

export function ConversationList({ conversations, loading, activeId, onOpen, onDelete, onTogglePin, onRename, onPrefetch, error, onRetry }: ConversationListProps) {
  const [query, setQuery] = useState("");
  // Id de la conversación que se está renombrando, y el texto en edición.
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const commitRename = () => {
    const id = editing;
    const title = draft.trim();
    setEditing("");
    const original = conversations.find((c) => c.id === id)?.title;
    if (id && title && title !== original) onRename?.(id, title);
  };
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
        ) : error && conversations.length === 0 ? (
          <p className="asst-conv-note asst-conv-error">
            <AlertCircle className="w-3.5 h-3.5" aria-hidden /> <span>No se pudo cargar tu historial.</span>
            {onRetry && <button type="button" onClick={onRetry}><RotateCw className="w-3 h-3" aria-hidden /> Reintentar</button>}
          </p>
        ) : conversations.length === 0 ? (
          <p className="asst-conv-note">Todavía no hay conversaciones guardadas.</p>
        ) : results.length === 0 ? (
          <p className="asst-conv-note">Ninguna conversación coincide con «{query.trim()}».</p>
        ) : (
          groups.map((group) => (
            <div key={group.label || "resultados"}>
              {group.label && <div className="asst-group-label">{group.label}</div>}
              {group.items.map((c) => (
                <div
                  key={c.id}
                  className="asst-conv-row"
                  onPointerEnter={() => onPrefetch?.(c.id)}
                  onFocusCapture={() => onPrefetch?.(c.id)}
                >
                  {editing === c.id ? (
                    <>
                      <input
                        ref={inputRef}
                        className="asst-rename-input"
                        value={draft}
                        autoFocus
                        aria-label={`Nuevo nombre de ${c.title}`}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); commitRename(); }
                          if (e.key === "Escape") { e.preventDefault(); setEditing(""); }
                        }}
                        // Al salir del campo se guarda: cerrar el menú o tocar otra fila en
                        // el teléfono no debería perder lo escrito.
                        onBlur={commitRename}
                      />
                      <button className="asst-icon-btn asst-row-btn open" onMouseDown={(e) => e.preventDefault()} onClick={commitRename} aria-label="Guardar el nombre">
                        <Check className="w-3.5 h-3.5" aria-hidden />
                      </button>
                    </>
                  ) : (
                  <>
                  <button
                    className={`asst-switch-item ${c.id === activeId ? "active" : ""}`}
                    onClick={() => onOpen(c)}
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" aria-hidden />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                  </button>
                  {onRename && (
                    <button
                      className="asst-icon-btn asst-row-btn"
                      onClick={() => { setEditing(c.id); setDraft(c.title); }}
                      aria-label={`Renombrar ${c.title}`}
                      title="Renombrar"
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden />
                    </button>
                  )}
                  <button
                    className={`asst-icon-btn asst-pin-btn ${c.pinned ? "pinned" : ""}`}
                    onClick={() => onTogglePin(c)}
                    aria-label={c.pinned ? `Desanclar ${c.title}` : `Anclar ${c.title}`}
                    title={c.pinned ? "Desanclar" : "Anclar arriba"}
                    aria-pressed={!!c.pinned}
                  >
                    {c.pinned ? <PinOff className="w-3.5 h-3.5" aria-hidden /> : <Pin className="w-3.5 h-3.5" aria-hidden />}
                  </button>
                  <button className="asst-icon-btn asst-row-btn" onClick={() => onDelete(c.id)} aria-label={`Borrar ${c.title}`}>
                    <Trash2 className="w-3.5 h-3.5" aria-hidden />
                  </button>
                  </>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );
}
