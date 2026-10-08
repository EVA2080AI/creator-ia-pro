import { useEffect, useState } from "react";

// Cuándo "Enter" (sin Shift) envía el prompt vs. hace un salto de línea nativo.
// En desktop con teclado físico es intuitivo que Enter envíe (chat, Slack); en
// móvil táctil el usuario espera salto de línea y pulsa el botón de enviar
// (WhatsApp, iMessage), y el "Return" del teclado virtual confunde si de
// repente dispara el envío. Dos salvedades independientes:
//   - Shift+Enter nunca envía (deja salto de línea en los dos modos).
//   - Un teclado IME activo (chino/japonés) usa Enter para CONFIRMAR el
//     carácter; `isComposing` nos avisa y jamás disparamos envío en ese estado.
export function shouldSubmitOnEnter(
  e: Pick<KeyboardEvent, "key" | "shiftKey" | "isComposing">,
  prefersClickSubmit: boolean,
): boolean {
  if (e.key !== "Enter" || e.shiftKey || e.isComposing) return false;
  return !prefersClickSubmit;
}

/** `true` en pantallas táctiles sin ratón — el textarea entonces hace salto de
 *  línea con Enter y espera que el usuario pulse el botón de enviar. */
export function usePrefersClickSubmit(): boolean {
  const [v, setV] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
    const update = () => setV(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return v;
}
