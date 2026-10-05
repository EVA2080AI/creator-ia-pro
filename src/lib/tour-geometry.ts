// Geometría del recorrido guiado: dónde va el recuadro que resalta el control y dónde
// la tarjeta que lo explica. Separado del componente porque es lo único con casos
// traicioneros (objetivo pegado a un borde, tarjeta que no cabe debajo, pantallas de
// 390px) y así se prueba sin montar un DOM.

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Margen entre el control real y el anillo que lo resalta. */
export const HALO = 6;

/** El recuadro del resaltado: el control más su halo, sin salirse de la pantalla. */
export function haloRect(target: Rect, vw: number, vh: number): Rect {
  const top = Math.max(4, target.top - HALO);
  const left = Math.max(4, target.left - HALO);
  return {
    top,
    left,
    width: Math.min(target.width + HALO * 2, vw - left - 4),
    height: Math.min(target.height + HALO * 2, vh - top - 4),
  };
}

export interface TooltipPlacement {
  top: number;
  left: number;
  width: number;
  /** Dónde quedó respecto del objetivo (para la flechita y para las pruebas). */
  side: "abajo" | "arriba";
}

/**
 * Coloca la tarjeta: debajo del objetivo si cabe, si no encima; y siempre dentro de la
 * pantalla con 12px de margen. `tipHeight` es la altura ya medida (o estimada) de la
 * tarjeta.
 */
export function placeTooltip(target: Rect, tipHeight: number, vw: number, vh: number): TooltipPlacement {
  const width = Math.min(340, vw - 24);
  const abajo = target.top + target.height + HALO + 12;
  const cabeAbajo = abajo + tipHeight <= vh - 12;
  const top = cabeAbajo
    ? abajo
    : Math.max(12, target.top - HALO - 12 - tipHeight);

  // Centrada respecto del objetivo, sin salirse por los lados.
  const centro = target.left + target.width / 2;
  const left = Math.min(Math.max(12, centro - width / 2), vw - 12 - width);

  return { top, left, width, side: cabeAbajo ? "abajo" : "arriba" };
}
