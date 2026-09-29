import { useEffect, useRef } from "react";
import type { RefObject } from "react";

// Complemento de htmlPreviewHtml() (src/lib/markdown.ts): DOMPurify le saca
// el atributo srcdoc a cualquier iframe sin excepción, así que el código
// real vive escapado como texto en el <pre><code> hermano y se copia acá a
// la propiedad `.srcdoc` del iframe por JS, evitando el sanitizador.
// MutationObserver en vez de un efecto atado a los mensajes: el contenido
// llega vía dangerouslySetInnerHTML, no vía props que React pueda observar.
// Debounce de 400ms porque durante el streaming el bloque se re-renderiza
// varias veces por segundo (texto todavía incompleto) — solo interesa
// hidratar una vez que se asienta.
export function useHtmlPreviewFrames(ref: RefObject<HTMLElement | null>) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const hydrate = () => {
      el.querySelectorAll<HTMLIFrameElement>(".md-preview-frame").forEach((iframe) => {
        const code = iframe.parentElement?.querySelector<HTMLElement>(".md-preview-code pre code")?.textContent;
        if (code != null && iframe.srcdoc !== code) iframe.srcdoc = code;
      });
    };

    hydrate();
    const observer = new MutationObserver(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(hydrate, 400);
    });
    observer.observe(el, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [ref]);
}
