import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTasks } from "@/hooks/useTasks";
import { sendEmail, toEmailTask } from "@/services/email-service";
import {
  STATUS_META, TASK_STATUSES, groupTasksByStatus, isOverdue, nextStatus, prevStatus, tasksNeedingReminder,
  type Task, type TaskInput, type TaskStatus,
} from "@/lib/tasks";
import { TaskColumn, type ColumnDnd } from "@/components/tasks/TaskColumn";
import { TaskSheet } from "@/components/tasks/TaskSheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SheetState {
  open: boolean;
  mode: "create" | "edit";
  task: Task | null;
  status: TaskStatus;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * Tareas — tablero Kanban personal (Por hacer · En progreso · Hecho).
 * Móvil: una columna a la vez, deslizar para cambiar, botón flotante para crear,
 *        hoja inferior para editar. Escritorio: tres columnas con arrastrar y soltar.
 * Correo (Resend): confirmación al crear, aviso al completar, recordatorio al vencer
 *        y "enviar tarea" a cualquier dirección.
 */
export default function Tasks() {
  const { user, loading: authLoading } = useAuth("/auth");
  const isMobile = useIsMobile();
  const { tasks, loading, refresh, createTask, updateTask, moveTask, deleteTask, deleteDone, markReminded } = useTasks(user?.id);

  const grouped = useMemo(() => groupTasksByStatus(tasks), [tasks]);
  const pendingCount = grouped.todo.length + grouped.in_progress.length;
  const overdueCount = useMemo(() => tasks.filter((t) => isOverdue(t)).length, [tasks]);

  const [active, setActive] = useState<TaskStatus>("todo");
  const [direction, setDirection] = useState(0);
  const [sheet, setSheet] = useState<SheetState>({ open: false, mode: "create", task: null, status: "todo" });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const reminderRan = useRef(false);

  // ── Recordatorio por correo: tareas con aviso que vencen hoy o están atrasadas (una vez por visita) ──
  useEffect(() => {
    if (loading || reminderRan.current || !user) return;
    const due = tasksNeedingReminder(tasks);
    if (due.length === 0) return;
    reminderRan.current = true;
    (async () => {
      const res = await sendEmail({ template: "task_reminder", tasks: due.map(toEmailTask) });
      if (res.ok) {
        await markReminded(due.map((t) => t.id));
        toast.success("Recordatorio enviado a tu correo", {
          description: `${due.length} ${plural(due.length, "tarea vence", "tareas vencen")} hoy o ${plural(due.length, "está atrasada", "están atrasadas")}.`,
        });
      } else if (res.code === "NOT_CONFIGURED") {
        console.warn("[tasks] Correo no configurado:", res.error);
      } else {
        toast.error("No se pudo enviar el recordatorio", { description: res.error });
      }
    })();
  }, [loading, tasks, user, markReminded]);

  // ── Navegación de columnas (móvil) ──
  const goTo = useCallback((status: TaskStatus) => {
    setDirection((prev) => {
      const delta = TASK_STATUSES.indexOf(status) - TASK_STATUSES.indexOf(active);
      return delta === 0 ? prev : Math.sign(delta);
    });
    setActive(status);
  }, [active]);

  const onSwipeEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipe = info.offset.x + info.velocity.x * 0.2;
    if (swipe < -70) { const n = nextStatus(active); if (n) goTo(n); }
    else if (swipe > 70) { const p = prevStatus(active); if (p) goTo(p); }
  };

  // ── Hoja de edición ──
  const openCreate = useCallback((status?: TaskStatus) => setSheet({ open: true, mode: "create", task: null, status: status ?? active }), [active]);
  const openEdit = useCallback((task: Task) => setSheet({ open: true, mode: "edit", task, status: task.status }), []);
  const setSheetOpen = useCallback((open: boolean) => setSheet((s) => ({ ...s, open })), []);

  // ── Correo ──
  const notify = useCallback(async (template: "task_created" | "task_completed", task: Task) => {
    const res = await sendEmail({ template, task: toEmailTask(task) });
    if (res.ok) {
      toast.success(template === "task_created" ? "Confirmación enviada a tu correo" : "Aviso de tarea completada enviado", { description: res.to });
    } else if (res.code === "NOT_CONFIGURED") {
      toast.warning("Correo no configurado", { description: res.error });
    } else {
      toast.error("No se pudo enviar el correo", { description: res.error });
    }
  }, []);

  // ── Acciones ──
  const handleSubmit = useCallback(async (values: TaskInput): Promise<boolean> => {
    if (sheet.mode === "create") {
      const created = await createTask(values);
      if (!created) return false;
      toast.success("Tarea creada");
      if (created.notify_email) void notify("task_created", created);
      if (isMobile && created.status !== active) goTo(created.status);
      return true;
    }
    if (!sheet.task) return false;
    const wasDone = sheet.task.status === "done";
    const ok = await updateTask(sheet.task.id, values);
    if (ok) {
      toast.success("Tarea guardada");
      if (values.notify_email && values.status === "done" && !wasDone) {
        void notify("task_completed", { ...sheet.task, ...values, status: "done" } as Task);
      }
    }
    return ok;
  }, [sheet, createTask, updateTask, notify, isMobile, active, goTo]);

  const handleMove = useCallback(async (task: Task, to: TaskStatus, beforeId: string | null = null) => {
    if (task.status === to && !beforeId) return;
    const ok = await moveTask(task.id, to, beforeId);
    if (ok && to === "done" && task.status !== "done") {
      toast.success("¡Tarea completada!", { description: task.title });
      if (task.notify_email) void notify("task_completed", { ...task, status: "done" });
    }
  }, [moveTask, notify]);

  const handleToggleDone = useCallback((task: Task) => {
    void handleMove(task, task.status === "done" ? "todo" : "done");
  }, [handleMove]);

  const handleDelete = useCallback(async (task: Task) => {
    const ok = await deleteTask(task.id);
    if (ok) toast.success("Tarea eliminada");
    return ok;
  }, [deleteTask]);

  const handleShare = useCallback(async (task: Task, to: string, message: string) => {
    const res = await sendEmail({ template: "task_share", to, message, task: toEmailTask(task) });
    if (res.ok) { toast.success("Tarea enviada por correo", { description: to }); return true; }
    toast.error("No se pudo enviar el correo", { description: res.error });
    return false;
  }, []);

  const handleClearDone = useCallback(async () => {
    const n = await deleteDone();
    if (n > 0) toast.success(`${n} ${plural(n, "tarea eliminada", "tareas eliminadas")}`);
    setClearOpen(false);
  }, [deleteDone]);

  // ── Arrastrar y soltar (solo escritorio) ──
  const dnd: ColumnDnd | undefined = isMobile ? undefined : {
    draggingId,
    onDragStart: (e, task) => {
      e.dataTransfer.setData("text/plain", task.id);
      e.dataTransfer.effectAllowed = "move";
      setDraggingId(task.id);
    },
    onDragEnd: () => setDraggingId(null),
    onDrop: (e, status, beforeId) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain") || draggingId;
      setDraggingId(null);
      const task = id ? tasks.find((t) => t.id === id) : undefined;
      if (task) void handleMove(task, status, beforeId);
    },
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const columnHandlers = { onAdd: openCreate, onOpen: openEdit, onMove: handleMove, onToggleDone: handleToggleDone };

  return (
    <>
      <Helmet><title>Tareas | Creator IA Pro</title></Helmet>

      <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-16 md:pt-8 pb-32 md:pb-16 font-sans">
        {/* Encabezado */}
        <header className="mb-5 md:mb-8 flex items-end justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.25em] font-display">Productividad</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight font-display text-zinc-900 leading-none">
              Tus <span className="text-primary italic font-medium pr-1">Tareas</span>
            </h1>
            <p className="text-[12px] md:text-[13px] text-zinc-500 font-medium leading-relaxed">
              {tasks.length === 0 ? (
                "Un tablero simple: por hacer, en progreso y hecho."
              ) : (
                <>
                  {pendingCount} {plural(pendingCount, "pendiente", "pendientes")} · {grouped.done.length} {plural(grouped.done.length, "hecha", "hechas")}
                  {overdueCount > 0 && (
                    <span className="text-rose-500 font-bold"> · {overdueCount} {plural(overdueCount, "atrasada", "atrasadas")}</span>
                  )}
                </>
              )}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void refresh()}
              aria-label="Actualizar"
              className="w-11 h-11 rounded-2xl border border-zinc-200 bg-white text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition-all"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button
              type="button"
              onClick={() => openCreate("todo")}
              className="flex items-center gap-3 px-6 h-12 bg-zinc-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-transform active:scale-95 shadow-lg shadow-zinc-900/10 hover:bg-zinc-800 font-display"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva tarea</span>
            </button>
          </div>
        </header>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-4">
            {TASK_STATUSES.map((s) => (
              <div key={s} className="h-[260px] md:h-[60vh] rounded-[1.75rem] bg-zinc-100/70 animate-pulse" />
            ))}
          </div>
        ) : isMobile ? (
          <>
            {/* Selector de columna */}
            <div role="tablist" aria-label="Columnas" className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-white border border-zinc-200/70 shadow-[0_8px_30px_-14px_rgba(0,0,0,0.18)] mb-4">
              {TASK_STATUSES.map((s) => {
                const isActive = s === active;
                return (
                  <button
                    key={s}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => goTo(s)}
                    className={cn(
                      "h-11 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all",
                      isActive ? "bg-zinc-900 text-white shadow-md" : "text-zinc-500 active:bg-zinc-100"
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-white/80" : STATUS_META[s].dot)} />
                    {STATUS_META[s].short}
                    <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] tabular-nums", isActive ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-500")}>
                      {grouped[s].length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Columna activa con deslizamiento */}
            <div className="relative overflow-hidden -mx-1 px-1">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={active}
                  custom={direction}
                  initial={{ x: direction * 60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: direction * -60, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                  drag="x"
                  dragDirectionLock
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.18}
                  onDragEnd={onSwipeEnd}
                >
                  <TaskColumn status={active} tasks={grouped[active]} showHeader={false} {...columnHandlers} />
                </motion.div>
              </AnimatePresence>
              {active === "done" && grouped.done.length > 0 && (
                <button
                  type="button"
                  onClick={() => setClearOpen(true)}
                  className="mt-3 w-full h-11 rounded-2xl border border-zinc-200 bg-white text-[11px] font-black uppercase tracking-widest text-zinc-500 active:bg-rose-50 active:text-rose-500 transition-colors"
                >
                  Limpiar completadas
                </button>
              )}
              <p className="mt-3 text-center text-[10px] text-zinc-400 font-medium">
                Desliza para cambiar de columna · Toca una tarea para editarla
              </p>
            </div>
          </>
        ) : (
          <div className="grid md:grid-cols-3 gap-4 items-start">
            {TASK_STATUSES.map((s) => (
              <TaskColumn
                key={s}
                status={s}
                tasks={grouped[s]}
                showHeader
                {...columnHandlers}
                dnd={dnd}
                onClearDone={s === "done" ? () => setClearOpen(true) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Botón flotante (móvil) */}
      {isMobile && !sheet.open && !loading && (
        <button
          type="button"
          onClick={() => openCreate(active)}
          aria-label="Nueva tarea"
          className="md:hidden fixed right-4 z-40 w-14 h-14 rounded-full bg-zinc-900 text-white shadow-[0_12px_30px_-8px_rgba(0,0,0,0.45)] flex items-center justify-center active:scale-95 transition-transform"
          style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>
      )}

      <TaskSheet
        open={sheet.open}
        onOpenChange={setSheetOpen}
        mode={sheet.mode}
        task={sheet.task}
        defaultStatus={sheet.status}
        userEmail={user?.email}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        onShare={handleShare}
      />

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent className="rounded-[2rem] border-zinc-200 max-w-[calc(100vw-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black tracking-tight">¿Eliminar las tareas completadas?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán {grouped.done.length} {plural(grouped.done.length, "tarea", "tareas")} de la columna “Hecho”. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl h-11">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleClearDone()} className="rounded-xl h-11 bg-rose-600 hover:bg-rose-700 text-white">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
