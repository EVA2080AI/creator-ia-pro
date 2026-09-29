import { useEffect } from "react";
import type { RefObject } from "react";

// Los botones "Copiar" que produce mdToHtml() (bloques de código y el
// preview de ```html) son HTML crudo inyectado vía dangerouslySetInnerHTML,
// así que nunca tuvieron onClick — no había ningún listener en ningún lado.
// Delegación de click sobre el contenedor scrolleable en vez de un handler
// por bloque, para que siga funcionando con mensajes que llegan después.
export function useCopyCodeButtons(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

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
    return () => el.removeEventListener("click", onClick);
  }, [ref]);
}
