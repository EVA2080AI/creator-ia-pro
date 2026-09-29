// Historial de chat y memoria de Basalt — antes vivían solo en localStorage
// (basalt:convs:<userId> / basalt:memory:<userId>), sin backup ni sync entre
// dispositivos: un usuario perdía todo al limpiar el navegador o cambiar de
// dispositivo (caso real: "hice un estudio de mercado y nunca encontré dónde
// quedó", 2026-09-29). Tablas propias en vez de reusar `conversation`/
// `message` (pensadas para Genesis/Studio con tool calls y costo por
// mensaje) — Basalt guarda cada conversación completa en jsonb, mismo shape
// que StoredConversation en src/lib/basalt.ts, para migrar 1:1 desde el
// cliente sin rediseñar nada.
import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./auth.js";

export const basaltConversation = pgTable("basalt_conversation", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("Nueva conversación"),
  messages: jsonb("messages").notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userUpdatedIdx: index("basalt_conversation_user_updated_idx").on(t.userId, t.updatedAt),
}));

// Un row por usuario — "lo que Basalt recuerda de ti" entre conversaciones.
export const basaltMemory = pgTable("basalt_memory", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  facts: jsonb("facts").notNull().default([]),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
