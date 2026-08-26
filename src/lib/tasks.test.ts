import { describe, it, expect } from "vitest";
import {
  addDaysISO, computeMove, formatDueLabel, groupTasksByStatus, isDueToday, isOverdue,
  nextPosition, nextStatus, parseDateOnly, prevStatus, sortTasks, tasksNeedingReminder, todayISO,
  type Task,
} from "@/lib/tasks";

const NOW = new Date(2026, 7, 25, 12, 0, 0); // 25 de agosto de 2026 (hora local)

const make = (over: Partial<Task> = {}): Task => ({
  id: "t1",
  user_id: "u1",
  title: "Tarea",
  description: null,
  status: "todo",
  priority: "medium",
  due_date: null,
  position: 0,
  notify_email: false,
  reminder_sent_at: null,
  completed_at: null,
  created_at: "2026-08-25T00:00:00.000Z",
  updated_at: "2026-08-25T00:00:00.000Z",
  ...over,
});

describe("estados", () => {
  it("navega entre columnas", () => {
    expect(nextStatus("todo")).toBe("in_progress");
    expect(nextStatus("in_progress")).toBe("done");
    expect(nextStatus("done")).toBeNull();
    expect(prevStatus("todo")).toBeNull();
    expect(prevStatus("done")).toBe("in_progress");
  });
});

describe("orden y agrupación", () => {
  it("ordena por posición y luego por fecha de creación", () => {
    const tasks = [
      make({ id: "b", position: 1 }),
      make({ id: "a", position: 0, created_at: "2026-08-25T02:00:00Z" }),
      make({ id: "c", position: 0, created_at: "2026-08-25T01:00:00Z" }),
    ];
    expect(sortTasks(tasks).map((t) => t.id)).toEqual(["c", "a", "b"]);
  });

  it("agrupa por estado manteniendo el orden", () => {
    const grouped = groupTasksByStatus([
      make({ id: "1", status: "done", position: 2 }),
      make({ id: "2", status: "todo", position: 1 }),
      make({ id: "3", status: "todo", position: 0 }),
    ]);
    expect(grouped.todo.map((t) => t.id)).toEqual(["3", "2"]);
    expect(grouped.done.map((t) => t.id)).toEqual(["1"]);
    expect(grouped.in_progress).toEqual([]);
  });

  it("calcula la siguiente posición por columna", () => {
    const tasks = [make({ id: "1", status: "todo", position: 4 }), make({ id: "2", status: "done", position: 9 })];
    expect(nextPosition(tasks, "todo")).toBe(5);
    expect(nextPosition(tasks, "done")).toBe(10);
    expect(nextPosition(tasks, "in_progress")).toBe(0);
  });
});

describe("computeMove", () => {
  const board = [
    make({ id: "a", status: "todo", position: 0 }),
    make({ id: "b", status: "todo", position: 1 }),
    make({ id: "c", status: "in_progress", position: 0 }),
  ];

  it("mueve al final de otra columna y solo devuelve filas que cambian", () => {
    expect(computeMove(board, "a", "in_progress")).toEqual([{ id: "a", status: "in_progress", position: 1 }]);
  });

  it("inserta antes de una tarjeta y renumera la columna destino", () => {
    expect(computeMove(board, "a", "in_progress", "c")).toEqual([
      { id: "a", status: "in_progress", position: 0 },
      { id: "c", status: "in_progress", position: 1 },
    ]);
  });

  it("reordena dentro de la misma columna", () => {
    expect(computeMove(board, "b", "todo", "a")).toEqual([
      { id: "b", status: "todo", position: 0 },
      { id: "a", status: "todo", position: 1 },
    ]);
  });

  it("no hace nada si la tarea no existe o ya está en su sitio", () => {
    expect(computeMove(board, "zzz", "done")).toEqual([]);
    expect(computeMove(board, "b", "todo")).toEqual([]);
    expect(computeMove(board, "a", "todo", "a")).toEqual([]);
  });
});

describe("fechas", () => {
  it("interpreta YYYY-MM-DD como día local sin desfase de zona horaria", () => {
    const d = parseDateOnly("2026-08-25")!;
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 7, 25]);
    expect(parseDateOnly("2026-8-5")).toBeNull();
    expect(parseDateOnly(null)).toBeNull();
  });

  it("genera hoy y días relativos", () => {
    expect(todayISO(NOW)).toBe("2026-08-25");
    expect(addDaysISO(1, NOW)).toBe("2026-08-26");
    expect(addDaysISO(7, NOW)).toBe("2026-09-01");
  });

  it("etiqueta la fecha límite en lenguaje natural", () => {
    expect(formatDueLabel("2026-08-25", NOW)).toBe("Hoy");
    expect(formatDueLabel("2026-08-26", NOW)).toBe("Mañana");
    expect(formatDueLabel("2026-08-24", NOW)).toBe("Ayer");
    expect(formatDueLabel("2026-08-20", NOW)).toBe("Hace 5 días");
    expect(formatDueLabel("2026-08-28", NOW)).toBe("En 3 días");
    expect(formatDueLabel("2026-09-15", NOW)).toMatch(/15 sept?/);
    expect(formatDueLabel("2027-01-10", NOW)).toMatch(/2027/);
    expect(formatDueLabel(null, NOW)).toBe("");
  });

  it("detecta atrasadas y de hoy (las hechas nunca están atrasadas)", () => {
    expect(isOverdue(make({ due_date: "2026-08-24" }), NOW)).toBe(true);
    expect(isOverdue(make({ due_date: "2026-08-24", status: "done" }), NOW)).toBe(false);
    expect(isOverdue(make({ due_date: "2026-08-25" }), NOW)).toBe(false);
    expect(isOverdue(make({ due_date: null }), NOW)).toBe(false);
    expect(isDueToday(make({ due_date: "2026-08-25" }), NOW)).toBe(true);
  });
});

describe("recordatorios", () => {
  it("solo incluye tareas con aviso, no hechas, vencidas u hoy, y sin recordatorio previo", () => {
    const tasks = [
      make({ id: "ok-hoy", notify_email: true, due_date: "2026-08-25" }),
      make({ id: "ok-atrasada", notify_email: true, due_date: "2026-08-01", position: 1 }),
      make({ id: "sin-aviso", notify_email: false, due_date: "2026-08-01" }),
      make({ id: "hecha", notify_email: true, due_date: "2026-08-01", status: "done" }),
      make({ id: "futura", notify_email: true, due_date: "2026-08-30" }),
      make({ id: "ya-avisada", notify_email: true, due_date: "2026-08-01", reminder_sent_at: "2026-08-24T00:00:00Z" }),
      make({ id: "sin-fecha", notify_email: true, due_date: null }),
    ];
    expect(tasksNeedingReminder(tasks, NOW).map((t) => t.id)).toEqual(["ok-hoy", "ok-atrasada"]);
  });
});
