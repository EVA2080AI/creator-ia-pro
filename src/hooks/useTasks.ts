import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  computeMove, nextPosition, sortTasks,
  type Task, type TaskInput, type TaskStatus,
} from "@/lib/tasks";

// /api/tasks devuelve filas de Drizzle (camelCase) — se traducen a la forma
// snake_case de `Task` (src/lib/tasks.ts) para no tocar TaskCard/TaskColumn/TaskSheet.
interface ApiTask {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  position: number;
  notifyEmail: boolean;
  reminderSentAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function fromApi(t: ApiTask): Task {
  return {
    id: t.id, user_id: t.userId, title: t.title, description: t.description,
    status: t.status, priority: t.priority, due_date: t.dueDate, position: t.position,
    notify_email: t.notifyEmail, reminder_sent_at: t.reminderSentAt, completed_at: t.completedAt,
    created_at: t.createdAt, updated_at: t.updatedAt,
  };
}

async function api<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; error?: string; data?: T }> {
  try {
    const res = await fetch(path, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    const json = await res.json();
    if (!res.ok || !json.ok) return { ok: false, error: json.error || `Error ${res.status}` };
    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de red" };
  }
}

/**
 * useTasks — CRUD de tareas con actualizaciones optimistas.
 * Todas las operaciones devuelven `true/false` (o la tarea) y muestran un toast si fallan.
 */
export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tasksRef = useRef<Task[]>([]);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const res = await api<{ tasks: ApiTask[] }>("/api/tasks");
    if (!res.ok) {
      setError(res.error!);
      toast.error("No se pudieron cargar las tareas", { description: res.error });
    } else {
      setTasks(sortTasks((res.data!.tasks || []).map(fromApi)));
      setError(null);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) load();
    else { setTasks([]); setLoading(false); }
  }, [userId, load]);

  const createTask = useCallback(async (input: TaskInput): Promise<Task | null> => {
    if (!userId) return null;
    const status: TaskStatus = input.status ?? "todo";
    const now = new Date().toISOString();
    const optimisticId = crypto.randomUUID();
    const optimistic: Task = {
      id: optimisticId,
      user_id: userId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status,
      priority: input.priority ?? "medium",
      due_date: input.due_date || null,
      position: nextPosition(tasksRef.current, status),
      notify_email: !!input.notify_email,
      reminder_sent_at: null,
      completed_at: status === "done" ? now : null,
      created_at: now,
      updated_at: now,
    };
    setTasks((prev) => [...prev, optimistic]);

    const res = await api<{ task: ApiTask }>("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: optimistic.title,
        description: optimistic.description,
        status: optimistic.status,
        priority: optimistic.priority,
        dueDate: optimistic.due_date,
        position: optimistic.position,
        notifyEmail: optimistic.notify_email,
      }),
    });

    if (!res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== optimisticId));
      toast.error("No se pudo crear la tarea", { description: res.error });
      return null;
    }
    const saved = fromApi(res.data!.task);
    setTasks((prev) => prev.map((t) => (t.id === optimisticId ? saved : t)));
    return saved;
  }, [userId]);

  const updateTask = useCallback(async (id: string, patch: Partial<TaskInput>): Promise<boolean> => {
    const before = tasksRef.current.find((t) => t.id === id);
    if (!before) return false;
    const now = new Date().toISOString();
    const clean: Partial<Task> = {};
    if (patch.title !== undefined) clean.title = patch.title.trim();
    if (patch.description !== undefined) clean.description = patch.description?.trim() || null;
    if (patch.status !== undefined) clean.status = patch.status;
    if (patch.priority !== undefined) clean.priority = patch.priority;
    if (patch.due_date !== undefined) clean.due_date = patch.due_date || null;
    if (patch.notify_email !== undefined) clean.notify_email = patch.notify_email;
    if (clean.status && clean.status !== before.status) {
      clean.position = nextPosition(tasksRef.current, clean.status);
      clean.completed_at = clean.status === "done" ? now : null;
    }
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...clean, updated_at: now } : t)));

    const res = await api<{ task: ApiTask }>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: clean.title, description: clean.description, status: clean.status,
        priority: clean.priority, dueDate: clean.due_date, position: clean.position,
        notifyEmail: clean.notify_email,
      }),
    });
    if (!res.ok) {
      setTasks((prev) => prev.map((t) => (t.id === id ? before : t)));
      toast.error("No se pudo guardar la tarea", { description: res.error });
      return false;
    }
    setTasks((prev) => prev.map((t) => (t.id === id ? fromApi(res.data!.task) : t)));
    return true;
  }, []);

  const moveTask = useCallback(async (id: string, toStatus: TaskStatus, beforeId?: string | null): Promise<boolean> => {
    const snapshot = tasksRef.current;
    const updates = computeMove(snapshot, id, toStatus, beforeId);
    if (updates.length === 0) return true;
    const now = new Date().toISOString();

    setTasks((prev) =>
      sortTasks(prev.map((t) => {
        const u = updates.find((x) => x.id === t.id);
        if (!u) return t;
        return {
          ...t,
          status: u.status,
          position: u.position,
          completed_at: u.status === "done" ? (t.completed_at ?? now) : null,
          updated_at: now,
        };
      }))
    );

    const res = await api("/api/tasks", { method: "POST", body: JSON.stringify({ action: "move", updates }) });
    if (!res.ok) {
      setTasks(snapshot);
      toast.error("No se pudo mover la tarea", { description: res.error });
      return false;
    }
    return true;
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    const snapshot = tasksRef.current;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const res = await api(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setTasks(snapshot);
      toast.error("No se pudo eliminar la tarea", { description: res.error });
      return false;
    }
    return true;
  }, []);

  const deleteDone = useCallback(async (): Promise<number> => {
    const snapshot = tasksRef.current;
    const ids = snapshot.filter((t) => t.status === "done").map((t) => t.id);
    if (ids.length === 0) return 0;
    setTasks((prev) => prev.filter((t) => t.status !== "done"));
    const res = await api<{ deleted: number }>("/api/tasks", { method: "POST", body: JSON.stringify({ action: "clear-done" }) });
    if (!res.ok) {
      setTasks(snapshot);
      toast.error("No se pudieron limpiar las tareas", { description: res.error });
      return 0;
    }
    return res.data!.deleted;
  }, []);

  const markReminded = useCallback(async (ids: string[]): Promise<void> => {
    if (ids.length === 0) return;
    const at = new Date().toISOString();
    setTasks((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, reminder_sent_at: at } : t)));
    const res = await api("/api/tasks", { method: "POST", body: JSON.stringify({ action: "mark-reminded", ids }) });
    if (!res.ok) console.warn("[useTasks] No se pudo marcar el recordatorio:", res.error);
  }, []);

  return { tasks, loading, error, refresh: load, createTask, updateTask, moveTask, deleteTask, deleteDone, markReminded };
}
