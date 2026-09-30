import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Image as ImageIcon, Lock, Sparkles } from "lucide-react";
import {
  CATEGORY_META, CATEGORY_ORDER, CHAT_MODELS, IMAGE_MODELS, canAccessModel, getImageModel, getModel,
  type PlanTier,
} from "@/lib/ai/models";

// Reemplaza los dos <select> nativos de la topbar de Basalt (11-12px, con el
// costo metido en el texto de cada <option>, cortados por max-width y con el
// zoom de iOS al enfocarlos). Un solo botón abre un panel con los modelos de
// texto/código agrupados y los motores de imagen, con el costo como chip y —lo
// que antes no existía— el candado del plan: hoy un usuario Free elegía un
// modelo Creador+ y recién ahí veía el 403.
const TIER_LABEL: Record<PlanTier, string> = { free: "Free", creador: "Creador", pro: "Pro", agencia: "Agencia", pyme: "Pyme" };

interface Props {
  model: string;
  imageModel: string;
  /** Plan del usuario. undefined = todavía cargando: no se bloquea nada (el servidor igual valida). */
  tier: string | undefined;
  onModel: (id: string) => void;
  onImageModel: (id: string) => void;
}

interface RowProps {
  title: string;
  sub: string;
  desc?: string;
  chip: string;
  selected: boolean;
  lockedTier?: PlanTier;
  onPick: () => void;
}

function Row({ title, sub, desc, chip, selected, lockedTier, onPick }: RowProps) {
  const locked = !!lockedTier;
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      aria-disabled={locked || undefined}
      disabled={locked}
      title={locked ? `Requiere el plan ${TIER_LABEL[lockedTier]} o superior` : undefined}
      className={`asst-picker-row${selected ? " selected" : ""}${locked ? " locked" : ""}`}
      onClick={onPick}
    >
      <span className="asst-picker-row-main">
        <span className="asst-picker-row-title">{title}<small>{sub}</small></span>
        {desc && <span className="asst-picker-row-desc">{desc}</span>}
      </span>
      <span className="asst-picker-row-end">
        {locked ? <span className="asst-picker-chip lock"><Lock className="w-3 h-3" />{TIER_LABEL[lockedTier]}</span> : <span className={`asst-picker-chip${chip === "Gratis" ? " free" : ""}`}>{chip}</span>}
        {selected && <Check className="w-4 h-4 asst-picker-check" aria-hidden />}
      </span>
    </button>
  );
}

export function ModelPicker({ model, imageModel, tier, onModel, onImageModel }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const popId = useId();
  const current = getModel(model);
  const currentImage = getImageModel(imageModel);
  const lockOf = (min: PlanTier) => (tier && !canAccessModel(tier, min) ? min : undefined);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); rootRef.current?.querySelector<HTMLElement>(".asst-picker-trigger")?.focus(); } };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    popRef.current?.querySelector<HTMLElement>(".asst-picker-row.selected, .asst-picker-row:not(:disabled)")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onPopKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
    const rows = [...(popRef.current?.querySelectorAll<HTMLElement>(".asst-picker-row:not(:disabled)") ?? [])];
    if (!rows.length) return;
    e.preventDefault();
    const i = rows.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "Home" ? 0 : e.key === "End" ? rows.length - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length;
    rows[next].focus();
  };

  const anyLocked = CHAT_MODELS.some((m) => lockOf(m.minTier)) || IMAGE_MODELS.some((m) => lockOf(m.minTier));

  return (
    <div className="asst-picker" ref={rootRef}>
      <button
        type="button"
        className="asst-picker-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        onClick={() => setOpen((o) => !o)}
        title={`Modelo: ${current.label} · Imágenes: ${currentImage.label}`}
      >
        <Sparkles className="w-3.5 h-3.5" aria-hidden />
        <span className="asst-picker-label">{current.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 asst-picker-caret${open ? " open" : ""}`} aria-hidden />
      </button>

      {open && (
        <>
          <div className="asst-picker-backdrop" onClick={() => setOpen(false)} aria-hidden />
          <div className="asst-picker-pop" id={popId} ref={popRef} role="dialog" aria-label="Elegir modelo" onKeyDown={onPopKey}>
            <div className="asst-picker-scroll" role="listbox" aria-label="Modelos de texto y código">
              {CATEGORY_ORDER.map((cat) => (
                <div key={cat} className="asst-picker-group">
                  <div className="asst-picker-heading">{cat === "eco" ? "Gratis" : CATEGORY_META[cat].label}</div>
                  {CHAT_MODELS.filter((m) => m.category === cat).map((m) => (
                    <Row
                      key={m.id}
                      title={m.label}
                      sub={`${m.provider} · ${m.context}`}
                      desc={m.description}
                      chip={m.free ? "Gratis" : `${m.credits} cr`}
                      selected={m.id === model}
                      lockedTier={lockOf(m.minTier)}
                      onPick={() => { onModel(m.id); setOpen(false); }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="asst-picker-scroll asst-picker-images" role="listbox" aria-label="Motores de imagen">
              <div className="asst-picker-heading"><ImageIcon className="w-3.5 h-3.5" aria-hidden /> Imágenes</div>
              {IMAGE_MODELS.map((m) => (
                <Row
                  key={m.id}
                  title={m.label}
                  sub={m.providerLabel}
                  desc={m.description}
                  chip={`${m.credits} cr`}
                  selected={m.id === imageModel}
                  lockedTier={lockOf(m.minTier)}
                  onPick={() => { onImageModel(m.id); setOpen(false); }}
                />
              ))}
            </div>
            {anyLocked && (
              <a className="asst-picker-upsell" href="/pricing">
                <Lock className="w-3.5 h-3.5" aria-hidden /> Desbloquea más modelos — ver planes
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}
