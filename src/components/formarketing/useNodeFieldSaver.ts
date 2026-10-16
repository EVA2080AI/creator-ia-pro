import { useCallback, useEffect, useRef } from 'react';
import { updateCanvasNode } from '@/lib/canvas-nodes';

// Guardado de campos de nodo con debounce: el lienzo se actualiza al instante
// (setNodes lo hace el componente) y la base recibe UN PATCH 600 ms después de
// la última tecla, con flush al desmontar. Antes lo tecleado dentro de Texto,
// LLM, Caption y Prompt Builder vivía solo en memoria y la recarga lo perdía —
// con el header prometiendo "Se guarda solo". Si el nodo aún no existe en la
// base (espacio recién fallido), el PATCH devuelve 404 silencioso y no rompe.
export function useNodeFieldSaver(id: string, data: Record<string, unknown>) {
  const dataRef = useRef(data);
  dataRef.current = data;
  const pendingRef = useRef<Record<string, unknown>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = () => {
    if (Object.keys(pendingRef.current).length === 0) return;
    const payload = { ...dataRef.current, ...pendingRef.current };
    const prompt = typeof pendingRef.current.prompt === 'string' ? pendingRef.current.prompt : undefined;
    pendingRef.current = {};
    void updateCanvasNode(id, { prompt, dataPayload: payload });
  };

  const flushRef = useRef(flush);
  flushRef.current = flush;

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    flushRef.current();
  }, [id]);

  return useCallback((fields: Record<string, unknown>) => {
    Object.assign(pendingRef.current, fields);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => flushRef.current(), 600);
  }, []);
}
