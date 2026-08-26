// Reemplaza el trigger `tasks_set_completed_at` de la migración de Supabase
// (nunca se portó a Neon): mismo comportamiento, como función de aplicación.
export type TaskStatusValue = "todo" | "in_progress" | "done";

export function computeCompletedAt(
  oldStatus: TaskStatusValue | null,
  newStatus: TaskStatusValue,
  oldCompletedAt: Date | null,
): Date | null {
  if (newStatus === "done") {
    return oldStatus === "done" ? oldCompletedAt : new Date();
  }
  return null;
}
