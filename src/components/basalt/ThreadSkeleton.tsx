import { Bot } from "lucide-react";

// Lo que se ve mientras llegan los mensajes de una conversación que se acaba de abrir.
// Va en el render y NUNCA dentro de `messages`: si se metiera ahí, guardar en ese
// momento subiría este stub y sobrescribiría la conversación real.
//
// El título de una conversación ES el principio del primer mensaje del usuario
// (ver `persist` en Basalt.tsx), así que la burbuja no inventa nada.

export function ThreadSkeleton({ title, status, onRetry }: {
  title: string;
  status: "loading" | "error";
  onRetry: () => void;
}) {
  return (
    <div className="asst-thread">
      {title && <div className="asst-msg user"><div className="asst-bubble">{title}</div></div>}
      {status === "loading" ? (
        <div className="asst-msg model">
          <div className="asst-avatar"><Bot className="w-3.5 h-3.5 text-white" aria-hidden /></div>
          <div className="asst-body">
            <div className="asst-shimmer" role="status" aria-label="Abriendo la conversación"><i /><i /><i /></div>
          </div>
        </div>
      ) : (
        <div className="asst-err" role="alert">
          <span>⚠️ No se pudo abrir esta conversación.</span>
          <button onClick={onRetry}>Reintentar</button>
        </div>
      )}
    </div>
  );
}
