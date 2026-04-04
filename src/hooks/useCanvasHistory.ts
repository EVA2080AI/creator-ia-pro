import { useState, useCallback, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';

/**
 * Hook to manage history (Undo/Redo) for ReactFlow nodes/edges.
 * Uses a manual stack to store snapshots.
 */
export function useCanvasHistory() {
  const [undoStack, setUndoStack] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);

  const takeSnapshot = useCallback((nodes: Node[], edges: Edge[]) => {
    // We store a deep copy to prevent reference issues
    const snapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };

    setUndoStack((prev) => {
      // Limit history to 50 steps to save memory
      const next = [...prev, snapshot];
      return next.length > 50 ? next.slice(1) : next;
    });
    setRedoStack([]); // New action clears redo
  }, []);

  const undo = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      if (undoStack.length === 0) return null;

      const previous = undoStack[undoStack.length - 1];
      const newUndo = undoStack.slice(0, -1);

      // Current state goes to redo stack
      setRedoStack((prev) => [...prev, { nodes: JSON.parse(JSON.stringify(currentNodes)), edges: JSON.parse(JSON.stringify(currentEdges)) }]);
      setUndoStack(newUndo);

      return previous;
    },
    [undoStack]
  );

  const redo = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      if (redoStack.length === 0) return null;

      const next = redoStack[redoStack.length - 1];
      const newRedo = redoStack.slice(0, -1);

      // Current state goes to undo stack
      setUndoStack((prev) => [...prev, { nodes: JSON.parse(JSON.stringify(currentNodes)), edges: JSON.parse(JSON.stringify(currentEdges)) }]);
      setRedoStack(newRedo);

      return next;
    },
    [redoStack]
  );

  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    takeSnapshot,
    undo,
    redo,
    clearHistory,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}
