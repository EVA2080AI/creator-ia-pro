// Tickets de soporte — reportar errores o pedir mejoras desde cualquier
// pantalla de la app (ver src/components/tickets/ReportButton.tsx).
import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { user } from "./auth.js";

export const ticketType = pgEnum("ticket_type", ["bug", "mejora"]);
export const ticketStatus = pgEnum("ticket_status", ["abierto", "en_progreso", "resuelto"]);

export const ticket = pgTable("ticket", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: ticketType("type").notNull().default("bug"),
  title: text("title").notNull(),
  description: text("description"),
  pageUrl: text("page_url"),
  status: ticketStatus("status").notNull().default("abierto"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
