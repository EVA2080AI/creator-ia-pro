// Nodos del lienzo de Canvas IA (`/studio-flow`) — portado desde Supabase
// `canvas_nodes`. El schema real en Supabase se desvió de sus propias
// migraciones (columna `name` y varios `type` nunca se documentaron con
// ALTER TABLE) — este schema refleja lo que el código de
// src/components/formarketing/*.tsx y src/pages/formarketing/hooks/*.ts
// realmente lee/escribe, no el historial de migraciones.
//
// Los edges del grafo no tienen tabla propia: se guardan como UNA fila
// especial por espacio con type='flow_metadata' y dataPayload={edges}
// (patrón upsert-por-conflicto, ver api/canvas-nodes/metadata.ts) — de ahí
// el índice único parcial (space_id, type) WHERE type='flow_metadata'.
import { pgTable, text, doublePrecision, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth.js";
import { space } from "./spaces.js";

export const canvasNode = pgTable("canvas_node", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  spaceId: text("space_id").references(() => space.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  name: text("name"),
  prompt: text("prompt").notNull().default(""),
  assetUrl: text("asset_url"),
  posX: doublePrecision("pos_x").notNull().default(0),
  posY: doublePrecision("pos_y").notNull().default(0),
  width: doublePrecision("width").notNull().default(300),
  height: doublePrecision("height").notNull().default(300),
  status: text("status").notNull().default("loading"),
  errorMessage: text("error_message"),
  dataPayload: jsonb("data_payload").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("canvas_node_flow_metadata_unique")
    .on(table.spaceId, table.type)
    .where(sql`${table.type} = 'flow_metadata'`),
]);
