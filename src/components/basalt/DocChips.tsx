import { FileText, Globe, Loader2, X } from "lucide-react";
import { formatBytes } from "@/lib/doc-extract";
import type { DocMeta } from "@/lib/doc-context";
import type { PendingDoc } from "@/hooks/useDocAttachments";

// Fichas de los documentos adjuntos: en el compositor (con quitar y estado de lectura) y dentro de la
// burbuja del mensaje ya enviado (solo nombre y tamaño: el texto no se guarda en el historial).

export function PendingDocChips({ docs, onRemove }: { docs: PendingDoc[]; onRemove: (id: string) => void }) {
  if (!docs.length) return null;
  return (
    <div className="asst-docs" role="list" aria-label="Documentos adjuntos">
      {docs.map((d) => (
        <div key={d.id} className="asst-doc" role="listitem">
          {d.status === "leyendo" ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : d.url ? <Globe className="w-3.5 h-3.5" aria-hidden /> : <FileText className="w-3.5 h-3.5" aria-hidden />}
          <span className="asst-doc-name" title={d.url || d.name}>{d.name}</span>
          <span className="asst-doc-meta">
            {d.status === "leyendo"
              ? "leyendo…"
              : [
                  // Una página web no tiene páginas ni un tamaño de archivo que signifique algo:
                  // lo que importa es que es web y cuánto texto se le va a mandar al modelo.
                  d.url ? `página web · ${d.doc?.chars.toLocaleString("es-CO") ?? 0} car.` : d.doc?.pages ? `${d.doc.pages} pág.` : formatBytes(d.size),
                  d.doc?.truncated ? "truncado" : "",
                ].filter(Boolean).join(" · ")}
          </span>
          <button type="button" className="asst-doc-x" onClick={() => onRemove(d.id)} aria-label={`Quitar ${d.name}`}>
            <X className="w-3 h-3" aria-hidden />
          </button>
        </div>
      ))}
      <p className="asst-docs-note">
        {docs.some((d) => d.url)
          ? "El texto viaja al modelo solo para responder y no queda guardado en tu historial."
          : "Se lee en tu navegador; el texto viaja al modelo solo para responder y no queda guardado en tu historial."}
      </p>
    </div>
  );
}

export function SentDocChips({ docs }: { docs: DocMeta[] }) {
  if (!docs.length) return null;
  return (
    <div className="asst-docs asst-docs-sent" role="list" aria-label="Documentos adjuntos">
      {docs.map((d) => (
        <div key={d.name} className="asst-doc" role="listitem">
          <FileText className="w-3.5 h-3.5" aria-hidden />
          <span className="asst-doc-name" title={d.name}>{d.name}</span>
          <span className="asst-doc-meta">{[d.pages ? `${d.pages} pág.` : `${d.chars.toLocaleString("es-CO")} car.`, d.truncated ? "truncado" : ""].filter(Boolean).join(" · ")}</span>
        </div>
      ))}
    </div>
  );
}
