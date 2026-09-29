import { useEffect } from "react";
import type { RefObject } from "react";

// Los botones "Copiar" que produce mdToHtml() (bloques de código y el
// preview de ```html) son HTML crudo inyectado vía dangerouslySetInnerHTML,
// así que nunca tuvieron onClick — no había ningún listener en ningún lado.
// Delegación de click sobre el contenedor scrolleable en vez de un handler
// por bloque, para que siga funcionando con mensajes que llegan después.
export function useCopyCodeButtons(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const attach = (el: HTMLElement) => {
      const onClick = (e: MouseEvent) => {
        const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".md-copy-code");
        if (!btn) return;
        const raw = btn.dataset.code;
        if (raw == null) return;
        const original = btn.textContent;
        navigator.clipboard
          .writeText(decodeURIComponent(raw))
          .then(() => { btn.textContent = "Copiado ✓"; })
          .catch(() => { btn.textContent = "Error"; })
          .finally(() => { setTimeout(() => { btn.textContent = original; }, 1500); });
      };
      el.addEventListener("click", onClick);
      cleanup = () => el.removeEventListener("click", onClick);
    };

    if (ref.current) {
      attach(ref.current);
      return () => cleanup?.();
    }

    // El contenedor todavía no existe en el primer render (ej. mientras
    // authLoading es true se muestra un spinner en vez del chat real, sin
    // el elemento del ref) — verificado en vivo: sin este colchón, el
    // efecto corre una sola vez con ref.current en null y nunca reintenta
    // (la identidad de `ref` no cambia cuando cambia `ref.current`), así
    // que el botón "Copiar" quedaba decorativo para siempre. Se espera a
    // que el contenedor aparezca en el DOM antes de enganchar el listener.
    const waiter = new MutationObserver(() => {
      if (ref.current) {
        waiter.disconnect();
        attach(ref.current);
      }
    });
    waiter.observe(document.body, { childList: true, subtree: true });
    return () => {
      waiter.disconnect();
      cleanup?.();
    };
  }, [ref]);
}
