import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import { supabase } from "@/integrations/supabase/client";

export interface CanvasNodeData {
  dbId: string;
  type: "image" | "video";
  prompt: string;
  assetUrl: string | null;
  status: "loading" | "ready" | "error";
  errorMessage: string | null;
  dataPayload: Record<string, unknown>;
  [key: string]: unknown;
}

interface CanvasState {
  nodes: Node<CanvasNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  generating: boolean;

  // Actions
  setNodes: (nodes: Node<CanvasNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange<Node<CanvasNodeData>>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  setSelectedNode: (id: string | null) => void;
  setGenerating: (v: boolean) => void;
  updateNodeData: (id: string, data: Partial<CanvasNodeData>) => void;
  addNodeToStore: (node: Node<CanvasNodeData>) => void;
  removeNode: (id: string) => void;

  // Debounced position persistence
  _positionTimers: Record<string, ReturnType<typeof setTimeout>>;
  persistPosition: (nodeId: string, x: number, y: number) => void;

  // Debounced data_payload persistence
  _payloadTimers: Record<string, ReturnType<typeof setTimeout>>;
  persistPayload: (nodeId: string, payload: Record<string, unknown>) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  generating: false,
  _positionTimers: {},
  _payloadTimers: {},

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) as Node<CanvasNodeData>[] });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setGenerating: (v) => set({ generating: v }),

  updateNodeData: (id, data) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    });
  },

  addNodeToStore: (node) => set({ nodes: [...get().nodes, node] }),

  removeNode: (id) => {
    set({ nodes: get().nodes.filter((n) => n.id !== id) });
    if (get().selectedNodeId === id) set({ selectedNodeId: null });
  },

  persistPosition: (nodeId, x, y) => {
    const timers = get()._positionTimers;
    if (timers[nodeId]) clearTimeout(timers[nodeId]);
    timers[nodeId] = setTimeout(async () => {
      await supabase
        .from("canvas_nodes")
        .update({ pos_x: x, pos_y: y })
        .eq("id", nodeId);
    }, 500);
    set({ _positionTimers: timers });
  },

  persistPayload: (nodeId, payload) => {
    const timers = get()._payloadTimers;
    if (timers[nodeId]) clearTimeout(timers[nodeId]);
    timers[nodeId] = setTimeout(async () => {
      await supabase
        .from("canvas_nodes")
        .update({ data_payload: payload } as any)
        .eq("id", nodeId);
    }, 800);
    set({ _payloadTimers: timers });
  },
}));
