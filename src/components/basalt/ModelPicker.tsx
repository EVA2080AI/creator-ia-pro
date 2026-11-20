import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Globe, Image as ImageIcon, Lock, Sparkles, Zap } from "lucide-react";
import {
  AUTO_CHAT_ID, AUTO_CODE_ID, AUTO_MODEL_ID, CATEGORY_META, CATEGORY_ORDER, CHAT_MODELS, FREE_ONLY_MODE, IMAGE_MODELS, POWER_LABEL,
  byPower, canAccessModel, getImageModel, getModel, powerTier,
  type PlanTier, type PowerTier,
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
  /** Sin imageModel/onImageModel el panel omite la sección de imágenes (los Expertos no generan). */
  imageModel?: string;
  /** Plan del usuario. undefined = todavía cargando: no se bloquea nada (el servidor igual valida). */
  tier: string | undefined;
  onModel: (id: string) => void;
  onImageModel?: (id: string) => void;
  /** false = sin la fila "Auto": solo Basalt resuelve "auto" en el cliente; un
   *  Experto manda el id literal al servidor, que no conoce "auto". */
  autoRow?: boolean;
}

interface RowProps {
  title: string;
  sub: string;
  desc?: string;
  /** Qué tan potente es frente a los demás modelos a la vista. La etiqueta principal de un
   *  modelo de texto: antes decía "Gratis", que no le sirve a nadie para elegir. */
  power?: PowerTier;
  /** Costo en créditos, solo si lo tiene ("2 cr"). Sin chip de costo = no cuesta. */
  cost?: string;
  /** Etiqueta suelta para una fila que no es un modelo (la de "Auto"). */
  badge?: string;
  selected: boolean;
  lockedTier?: PlanTier;
  slow?: boolean;
  onPick: () => void;
}

function Row({ title, sub, desc, power, cost, badge, selected, lockedTier, slow, onPick }: RowProps) {
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
        {slow && !locked && <span className="asst-picker-chip slow" title="Genera despacio: una página completa tarda varios minutos">Lento</span>}
        {power && <span className={`asst-picker-chip power-${power}`}>{power === "top" && <Zap className="w-3 h-3" aria-hidden />}{POWER_LABEL[power]}</span>}
        {badge && <span className="asst-picker-chip rec">{badge}</span>}
        {locked ? <span className="asst-picker-chip lock"><Lock className="w-3 h-3" />{TIER_LABEL[lockedTier]}</span> : cost && <span className="asst-picker-chip">{cost}</span>}
        {selected && <Check className="w-4 h-4 asst-picker-check" aria-hidden />}
      </span>
    </button>
  );
}

export function ModelPicker({ model, imageModel, tier, onModel, onImageModel, autoRow = true }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const popId = useId();
  const esAuto = model === AUTO_MODEL_ID;
  const current = getModel(model);
  const conImagenes = imageModel !== undefined && !!onImageModel;
  const currentImage = conImagenes ? getImageModel(imageModel) : undefined;
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

  const chatLocked = CHAT_MODELS.some((m) => lockOf(m.minTier));
  const anyLocked = chatLocked || (conImagenes && IMAGE_MODELS.some((m) => lockOf(m.minTier)));

  return (
    <div className="asst-picker" ref={rootRef}>
      <button
        type="button"
        className="asst-picker-trigger"
        data-tour="modelo"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        onClick={() => setOpen((o) => !o)}
        title={`Modelo: ${esAuto ? "Auto" : current.label}${currentImage ? ` · Imágenes: ${currentImage.label}` : ""}`}
      >
        <Sparkles className="w-3.5 h-3.5" aria-hidden />
        <span className="asst-picker-label">{esAuto ? "Auto" : current.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 asst-picker-caret${open ? " open" : ""}`} aria-hidden />
      </button>

      {open && (
        <>
          <div className="asst-picker-backdrop" onClick={() => setOpen(false)} aria-hidden />
          <div className="asst-picker-pop" id={popId} ref={popRef} role="dialog" aria-label="Elegir modelo" onKeyDown={onPopKey}>
            <div className="asst-picker-scroll" role="listbox" aria-label="Modelos de texto y código">
              {/* Auto va primero y fuera de las categorías: no es un modelo del
                  catálogo, es "Basalt elige por ti" — y solo entre los gratis,
                  para que nunca gaste créditos por su cuenta. */}
              {autoRow && (
                <div className="asst-picker-group">
                  <Row
                    title="Auto"
                    sub="Basalt elige por ti"
                    desc={`${FREE_ONLY_MODE ? "" : "Siempre gratis: "}${getModel(AUTO_CHAT_ID).label} para conversar y ver fotos; ${getModel(AUTO_CODE_ID).label} cuando pides código o un sitio. Debajo de cada respuesta ves cuál respondió.`}
                    badge="Recomendado"
                    selected={esAuto}
                    onPick={() => { onModel(AUTO_MODEL_ID); setOpen(false); }}
                  />
                </div>
              )}
              {/* Una categoría sin modelos no se dibuja: con FREE_ONLY_MODE queda una sola, y
                  ahí el título ya no separa "gratis" de "de pago" porque no hay de pago. Dentro
                  de cada una, del más potente al menos. */}
              {CATEGORY_ORDER.filter((cat) => CHAT_MODELS.some((m) => m.category === cat)).map((cat) => (
                <div key={cat} className="asst-picker-group">
                  <div className="asst-picker-heading">{cat === "eco" ? (FREE_ONLY_MODE ? "Modelos" : "Gratis") : CATEGORY_META[cat].label}</div>
                  {byPower(CHAT_MODELS.filter((m) => m.category === cat)).map((m) => (
                    <Row
                      key={m.id}
                      title={m.label}
                      sub={`${m.provider} · ${m.context}`}
                      desc={m.description}
                      power={powerTier(m)}
                      cost={m.free ? undefined : `${m.credits} cr`}
                      selected={m.id === model}
                      lockedTier={lockOf(m.minTier)}
                      slow={m.slow}
                      onPick={() => { onModel(m.id); setOpen(false); }}
                    />
                  ))}
                </div>
              ))}
            </div>
            {conImagenes && (
              <div className="asst-picker-scroll asst-picker-images" role="listbox" aria-label="Motores de imagen">
                <div className="asst-picker-heading"><ImageIcon className="w-3.5 h-3.5" aria-hidden /> Imágenes</div>
                {IMAGE_MODELS.map((m) => (
                  <Row
                    key={m.id}
                    title={m.label}
                    sub={m.providerLabel}
                    desc={m.description}
                    cost={`${m.credits} cr`}
                    selected={m.id === imageModel}
                    lockedTier={lockOf(m.minTier)}
                    onPick={() => { onImageModel!(m.id); setOpen(false); }}
                  />
                ))}
              </div>
            )}
            {/* El costo de la búsqueda web no estaba escrito en ninguna parte: el chat
                puede buscar en internet solo y cada búsqueda suma 1 crédito al del
                mensaje. Va acá, donde el usuario está mirando precios. */}
            <p className="asst-picker-note">
              <Globe className="w-3 h-3" aria-hidden /> Si hace falta buscar en internet, cada búsqueda suma 1 crédito.
            </p>
            {anyLocked && (
              <a className="asst-picker-upsell" href="/pricing">
                <Lock className="w-3.5 h-3.5" aria-hidden /> {chatLocked ? "Desbloquea más modelos" : "Desbloquea más motores de imagen"} — ver planes
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}
