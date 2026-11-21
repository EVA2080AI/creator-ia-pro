import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CANVAS_OPEN_EVENT, WHOLE_MESSAGE, docArtifact, extractArtifacts, setCanvasTarget,
  type CanvasArtifact, type CanvasTarget,
} from "@/lib/canvas";

// Qué hay abierto en el Canvas de un chat y de dónde sale. El panel no guarda una copia
// del código: guarda a QUÉ artefacto de QUÉ mensaje apunta y lo lee del hilo, así que
// mientras el modelo escribe el Canvas se actualiza solo.

interface Msg { id: string; role: string; text: string }
export interface CanvasVersion extends CanvasTarget { artifact: CanvasArtifact }

// Los mensajes ya terminados no cambian de objeto: se parten en artefactos una sola vez.
const cache = new WeakMap<object, { text: string; arts: CanvasArtifact[] }>();
function artifactsOf(m: Msg): CanvasArtifact[] {
  const hit = cache.get(m);
  if (hit && hit.text === m.text) return hit.arts;
  const arts = m.role === "model" ? extractArtifacts(m.text) : [];
  cache.set(m, { text: m.text, arts });
  return arts;
}

/** Ancho desde el que el Canvas cabe AL LADO del chat; por debajo ocupa la pantalla y no se abre solo. */
const AUTO_OPEN_MIN_WIDTH = 1100;

export function useCanvas(messages: Msg[], generating: boolean) {
  const [target, setTarget] = useState<CanvasTarget | null>(null);
  const autoFor = useRef<string | null>(null);
  const last = messages[messages.length - 1];

  // Las tarjetas del chat (HTML crudo) necesitan saber cuál está abierta para no pintarla dos veces.
  useEffect(() => { setCanvasTarget(target); }, [target]);
  useEffect(() => () => setCanvasTarget(null), []);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<CanvasTarget | null>).detail;
      if (d?.msgId) setTarget({ msgId: d.msgId, index: d.index });
    };
    window.addEventListener(CANVAS_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CANVAS_OPEN_EVENT, onOpen);
  }, []);

  // Como en Gemini o ChatGPT: cuando la respuesta trae algo que se puede ver, el Canvas se
  // abre solo —una vez por respuesta—. Si el usuario lo cierra, no vuelve a abrirse para esa.
  useEffect(() => {
    if (!generating || !last || last.role !== "model" || autoFor.current === last.id) return;
    if (!last.text.includes("```") || !window.matchMedia?.(`(min-width: ${AUTO_OPEN_MIN_WIDTH}px)`).matches) return;
    if (!artifactsOf(last).length) return;
    autoFor.current = last.id;
    setTarget({ msgId: last.id, index: 0 });
  }, [generating, last]);

  // El mensaje ya no está (otra conversación, se regeneró, chat nuevo): el Canvas se cierra.
  useEffect(() => {
    if (target && !messages.some((m) => m.id === target.msgId)) setTarget(null);
  }, [messages, target]);

  const message = target ? messages.find((m) => m.id === target.msgId) : undefined;
  const artifact = useMemo<CanvasArtifact | null>(() => {
    if (!target || !message) return null;
    return target.index === WHOLE_MESSAGE ? docArtifact(message.text) : artifactsOf(message)[target.index] ?? null;
  }, [target, message]);

  const versions = useMemo<CanvasVersion[]>(
    () => messages.flatMap((m) => artifactsOf(m).map((a, index) => ({ msgId: m.id, index, artifact: a }))),
    [messages],
  );

  const close = useCallback(() => setTarget(null), []);

  return {
    target: artifact ? target : null,
    artifact,
    /** El modelo todavía está escribiendo justo lo que el Canvas muestra. */
    streaming: generating && !!target && target.msgId === last?.id,
    versions,
    open: setTarget,
    close,
  };
}
