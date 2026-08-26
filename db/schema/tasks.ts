// Tareas (tablero Kanban) + registro de correos — portado desde Supabase (ver docs/TAREAS_Y_EMAIL.md).
import { pgTable, text, timestamp, boolean, integer, date, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { user } from "./auth.js";

export const taskStatus = pgEnum("task_status", ["todo", "in_progress", "done"]);
export const taskPriority = pgEnum("task_priority", ["low", "medium", "high"]);
export const emailStatus = pgEnum("email_status", ["sent", "failed"]);

export const task = pgTable("task", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatus("status").notNull().default("todo"),
  priority: taskPriority("priority").notNull().default("medium"),
  dueDate: date("due_date"),
  position: integer("position").notNull().default(0),
  notifyEmail: boolean("notify_email").notNull().default(false),
  reminderSentAt: timestamp("reminder_sent_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const emailLog = pgTable("email_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  template: text("template").notNull(),
  status: emailStatus("status").notNull().default("sent"),
  providerId: text("provider_id"),
  error: text("error"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
