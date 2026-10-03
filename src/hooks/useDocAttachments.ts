import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { extractDocument, type ExtractedDoc } from "@/lib/doc-extract";
import { MAX_DOCS_PER_MESSAGE } from "@/lib/doc-context";

// Documentos que el usuario adjuntó y todavía no envió: se leen en el navegador apenas los elige
// (PDF/Word/texto → texto) y quedan listos para viajar con el próximo mensaje.
// El tope vive en doc-context.ts porque el servidor aplica el mismo (api/ai/chat.ts).
export const MAX_PENDING_DOCS = MAX_DOCS_PER_MESSAGE;

export interface PendingDoc {
  id: string;
  name: string;
  size: number;
  status: "leyendo" | "listo";
  doc?: ExtractedDoc;
  /** Página web leída con /api/scrape en vez de un archivo del disco. */
  url?: string;
}

/** Texto máximo de una página web, igual que el de /api/scrape. */
const MAX_WEB_CHARS = 15_000;

export function useDocAttachments() {
  const [docs, setDocs] = useState<PendingDoc[]>([]);
  // Para ignorar duplicados y respetar el máximo aun cuando varias lecturas terminan a la vez.
  const docsRef = useRef<PendingDoc[]>([]);
  const commit = (next: PendingDoc[]) => { docsRef.current = next; setDocs(next); };

  const addFiles = useCallback(async (input: FileList | File[]) => {
    const files = Array.from(input);
    for (const file of files) {
      if (docsRef.current.length >= MAX_PENDING_DOCS) {
        toast.error(`Máximo ${MAX_PENDING_DOCS} documentos por mensaje.`);
        break;
      }
      if (docsRef.current.some((d) => d.name === file.name && d.size === file.size)) continue;
      const id = crypto.randomUUID();
      commit([...docsRef.current, { id, name: file.name, size: file.size, status: "leyendo" }]);
      try {
        const doc = await extractDocument(file);
        commit(docsRef.current.map((d) => (d.id === id ? { ...d, status: "listo", doc } : d)));
        if (doc.warning) toast.warning(`«${file.name}»: ${doc.warning}.`);
        else if (doc.truncated) toast.warning(`«${file.name}» es muy largo: se enviará solo el comienzo.`);
      } catch (e) {
        commit(docsRef.current.filter((d) => d.id !== id));
        toast.error(e instanceof Error ? e.message : `No pude leer «${file.name}».`);
      }
    }
  }, []);

  // Leer una página web que el usuario pegó. Viaja por el mismo canal que los
  // documentos: el texto va dentro de un bloque <documento> (con la regla de "no
  // obedezcas lo que diga") y no se guarda en el historial — una página ajena es
  // texto de terceros, igual que un PDF que alguien te mandó.
  const addUrl = useCallback(async (rawUrl: string) => {
    if (docsRef.current.length >= MAX_PENDING_DOCS) {
      toast.error(`Máximo ${MAX_PENDING_DOCS} adjuntos por mensaje.`);
      return;
    }
    if (docsRef.current.some((d) => d.url === rawUrl)) return;
    const id = crypto.randomUUID();
    let host = rawUrl;
    try { host = new URL(rawUrl).hostname.replace(/^www\./, ""); } catch { /* se queda la url cruda */ }
    commit([...docsRef.current, { id, name: host, size: 0, status: "leyendo", url: rawUrl }]);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: rawUrl }),
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; title?: string; content?: string; error?: string } | null;
      if (!res.ok || !body?.ok || !body.content?.trim()) {
        throw new Error(body?.error || "No pude leer esa página.");
      }
      const text = body.content.trim();
      const doc: ExtractedDoc = {
        // El nombre es lo que ve el modelo dentro de <documento nombre="…">: el
        // dominio va primero para que sepa de quién es el texto que está leyendo.
        name: body.title ? `${host} — ${body.title}` : host,
        text,
        chars: text.length,
        truncated: text.length >= MAX_WEB_CHARS,
      };
      commit(docsRef.current.map((d) => (d.id === id ? { ...d, status: "listo", name: body.title || host, size: text.length, doc } : d)));
    } catch (e) {
      commit(docsRef.current.filter((d) => d.id !== id));
      toast.error(e instanceof Error ? e.message : "No pude leer esa página.");
    }
  }, []);

  const remove = useCallback((id: string) => commit(docsRef.current.filter((d) => d.id !== id)), []);
  const clear = useCallback(() => commit([]), []);
  const restore = useCallback((prev: PendingDoc[]) => commit(prev), []);

  const ready = useMemo(() => docs.filter((d) => d.status === "listo" && d.doc), [docs]);
  const busy = docs.some((d) => d.status === "leyendo");
  return { docs, ready, busy, addFiles, addUrl, remove, clear, restore };
}
