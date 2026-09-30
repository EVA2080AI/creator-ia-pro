import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { extractDocument, type ExtractedDoc } from "@/lib/doc-extract";

// Documentos que el usuario adjuntó y todavía no envió: se leen en el navegador apenas los elige
// (PDF/Word/texto → texto) y quedan listos para viajar con el próximo mensaje.
export const MAX_PENDING_DOCS = 5;

export interface PendingDoc {
  id: string;
  name: string;
  size: number;
  status: "leyendo" | "listo";
  doc?: ExtractedDoc;
}

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

  const remove = useCallback((id: string) => commit(docsRef.current.filter((d) => d.id !== id)), []);
  const clear = useCallback(() => commit([]), []);
  const restore = useCallback((prev: PendingDoc[]) => commit(prev), []);

  const ready = useMemo(() => docs.filter((d) => d.status === "listo" && d.doc), [docs]);
  const busy = docs.some((d) => d.status === "leyendo");
  return { docs, ready, busy, addFiles, remove, clear, restore };
}
