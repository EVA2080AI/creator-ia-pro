import { useState } from "react";
import type { DragEvent } from "react";
import { Inbox, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_META, type Task, type TaskStatus } from "@/lib/tasks";
import { TaskCard } from "./TaskCard";

export interface ColumnDnd {
  draggingId: string | null;
  onDragStart: (e: DragEvent<HTMLDivElement>, task: Task) => void;
  onDragEnd: () => void;
  onDrop: (e: DragEvent<HTMLElement>, status: TaskStatus, beforeId: string | null) => void;
}

export interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  showHeader?: boolean;
  onAdd: (status: TaskStatus) => void;
  onOpen: (task: Task) => void;
  onMove: (task: Task, to: TaskStatus) => void;
  onToggleDone: (task: Task) => void;
  onClearDone?: () => void;
  /** Solo escritorio. */
  dnd?: ColumnDnd;
  className?: string;
}

export function TaskColumn({ status, tasks, showHeader = true, onAdd, onOpen, onMove, onToggleDone, onClearDone, dnd, className }: TaskColumnProps) {
  const meta = STATUS_META[status];
  const [over, setOver] = useState(false);

  return (
    <section
      aria-label={meta.label}
      onDragOver={dnd ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOver(true); } : undefined}
      onDragLeave={dnd ? (e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false); } : undefined}
      onDrop={dnd ? (e) => { setOver(false); dnd.onDrop(e, status, null); } : undefined}
      className={cn(
        "flex flex-col rounded-[1.75rem] bg-zinc-50/70 border border-zinc-200/60 transition-colors",
        "min-h-[260px] md:min-h-[60vh] md:max-h-[calc(100vh-200px)]",
        over && "border-primary/40 bg-primary/5",
        className
      )}
    >
      {showHeader && (
        <header className="flex items-center gap-2 px-4 pt-4 pb-2 shrink-0">
          <span className={cn("w-2 h-2 rounded-full", meta.dot)} />
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600">{meta.label}</h2>
          <span className={cn("ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums", meta.badge)}>{tasks.length}</span>
          <div className="ml-auto flex items-center gap-1">
            {status === "done" && onClearDone && tasks.length > 0 && (
              <button
                type="button"
                onClick={onClearDone}
                title="Limpiar completadas"
                aria-label="Limpiar tareas completadas"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onAdd(status)}
              aria-label={`Nueva tarea en ${meta.label}`}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-white hover:shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      <div className={cn("flex-1 px-3 pb-3 space-y-2.5 md:overflow-y-auto no-scrollbar", !showHeader && "pt-3")}>
        {tasks.length === 0 ? (
          <button
            type="button"
            onClick={() => onAdd(status)}
            className="w-full min-h-[200px] flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 px-6 text-center hover:border-primary/40 hover:bg-white/60 transition-all"
          >
            <Inbox className="w-7 h-7 text-zinc-300" />
            <p className="text-[12px] text-zinc-400 font-medium leading-relaxed">{meta.empty}</p>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">+ Agregar tarea</span>
          </button>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpen={onOpen}
              onMove={onMove}
              onToggleDone={onToggleDone}
              draggable={!!dnd}
              dragging={dnd?.draggingId === task.id}
              onDragStart={dnd?.onDragStart}
              onDragEnd={dnd?.onDragEnd}
              onDropBefore={dnd ? (e, target) => { e.preventDefault(); e.stopPropagation(); setOver(false); dnd.onDrop(e, status, target.id); } : undefined}
            />
          ))
        )}
      </div>
    </section>
  );
}
