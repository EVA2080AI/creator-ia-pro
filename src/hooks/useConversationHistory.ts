import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  loadConversations, deleteConversation, setConversationPinned, renameConversation,
  getCachedMessages, loadConversationMessages, prefetchConversation,
  migrateLegacyLocalStorage,
  type ConversationSummary, type StoredMsg,
} from "@/lib/basalt";

// El historial del chat: cargar la lista, abrir una conversación (sus mensajes se
// piden aparte desde que la lista dejó de traerlos), borrar y anclar.
//
// Basalt.tsx y Assistant.tsx son el mismo chat con otra personalidad, y esto estaba
// copiado en los dos — con la misma carrera al abrir, el mismo estado de carga y el
// mismo anclado optimista escritos dos veces. Cualquier arreglo había que hacerlo
// por duplicado, que es justo como se desincronizaron antes.

/** "loading" = los mensajes de la conversación abierta todavía no llegaron. */
export type ThreadStatus = "idle" | "loading" | "error";

interface Options {
  userId: string;
  /** undefined = chat de Basalt; con valor = ese Experto (historial separado). */
  assistantSlug?: string;
  /** Qué hacer con los mensajes que llegan (normalmente setMessages de la página). */
  onMessages: (messages: StoredMsg[]) => void;
  /** Para bajar el scroll cuando el hilo ya está pintado. */
  onOpened?: () => void;
}

export function useConversationHistory({ userId, assistantSlug, onMessages, onOpened }: Options) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  /** El historial no se pudo cargar (red caída, 500, sesión vencida). */
  const [listError, setListError] = useState(false);
  const [threadStatus, setThreadStatus] = useState<ThreadStatus>("idle");
  const [openingTitle, setOpeningTitle] = useState("");
  // Id de la conversación que se está abriendo: si para cuando llegan los mensajes
  // el usuario ya abrió otra, la respuesta se descarta.
  const openRef = useRef("");

  const refresh = useCallback(async () => {
    if (!userId) return;
    const list = await loadConversations(userId, assistantSlug);
    // null = no se pudo cargar: se conserva lo que ya estaba en pantalla en vez de
    // vaciar la lista (un guardado que termina mientras se cae la red no debería
    // hacer desaparecer el historial).
    setListError(list === null);
    if (list) setConversations(list);
    return list ?? undefined;
  }, [userId, assistantSlug]);

  const load = useCallback(() => {
    if (!userId) return () => {};
    let vivo = true;
    setLoading(true);
    setListError(false);
    void migrateLegacyLocalStorage(userId)
      .then(() => loadConversations(userId, assistantSlug))
      .then((list) => {
        if (!vivo) return;
        if (list) setConversations(list);
        else setListError(true);
        setLoading(false);
      });
    return () => { vivo = false; };
  }, [userId, assistantSlug]);

  useEffect(() => load(), [load]);

  /** Abre una conversación: instantáneo si ya está en memoria, con esqueleto si no. */
  const open = useCallback((c: ConversationSummary) => {
    openRef.current = c.id;
    const cached = getCachedMessages(userId, c.id);
    if (cached) {
      onMessages(cached);
      setThreadStatus("idle");
      onOpened?.();
      return;
    }
    onMessages([]);
    setOpeningTitle(c.title);
    setThreadStatus("loading");
    void loadConversationMessages(userId, c.id).then((messages) => {
      if (openRef.current !== c.id) return;
      if (!messages) { setThreadStatus("error"); return; }
      onMessages(messages);
      setThreadStatus("idle");
      onOpened?.();
    });
  }, [userId, onMessages, onOpened]);

  /** Vuelve al estado de "chat nuevo" (sin conversación abierta). */
  const reset = useCallback(() => {
    openRef.current = "";
    setThreadStatus("idle");
    setOpeningTitle("");
  }, []);

  const remove = useCallback((id: string) => {
    void deleteConversation(userId, id).then(() => refresh());
  }, [userId, refresh]);

  /** Optimista: la lista se reordena al instante y vuelve atrás si el servidor falla. */
  const togglePin = useCallback((c: ConversationSummary) => {
    const next = !c.pinned;
    setConversations((prev) => prev.map((x) => (x.id === c.id ? { ...x, pinned: next } : x)));
    void setConversationPinned(userId, c.id, next).then((ok) => {
      if (ok) return;
      setConversations((prev) => prev.map((x) => (x.id === c.id ? { ...x, pinned: !next } : x)));
      toast.error(next ? "No se pudo anclar la conversación." : "No se pudo desanclar la conversación.");
    });
  }, [userId]);

  /** Optimista, como anclar: el título cambia al instante y vuelve atrás si falla. */
  const rename = useCallback((id: string, title: string) => {
    const limpio = title.trim();
    if (!limpio) return;
    let anterior = "";
    setConversations((prev) => prev.map((x) => {
      if (x.id !== id) return x;
      anterior = x.title;
      return { ...x, title: limpio };
    }));
    void renameConversation(userId, id, limpio).then((ok) => {
      if (ok) return;
      setConversations((prev) => prev.map((x) => (x.id === id ? { ...x, title: anterior } : x)));
      toast.error("No se pudo renombrar la conversación.");
    });
  }, [userId]);

  const prefetch = useCallback((id: string) => prefetchConversation(userId, id), [userId]);

  /** Props que espera <ConversationList>, para no repetir el cableado en cada página. */
  const listProps = {
    conversations,
    loading,
    onOpen: open,
    onDelete: remove,
    error: listError,
    onRetry: load,
    onTogglePin: togglePin,
    onRename: rename,
    onPrefetch: prefetch,
  };

  return { conversations, loading, listError, threadStatus, openingTitle, open, reset, remove, togglePin, rename, prefetch, refresh, listProps };
}
