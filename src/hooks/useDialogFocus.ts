import { useEffect, type RefObject } from "react";

// Comportamiento de diálogo para los overlays hechos a mano (la guía rápida y el
// recorrido guiado): sin esto, Tab seguía recorriendo la página OSCURECIDA de atrás
// — un teclado podía "escribirle" al chat tapado por el telón — y al cerrar, el foco
// se perdía en <body> en vez de volver al botón que abrió.
//
// Los diálogos de shadcn (Radix) ya hacen todo esto solos; este hook es para los dos
// overlays propios, que no usan Radix porque pintan sobre coordenadas de la página.

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function useDialogFocus(container: RefObject<HTMLElement | null>, open: boolean, onClose?: () => void) {
  useEffect(() => {
    if (!open) return;
    const previo = document.activeElement as HTMLElement | null;

    // El foco entra al diálogo: al elemento marcado o al primero enfocable.
    requestAnimationFrame(() => {
      const el = container.current;
      if (!el || el.contains(document.activeElement)) return;
      const objetivo = el.querySelector<HTMLElement>("[data-autofocus]") ?? el.querySelector<HTMLElement>(FOCUSABLE);
      objetivo?.focus();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const el = container.current;
      if (!el) return;
      const enfocables = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((f) => f.offsetParent !== null || f.getClientRects().length > 0);
      if (!enfocables.length) return;
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      const dentro = el.contains(document.activeElement);
      // Ciclo: del último al primero, del primero al último, y si el foco se escapó
      // de alguna forma, se trae de vuelta.
      if (!dentro) { e.preventDefault(); primero.focus(); return; }
      if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    };

    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      // Devolver el foco a quien abrió (si sigue en el documento).
      if (previo && document.contains(previo)) previo.focus();
    };
  }, [container, open, onClose]);
}
