import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { haloRect, placeTooltip, type Rect, type TooltipPlacement } from "@/lib/tour-geometry";

// El recorrido guiado que pidió Sebastián (2026-10-05): en vez de un modal que CUENTA
// la interfaz, un paso a paso que la SEÑALA — "aquí escribes", "aquí adjuntas", "aquí
// cambias de modelo" — con un resaltado sobre el control real.
//
// Decisiones:
// - Los objetivos se marcan con `data-tour="<id>"` en el componente real, no con
//   selectores de clase: las clases cambian por estilos y el recorrido no debe
//   romperse por un refactor visual.
// - Un paso cuyo objetivo no existe o no se ve SE SALTA en silencio (menú plegado en
//   escritorio, botón que ese plan no tiene): un recorrido que señala el vacío es peor
//   que uno más corto.
// - Los pasos del menú lateral piden abrirlo (`drawer: true`) y al salir se cierra,
//   solo si lo abrió el recorrido.

export interface TourStep {
  /** data-tour del objetivo. */
  target: string;
  title: string;
  text: string;
  /** El objetivo vive en el menú lateral: hay que abrirlo en móvil. */
  drawer?: boolean;
}

interface Props {
  steps: TourStep[];
  open: boolean;
  /** terminado=true si llegó al final; false si lo saltó. En ambos casos se marca visto. */
  onClose: (terminado: boolean) => void;
  /** Abre/cierra el menú lateral para los pasos que viven ahí (móvil). */
  onDrawer?: (abierto: boolean) => void;
}

interface Medidas {
  halo: Rect;
  tip: TooltipPlacement;
}

const TIP_ALTO_ESTIMADO = 150;

export function GuidedTour({ steps, open, onClose, onDrawer }: Props) {
  const [i, setI] = useState(0);
  const [medidas, setMedidas] = useState<Medidas | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const abrioMenu = useRef(false);

  const paso = steps[i];

  // Encuentra el objetivo visible del paso actual; si no está, devuelve null.
  const medir = useCallback(() => {
    if (!paso) return null;
    const el = document.querySelector<HTMLElement>(`[data-tour="${paso.target}"]`);
    if (!el || !el.checkVisibility?.({ opacityProperty: true, visibilityProperty: true })) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return null;
    const target: Rect = { top: r.top, left: r.left, width: r.width, height: r.height };
    const alto = tipRef.current?.offsetHeight || TIP_ALTO_ESTIMADO;
    return { halo: haloRect(target, innerWidth, innerHeight), tip: placeTooltip(target, alto, innerWidth, innerHeight) };
  }, [paso]);

  // Al cambiar de paso: abrir/cerrar el menú si hace falta, esperar al layout y medir.
  // Si tras abrir el menú el objetivo sigue sin verse, el paso se salta.
  useEffect(() => {
    if (!open || !paso) return;
    let vivo = true;
    if (paso.drawer) {
      abrioMenu.current = true;
      onDrawer?.(true);
    } else if (abrioMenu.current) {
      abrioMenu.current = false;
      onDrawer?.(false);
    }
    const intentar = (restantes: number) => {
      if (!vivo) return;
      const m = medir();
      if (m) { setMedidas(m); return; }
      if (restantes > 0) { setTimeout(() => intentar(restantes - 1), 120); return; }
      // Objetivo inexistente o invisible: saltar el paso (adelante, o cerrar si era el último).
      if (i < steps.length - 1) setI(i + 1);
      else cerrar(true);
    };
    setMedidas(null);
    requestAnimationFrame(() => intentar(4));
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, i, paso?.target]);

  // El layout se mueve (girar el teléfono, teclado, scroll): remedir.
  useEffect(() => {
    if (!open) return;
    const re = () => setMedidas(medir());
    window.addEventListener("resize", re);
    window.addEventListener("scroll", re, true);
    return () => {
      window.removeEventListener("resize", re);
      window.removeEventListener("scroll", re, true);
    };
  }, [open, medir]);

  const cerrar = useCallback((terminado: boolean) => {
    if (abrioMenu.current) { abrioMenu.current = false; onDrawer?.(false); }
    setI(0);
    onClose(terminado);
  }, [onClose, onDrawer]);

  // Escape salta el recorrido; flechas navegan.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar(false);
      if (e.key === "ArrowRight" && i < steps.length - 1) setI(i + 1);
      if (e.key === "ArrowLeft" && i > 0) setI(i - 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, i, steps.length, cerrar]);

  if (!open || !paso || !medidas) return null;
  const ultimo = i === steps.length - 1;

  return (
    <div className="asst-tour" role="dialog" aria-modal="true" aria-label={`Recorrido: ${paso.title}`}>
      {/* El halo lleva la sombra gigante que oscurece todo lo demás: un solo nodo
          hace de foco y de telón. */}
      <div
        className="asst-tour-halo"
        style={{ top: medidas.halo.top, left: medidas.halo.left, width: medidas.halo.width, height: medidas.halo.height }}
        aria-hidden
      />
      <div
        ref={tipRef}
        className="asst-tour-tip"
        style={{ top: medidas.tip.top, left: medidas.tip.left, width: medidas.tip.width }}
      >
        <div className="asst-tour-head">
          <span className="asst-tour-count">{i + 1} de {steps.length}</span>
          <button type="button" className="asst-tour-skip" onClick={() => cerrar(false)} aria-label="Saltar el recorrido">
            <X className="w-3.5 h-3.5" aria-hidden /> Saltar
          </button>
        </div>
        <p className="asst-tour-title">{paso.title}</p>
        <p className="asst-tour-text" aria-live="polite">{paso.text}</p>
        <div className="asst-tour-nav">
          {i > 0 && (
            <button type="button" className="asst-tour-btn" onClick={() => setI(i - 1)}>Anterior</button>
          )}
          <button type="button" className="asst-tour-btn principal" autoFocus onClick={() => (ultimo ? cerrar(true) : setI(i + 1))}>
            {ultimo ? "Listo, a crear" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}
