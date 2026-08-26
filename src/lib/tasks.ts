import { differenceInCalendarDays, format, isValid } from "date-fns";
import { es } from "date-fns/locale";

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  /** Fecha límite en formato YYYY-MM-DD (sin hora ni zona horaria). */
  due_date: string | null;
  position: number;
  notify_email: boolean;
  reminder_sent_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  notify_email?: boolean;
}

export interface TaskMove {
  id: string;
  status: TaskStatus;
  position: number;
}

// ─── Metadatos de UI ──────────────────────────────────────────────────────────
export const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];

export const STATUS_META: Record<TaskStatus, { label: string; short: string; dot: string; badge: string; empty: string }> = {
  todo: {
    label: "Por hacer",
    short: "Por hacer",
    dot: "bg-zinc-400",
    badge: "bg-zinc-100 text-zinc-600",
    empty: "Nada pendiente. Crea tu primera tarea.",
  },
  in_progress: {
    label: "En progreso",
    short: "Haciendo",
    dot: "bg-primary",
    badge: "bg-primary/10 text-primary",
    empty: "Mueve aquí lo que estés haciendo ahora.",
  },
  done: {
    label: "Hecho",
    short: "Hecho",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-600",
    empty: "Aún no completas tareas. ¡Tú puedes!",
  },
};

export const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

export const PRIORITY_META: Record<TaskPriority, { label: string; dot: string; chip: string }> = {
  low:    { label: "Baja",  dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  medium: { label: "Media", dot: "bg-amber-500",   chip: "bg-amber-50 text-amber-700 border-amber-200" },
  high:   { label: "Alta",  dot: "bg-rose-500",    chip: "bg-rose-50 text-rose-700 border-rose-200" },
};

// ─── Navegación entre columnas ────────────────────────────────────────────────
export function nextStatus(status: TaskStatus): TaskStatus | null {
  const i = TASK_STATUSES.indexOf(status);
  return i >= 0 && i < TASK_STATUSES.length - 1 ? TASK_STATUSES[i + 1] : null;
}

export function prevStatus(status: TaskStatus): TaskStatus | null {
  const i = TASK_STATUSES.indexOf(status);
  return i > 0 ? TASK_STATUSES[i - 1] : null;
}

// ─── Orden y agrupación ───────────────────────────────────────────────────────
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) =>
    a.position - b.position || a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)
  );
}

export function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const grouped: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
  for (const task of sortTasks(tasks)) grouped[task.status]?.push(task);
  return grouped;
}

export function nextPosition(tasks: Task[], status: TaskStatus): number {
  let max = -1;
  for (const t of tasks) if (t.status === status && t.position > max) max = t.position;
  return max + 1;
}

/**
 * Calcula las filas que cambian al mover una tarea a `toStatus`.
 * - Sin `beforeId`: la tarea queda al final de la columna destino.
 * - Con `beforeId`: se inserta justo antes de esa tarea (sirve para reordenar
 *   dentro de la misma columna).
 * Devuelve solo las filas cuyo `status` o `position` cambian.
 */
export function computeMove(tasks: Task[], taskId: string, toStatus: TaskStatus, beforeId?: string | null): TaskMove[] {
  const moving = tasks.find((t) => t.id === taskId);
  if (!moving) return [];
  if (beforeId === taskId) return []; // soltar sobre sí misma: sin cambios

  const column = sortTasks(tasks.filter((t) => t.status === toStatus && t.id !== taskId));
  const idx = beforeId ? column.findIndex((t) => t.id === beforeId) : -1;
  if (idx === -1) column.push(moving);
  else column.splice(idx, 0, moving);

  const byId = new Map(tasks.map((t) => [t.id, t]));
  return column
    .map((t, position) => ({ id: t.id, status: toStatus, position }))
    .filter((u) => {
      const original = byId.get(u.id)!;
      return original.status !== u.status || original.position !== u.position;
    });
}

// ─── Fechas (solo día, sin zona horaria) ──────────────────────────────────────
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isValid(date) ? date : null;
}

export function toDateOnly(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function todayISO(now: Date = new Date()): string {
  return toDateOnly(now);
}

export function addDaysISO(days: number, now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  return toDateOnly(d);
}

export function daysUntilDue(task: Pick<Task, "due_date">, now: Date = new Date()): number | null {
  const due = parseDateOnly(task.due_date);
  return due ? differenceInCalendarDays(due, now) : null;
}

export function isOverdue(task: Pick<Task, "due_date" | "status">, now: Date = new Date()): boolean {
  if (task.status === "done") return false;
  const days = daysUntilDue(task, now);
  return days !== null && days < 0;
}

export function isDueToday(task: Pick<Task, "due_date">, now: Date = new Date()): boolean {
  return daysUntilDue(task, now) === 0;
}

export function formatDueLabel(due: string | null | undefined, now: Date = new Date()): string {
  const date = parseDateOnly(due);
  if (!date) return "";
  const days = differenceInCalendarDays(date, now);
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  if (days === -1) return "Ayer";
  if (days < -1) return `Hace ${Math.abs(days)} días`;
  if (days <= 6) return `En ${days} días`;
  return format(date, date.getFullYear() === now.getFullYear() ? "d MMM" : "d MMM yyyy", { locale: es });
}

// ─── Recordatorios ────────────────────────────────────────────────────────────
/** Tareas con aviso por correo que vencen hoy o están atrasadas y aún no se recordaron. */
export function tasksNeedingReminder(tasks: Task[], now: Date = new Date()): Task[] {
  return sortTasks(
    tasks.filter((t) => {
      if (!t.notify_email || t.status === "done" || t.reminder_sent_at) return false;
      const days = daysUntilDue(t, now);
      return days !== null && days <= 0;
    })
  );
}
