import { createContext, useContext } from "react";

// Antes la ejecución llegaba a los nodos inyectando `_context` dentro de
// `data` con un useEffect que dependía de funciones recreadas en cada render:
// efecto → setNodes → render → efecto… (bucle de CPU permanente, y además los
// nodos cargados de la base nunca recibían el contexto si el efecto no volvía
// a correr). Un React Context normal elimina la inyección y el bucle.
export interface CanvasExec {
  executeNode: (id: string) => Promise<void>;
  executeUpstream: (id: string) => Promise<void>;
}

export const CanvasExecContext = createContext<CanvasExec | null>(null);

export const useCanvasExec = () => useContext(CanvasExecContext);
