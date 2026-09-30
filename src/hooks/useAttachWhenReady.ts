import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * Engancha `attach(el)` al elemento del ref apenas exista en el DOM.
 *
 * Un `useEffect(() => ..., [ref])` que lee `ref.current` una sola vez captura
 * null cuando el contenedor todavía no se montó (Basalt/Assistant/Arena
 * muestran un spinner mientras `authLoading` es true, sin el elemento del
 * ref) y nunca reintenta: la identidad del objeto ref no cambia cuando cambia
 * `ref.current`. Encontrado en vivo — dejó el botón "Copiar" y la vista previa
 * de HTML muertos hasta que se arregló. `attach` debe ser estable (función de
 * módulo) y devolver su cleanup.
 */
export function useAttachWhenReady(ref: RefObject<HTMLElement | null>, attach: (el: HTMLElement) => () => void) {
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (ref.current) {
      cleanup = attach(ref.current);
      return () => cleanup?.();
    }

    const waiter = new MutationObserver(() => {
      if (ref.current) {
        waiter.disconnect();
        cleanup = attach(ref.current);
      }
    });
    waiter.observe(document.body, { childList: true, subtree: true });
    return () => {
      waiter.disconnect();
      cleanup?.();
    };
  }, [ref, attach]);
}
