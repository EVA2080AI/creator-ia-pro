// Proyectos de código de Genesis — reemplaza la tabla `studio_projects` de Supabase.
import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth.js";

export const project = pgTable("project", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Nuevo Proyecto"),
  description: text("description"),
  // { [path]: { language, content } }
  files: jsonb("files").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
