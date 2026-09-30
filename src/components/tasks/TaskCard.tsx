import { memo } from "react";
import type { DragEvent, KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, GripVertical, Mail, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PRIORITY_META, STATUS_META, formatDueLabel, isDueToday, isOverdue, nextStatus, prevStatus,
  type Task, type TaskStatus,
} from "@/lib/tasks";

export interface TaskCardProps {
  task: Task;
  onOpen: (task: Task) => void;
  onMove: (task: Task, to: TaskStatus) => void;
  onToggleDone: (task: Task) => void;
  /** Solo escritorio: habilita arrastrar la tarjeta entre columnas. */
  draggable?: boolean;
  dragging?: boolean;
  onDragStart?: (e: DragEvent<HTMLDivElement>, task: Task) => void;
  onDragEnd?: () => void;
  onDropBefore?: (e: DragEvent<HTMLDivElement>, task: Task) => void;
}

export const TaskCard = memo(function TaskCard({
  task, onOpen, onMove, onToggleDone, draggable = false, dragging = false, onDragStart, onDragEnd, onDropBefore,
}: TaskCardProps) {
  const done = task.status === "done";
  const overdue = isOverdue(task);
  const dueToday = isDueToday(task);
  const dueLabel = formatDueLabel(task.due_date);
  const prev = prevStatus(task.status);
  const next = nextStatus(task.status);
  const priority = PRIORITY_META[task.priority];

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(task); }
    if (e.key === "ArrowRight" && next) { e.preventDefault(); onMove(task, next); }
    if (e.key === "ArrowLeft" && prev) { e.preventDefault(); onMove(task, prev); }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      onDragStart={draggable && onDragStart ? (e) => onDragStart(e, task) : undefined}
      onDragEnd={onDragEnd}
      onDragOver={onDropBefore ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; } : undefined}
      onDrop={onDropBefore ? (e) => onDropBefore(e, task) : undefined}
      onClick={() => onOpen(task)}
      onKeyDown={handleKey}
      aria-label={`${task.title} · ${STATUS_META[task.status].label}`}
      className={cn(
        "group relative bg-card border border-border rounded-2xl p-3.5 md:p-4 text-left select-none cursor-pointer transition-all",
        "shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-primary/40 hover:shadow-[0_8px_24px_-10px_rgba(var(--primary-rgb),0.3)] active:scale-[0.99]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        dragging && "opacity-40",
        done && "bg-muted/50"
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Completar / reabrir — área táctil de 40px */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleDone(task); }}
          aria-label={done ? "Marcar como pendiente" : "Marcar como hecha"}
          aria-pressed={done}
          className="-m-2 -mt-1.5 w-10 h-10 shrink-0 flex items-center justify-center rounded-full"
        >
          <span
            className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
              done ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/40 text-transparent hover:border-emerald-500 hover:text-emerald-500"
            )}
          >
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
          </span>
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn("text-[14px] font-bold leading-snug text-foreground break-words", done && "line-through text-muted-foreground")}>
            {task.title}
          </p>
          {task.description && (
            <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed line-clamp-2 whitespace-pre-line">{task.description}</p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider", priority.chip)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", priority.dot)} />
              {priority.label}
            </span>
            {dueLabel && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider",
                  overdue ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30"
                    : dueToday && !done ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30"
                    : "bg-muted text-muted-foreground border-border"
                )}
              >
                <CalendarDays className="w-3 h-3" />
                {dueLabel}
              </span>
            )}
            {task.notify_email && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-primary/5 text-primary" title="Aviso por correo activado" aria-label="Aviso por correo activado">
                <Mail className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>

        {draggable && (
          <GripVertical className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />
        )}
      </div>

      {/* Mover entre columnas — siempre visible en móvil, al pasar el cursor en escritorio */}
      <div className="mt-3 flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
        <MoveButton icon={ArrowLeft} target={prev} onClick={() => prev && onMove(task, prev)} />
        <MoveButton icon={ArrowRight} target={next} onClick={() => next && onMove(task, next)} iconRight />
      </div>
    </div>
  );
});

function MoveButton({ icon: Icon, target, onClick, iconRight = false }: { icon: LucideIcon; target: TaskStatus | null; onClick: () => void; iconRight?: boolean }) {
  const label = target ? STATUS_META[target].label : "";
  return (
    <button
      type="button"
      disabled={!target}
      aria-label={target ? `Mover a ${label}` : "Sin columna"}
      title={target ? `Mover a ${label}` : undefined}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "flex-1 md:flex-none items-center justify-center gap-1.5 h-10 md:h-8 px-3 rounded-xl border text-[11px] font-bold transition-all",
        // En un teléfono, la columna sin destino ("←" con un guion, deshabilitado) ocupaba
        // media tarjeta sin hacer nada: allí no se dibuja y el botón que SÍ funciona toma
        // todo el ancho. En escritorio se conserva para que la fila no baile al pasar el
        // cursor (medido en un iPhone 13: 5 tarjetas por pantalla en vez de 2).
        target ? "inline-flex" : "hidden md:inline-flex",
        target
          ? "bg-card border-border text-muted-foreground hover:border-foreground hover:text-foreground active:scale-95"
          : "border-border text-muted-foreground cursor-not-allowed"
      )}
    >
      {!iconRight && <Icon className="w-3.5 h-3.5" />}
      <span className={cn("truncate", !target && "md:hidden")}>{label || "—"}</span>
      {iconRight && <Icon className="w-3.5 h-3.5" />}
    </button>
  );
}
