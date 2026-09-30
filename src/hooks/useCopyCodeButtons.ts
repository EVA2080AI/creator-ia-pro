import type { RefObject } from "react";
import { useAttachWhenReady } from "./useAttachWhenReady";

// Los botones "Copiar" que produce mdToHtml() (bloques de código y las
// pestañas de un proyecto) son HTML crudo inyectado vía
// dangerouslySetInnerHTML, así que nunca tuvieron onClick. Delegación de click
// sobre el contenedor de mensajes en vez de un handler por bloque, para que
// siga funcionando con mensajes que llegan después. Los bloques sueltos
// guardan el código en data-code; las pestañas de proyecto no (duplicaría el
// tamaño) y se leen de su propio <pre><code>.
function attachCopyButtons(el: HTMLElement): () => void {
  const onClick = (e: MouseEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".md-copy-code");
    if (!btn) return;
    const raw = btn.dataset.code;
    const text = raw != null ? decodeURIComponent(raw) : btn.closest(".md-proj-pane")?.querySelector("pre code")?.textContent;
    if (text == null) return;
    const original = btn.textContent;
    navigator.clipboard
      .writeText(text)
      .then(() => { btn.textContent = "Copiado ✓"; })
      .catch(() => { btn.textContent = "Error"; })
      .finally(() => { setTimeout(() => { btn.textContent = original; }, 1500); });
  };
  el.addEventListener("click", onClick);
  return () => el.removeEventListener("click", onClick);
}

export function useCopyCodeButtons(ref: RefObject<HTMLElement | null>) {
  useAttachWhenReady(ref, attachCopyButtons);
}
