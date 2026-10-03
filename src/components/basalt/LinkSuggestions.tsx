import { Globe } from "lucide-react";
import { linkHost } from "@/lib/links";

// "Leer esta página" para los enlaces que el usuario pegó en el compositor.
//
// No se leen solos: leer una página tarda segundos y muchas veces el enlace se pega
// solo para mencionarlo. El contenido entra por el mismo canal que los documentos
// (bloque <documento>, no se guarda en el historial).
export function LinkSuggestions({ urls, onRead }: { urls: string[]; onRead: (url: string) => void }) {
  if (!urls.length) return null;
  return (
    <div className="asst-links" role="group" aria-label="Enlaces en tu mensaje">
      {urls.map((url) => (
        <button key={url} type="button" className="asst-link-btn" onClick={() => onRead(url)} title={url}>
          <Globe className="w-3.5 h-3.5" aria-hidden />
          <span>Leer <strong>{linkHost(url)}</strong></span>
        </button>
      ))}
    </div>
  );
}
