import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { CalendarDays, Loader2, Mail, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  PRIORITY_META, STATUS_META, TASK_PRIORITIES, TASK_STATUSES, addDaysISO, todayISO,
  type Task, type TaskInput, type TaskPriority, type TaskStatus,
} from "@/lib/tasks";

export interface TaskSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  task?: Task | null;
  defaultStatus?: TaskStatus;
  userEmail?: string | null;
  onSubmit: (values: TaskInput) => Promise<boolean>;
  onDelete?: (task: Task) => Promise<boolean>;
  onShare?: (task: Task, to: string, message: string) => Promise<boolean>;
}

/**
 * TaskSheet — editor de tarea.
 * Móvil: hoja inferior (vaul) con scroll interno y padding para el área segura.
 * Escritorio: diálogo centrado.
 */
export function TaskSheet(props: TaskSheetProps) {
  const isMobile = useIsMobile();
  const { open, onOpenChange, mode } = props;
  const title = mode === "create" ? "Nueva tarea" : "Editar tarea";
  const description = mode === "create" ? "Captura rápida: escribe y guarda." : "Ajusta, comparte por correo o elimina esta tarea.";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
        <DrawerContent className="max-h-[92vh] rounded-t-[2rem] border-zinc-200 focus:outline-none">
          <div className="overflow-y-auto overscroll-contain px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <DrawerTitle className="mt-2 text-lg font-black tracking-tight text-zinc-900">{title}</DrawerTitle>
            <DrawerDescription className="mb-4 text-[12px] text-zinc-500">{description}</DrawerDescription>
            {open && <TaskForm {...props} onClose={() => onOpenChange(false)} />}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] rounded-[2rem] border-zinc-200 p-0 overflow-hidden gap-0">
        <div className="max-h-[85vh] overflow-y-auto px-7 pt-7 pb-7">
          <DialogTitle className="text-xl font-black tracking-tight text-zinc-900">{title}</DialogTitle>
          <DialogDescription className="mb-5 text-[12px] text-zinc-500">{description}</DialogDescription>
          {open && <TaskForm {...props} onClose={() => onOpenChange(false)} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const inputCls = "w-full h-12 rounded-xl border border-zinc-200 bg-white px-4 text-base md:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";
const labelCls = "block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5";

function TaskForm({ mode, task, defaultStatus, userEmail, onSubmit, onDelete, onShare, onClose }: TaskSheetProps & { onClose: () => void }) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [desc, setDesc] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus ?? "todo");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [notify, setNotify] = useState(task?.notify_email ?? false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTo, setShareTo] = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const [sharing, setSharing] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode !== "create") return;
    const id = window.setTimeout(() => titleRef.current?.focus(), 320);
    return () => window.clearTimeout(id);
  }, [mode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Escribe un título para la tarea");
      titleRef.current?.focus();
      return;
    }
    setSaving(true);
    const ok = await onSubmit({
      title: title.trim(),
      description: desc.trim() || null,
      status,
      priority,
      due_date: dueDate || null,
      notify_email: notify,
    });
    setSaving(false);
    if (ok) onClose();
  };

  const handleDelete = async () => {
    if (!task || !onDelete) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    const ok = await onDelete(task);
    setDeleting(false);
    if (ok) onClose();
  };

  const handleShare = async () => {
    if (!task || !onShare) return;
    const to = shareTo.trim().toLowerCase();
    if (!EMAIL_RE.test(to)) { toast.error("Escribe un correo válido"); return; }
    setSharing(true);
    const ok = await onShare(task, to, shareMsg.trim());
    setSharing(false);
    if (ok) { setShareTo(""); setShareMsg(""); setShareOpen(false); }
  };

  const quickDates = [
    { label: "Hoy", value: todayISO() },
    { label: "Mañana", value: addDaysISO(1) },
    { label: "En 1 semana", value: addDaysISO(7) },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="task-title" className={labelCls}>Título</label>
        <input
          id="task-title"
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="¿Qué hay que hacer?"
          autoComplete="off"
          enterKeyHint="done"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="task-desc" className={labelCls}>
          Descripción <span className="normal-case tracking-normal font-medium">(opcional)</span>
        </label>
        <textarea
          id="task-desc"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          maxLength={4000}
          rows={3}
          placeholder="Detalles, enlaces, pasos…"
          className={cn(inputCls, "h-auto py-3 resize-none leading-relaxed")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span className={labelCls}>Prioridad</span>
          <ChipGroup<TaskPriority>
            value={priority}
            onChange={setPriority}
            options={TASK_PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label, dot: PRIORITY_META[p].dot }))}
          />
        </div>
        <div>
          <span className={labelCls}>Estado</span>
          <ChipGroup<TaskStatus>
            value={status}
            onChange={setStatus}
            options={TASK_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].short, dot: STATUS_META[s].dot }))}
          />
        </div>
      </div>

      <div>
        <label htmlFor="task-due" className={labelCls}>Fecha límite</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <CalendarDays className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={cn(inputCls, "pl-11 appearance-none")}
            />
          </div>
          {dueDate && (
            <button
              type="button"
              onClick={() => setDueDate("")}
              aria-label="Quitar fecha"
              className="w-12 h-12 shrink-0 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {quickDates.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => setDueDate(q.value)}
              className={cn(
                "px-3 h-9 rounded-lg text-[11px] font-bold border transition-all",
                dueDate === q.value ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400"
              )}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-3 p-4 rounded-2xl border border-zinc-200 bg-zinc-50/60 cursor-pointer">
        <span className="w-9 h-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-primary shrink-0">
          <Mail className="w-4 h-4" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-bold text-zinc-900">Avisarme por correo</span>
          <span className="block text-[11px] text-zinc-500 leading-snug">
            Confirmación al crear, recordatorio al vencer y aviso al completar{userEmail ? ` → ${userEmail}` : ""}.
          </span>
        </span>
        <Switch checked={notify} onCheckedChange={setNotify} aria-label="Avisarme por correo" />
      </label>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 pt-1">
        {mode === "edit" && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={cn(
              "h-12 sm:h-11 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest inline-flex items-center justify-center gap-2 transition-all",
              confirmDelete ? "bg-rose-600 text-white hover:bg-rose-700" : "text-rose-500 hover:bg-rose-50"
            )}
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {confirmDelete ? "Confirmar eliminación" : "Eliminar"}
          </button>
        )}
        <div className="flex-1" />
        <button type="button" onClick={onClose} className="h-12 sm:h-11 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="h-12 sm:h-11 px-6 rounded-xl bg-zinc-900 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-zinc-900/10 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-all"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "create" ? "Crear tarea" : "Guardar"}
        </button>
      </div>

      {mode === "edit" && task && onShare && (
        <div className="border-t border-zinc-100 pt-5">
          <button type="button" onClick={() => setShareOpen((o) => !o)} aria-expanded={shareOpen} className="w-full flex items-center gap-3 text-left">
            <span className="w-9 h-9 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0">
              <Send className="w-4 h-4" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-bold text-zinc-900">Enviar por correo</span>
              <span className="block text-[11px] text-zinc-500">Comparte esta tarea con quien quieras.</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">{shareOpen ? "Cerrar" : "Abrir"}</span>
          </button>
          {shareOpen && (
            <div className="mt-4 space-y-3">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={shareTo}
                onChange={(e) => setShareTo(e.target.value)}
                placeholder="correo@ejemplo.com"
                aria-label="Correo del destinatario"
                className={inputCls}
              />
              <textarea
                value={shareMsg}
                onChange={(e) => setShareMsg(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="Mensaje (opcional)"
                aria-label="Mensaje"
                className={cn(inputCls, "h-auto py-3 resize-none")}
              />
              <button
                type="button"
                onClick={handleShare}
                disabled={sharing}
                className="w-full h-12 sm:h-11 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest inline-flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 transition-all"
              >
                {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Enviar tarea
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  );
}

function ChipGroup<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; dot?: string }[] }) {
  return (
    <div role="radiogroup" className="flex gap-1 p-1 rounded-xl bg-zinc-100/80 border border-zinc-200/60">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 h-10 rounded-lg text-[11px] font-bold inline-flex items-center justify-center gap-1.5 transition-all",
              active ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/60" : "text-zinc-500 hover:text-zinc-800"
            )}
          >
            {o.dot && <span className={cn("w-1.5 h-1.5 rounded-full", o.dot)} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
