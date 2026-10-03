import { useEffect, useId, useRef, useState } from "react";
import { Check, Copy, Pencil, RefreshCw, Sparkles } from "lucide-react";
import { CHAT_MODELS, canAccessModel, getModel } from "@/lib/ai/models";

// Los gestos que todo el mundo espera bajo una respuesta: copiarla, pedirla de nuevo
// y —esto Gemini no lo puede ofrecer— pedírsela a OTRO de los 21 modelos sin perder
// la conversación. Existían en src/pages/Chat.tsx, que hace semanas no está enrutado.
//
// Regenerar y cambiar de modelo solo aparecen en la ÚLTIMA respuesta: rehacer una del
// medio tiraría todo lo que vino después sin que se vea venir.

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      className="asst-act"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        } catch {
          /* sin permiso de portapapeles (http, Safari viejo): no se promete lo que no pasó */
        }
      }}
      aria-label={copied ? "Copiado" : "Copiar la respuesta"}
      title="Copiar"
    >
      {copied ? <Check className="w-3.5 h-3.5" aria-hidden /> : <Copy className="w-3.5 h-3.5" aria-hidden />}
      <span>{copied ? "Copiado" : "Copiar"}</span>
    </button>
  );
}

interface Props {
  text: string;
  /** Id del modelo que respondió (cabecera X-Model-Used). */
  model?: string;
  /** Solo en la última respuesta. */
  onRegenerate?: () => void;
  onRegenerateWith?: (modelId: string) => void;
  /** Plan del usuario: no se ofrece un modelo que su plan no permite. */
  tier?: string;
  disabled?: boolean;
}

export function MessageActions({ text, model, onRegenerate, onRegenerateWith, tier, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const popId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const usable = CHAT_MODELS.filter((m) => canAccessModel(tier, m.minTier) && m.id !== model);

  return (
    <div className="asst-actions" ref={rootRef}>
      <CopyButton text={text} />

      {onRegenerate && (
        <button type="button" className="asst-act" onClick={onRegenerate} disabled={disabled} title="Volver a generar la respuesta">
          <RefreshCw className="w-3.5 h-3.5" aria-hidden />
          <span>Regenerar</span>
        </button>
      )}

      {onRegenerateWith && !!usable.length && (
        <>
          <button
            type="button"
            className="asst-act"
            onClick={() => setOpen((o) => !o)}
            disabled={disabled}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={open ? popId : undefined}
            title="Pedirle la misma respuesta a otro modelo"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden />
            <span>Otro modelo</span>
          </button>
          {open && (
            <div className="asst-act-pop" id={popId} role="menu">
              {usable.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="menuitem"
                  className="asst-act-item"
                  onClick={() => { setOpen(false); onRegenerateWith(m.id); }}
                >
                  <span className="asst-act-item-name">{m.label}</span>
                  <span className={`asst-picker-chip${m.free ? " free" : ""}`}>{m.free ? "Gratis" : `${m.credits} cr`}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Qué modelo respondió: con 21 modelos y el selector arriba, es la diferencia
          entre "la IA se equivocó" y "este modelo se equivocó". */}
      {model && <span className="asst-act-model" title={model}>{getModel(model).label}</span>}
    </div>
  );
}

/** Editar lo que mandaste y volver a preguntar (la respuesta anterior se descarta). */
export function EditButton({ onEdit }: { onEdit: () => void }) {
  return (
    <button type="button" className="asst-act asst-act-edit" onClick={onEdit} title="Editar y volver a enviar">
      <Pencil className="w-3.5 h-3.5" aria-hidden />
      <span>Editar</span>
    </button>
  );
}
