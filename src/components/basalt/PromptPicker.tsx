import { useEffect, useId, useRef, useState } from "react";
import {
  BarChart3, Check, ChevronDown, Code2, Dice5, FileText, Image as ImageIcon, LayoutTemplate, Lightbulb, Paperclip, PenLine, Presentation, Scale, Sparkles, Wallet,
} from "lucide-react";
import { ATTACH_CARD_PROMPT } from "@/lib/doc-context";
import type { AssistantWelcomeCard } from "@/lib/assistants";

// Las ideas de la bienvenida, como selector. Antes eran nueve tarjetas grandes y tocar una
// ENVIABA el mensaje: el usuario veía a Basalt arrancar a construir "una landing para mi
// negocio" sin haber dicho de qué negocio. Pedido de Sebastián (2026-11-21): "prefiero que
// sea un selector y no empiece a desarrollar sino que inyecte el prompt en el chat". Elegir
// una idea solo deja su texto en el compositor, para ajustarlo antes de enviar.

const ICONS: Record<string, typeof LayoutTemplate> = {
  layout: LayoutTemplate, image: ImageIcon, pen: PenLine, chart: BarChart3, compare: Scale,
  dice: Dice5, pay: Wallet, file: FileText, code: Code2, slides: Presentation,
};

const ATTACH_DESC = "Adjunta el archivo (PDF, Word o texto) y dime qué quieres saber.";

interface Props {
  cards: AssistantWelcomeCard[];
  /** Texto que hay ahora en el compositor: marca la idea elegida mientras no se edite. */
  current: string;
  /** Deja el texto en el compositor. NO envía. */
  onPick: (prompt: string) => void;
  /** Las ideas de "analizar un documento" abren el selector de archivos. */
  onAttach: () => void;
}

export function PromptPicker({ cards, current, onPick, onAttach }: Props) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<React.CSSProperties>();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const popId = useId();
  const hintId = useId();
  const chosen = cards.find((c) => c.prompt !== ATTACH_CARD_PROMPT && c.prompt === current);

  // En escritorio la lista va fija a la pantalla, debajo del botón: dentro del hilo (que
  // recorta lo que sobresale) quedaba cortada por abajo o lo hacía desplazarse y el saludo
  // se iba de la vista. En móvil es una hoja inferior y la ubica el CSS.
  const place = () => {
    const t = rootRef.current?.querySelector<HTMLElement>(".asst-prompts-trigger");
    if (!t || window.matchMedia?.("(max-width: 640px)").matches) return setBox(undefined);
    const r = t.getBoundingClientRect();
    const top = Math.min(r.bottom + 8, window.innerHeight - 236);
    setBox({ position: "fixed", top, left: r.left, width: r.width, maxHeight: Math.max(220, window.innerHeight - top - 16) });
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      rootRef.current?.querySelector<HTMLElement>(".asst-prompts-trigger")?.focus();
    };
    // Si el hilo se desplaza, la lista fija se quedaría flotando lejos de su botón.
    const onScroll = (e: Event) => { if (!popRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", onScroll, true);
    popRef.current?.querySelector<HTMLElement>(".asst-picker-row.selected, .asst-picker-row")?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const onPopKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
    const rows = [...(popRef.current?.querySelectorAll<HTMLElement>(".asst-picker-row") ?? [])];
    if (!rows.length) return;
    e.preventDefault();
    const i = rows.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "Home" ? 0 : e.key === "End" ? rows.length - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length;
    rows[next].focus();
  };

  const pick = (c: AssistantWelcomeCard) => {
    setOpen(false);
    if (c.prompt === ATTACH_CARD_PROMPT) onAttach();
    else onPick(c.prompt);
  };

  if (!cards.length) return null;

  return (
    <div className="asst-prompts" ref={rootRef}>
      <button
        type="button"
        className="asst-prompts-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        aria-describedby={hintId}
        onClick={() => { if (!open) place(); setOpen((o) => !o); }}
      >
        <Lightbulb className="w-4 h-4" aria-hidden />
        <span className="asst-prompts-label">{chosen ? chosen.label : "Elige una idea para empezar"}</span>
        <ChevronDown className={`w-4 h-4 asst-picker-caret${open ? " open" : ""}`} aria-hidden />
      </button>
      <p className="asst-prompts-hint" id={hintId}>
        {chosen ? "Quedó escrita abajo: ajústala a tu caso y envíala." : "El texto queda en el chat para que lo ajustes antes de enviar."}
      </p>

      {open && (
        <>
          <div className="asst-picker-backdrop" onClick={() => setOpen(false)} aria-hidden />
          <div className="asst-prompts-pop" id={popId} ref={popRef} style={box} role="listbox" aria-label="Ideas para empezar" onKeyDown={onPopKey}>
            {cards.map((c) => {
              const attach = c.prompt === ATTACH_CARD_PROMPT;
              const selected = chosen === c;
              const Icon = (c.icon && ICONS[c.icon]) || Sparkles;
              return (
                <button
                  key={c.label}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`asst-picker-row${selected ? " selected" : ""}`}
                  onClick={() => pick(c)}
                >
                  <span className="asst-prompts-ic" aria-hidden><Icon className="w-4 h-4" /></span>
                  <span className="asst-picker-row-main">
                    <span className="asst-picker-row-title">{c.label}</span>
                    <span className="asst-picker-row-desc">{attach ? ATTACH_DESC : c.prompt}</span>
                  </span>
                  <span className="asst-picker-row-end">
                    {attach && <span className="asst-picker-chip"><Paperclip className="w-3 h-3" aria-hidden />Adjuntar</span>}
                    {selected && <Check className="w-4 h-4 asst-picker-check" aria-hidden />}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
