// Espacios (contenedores de flujos de Canvas IA) y biblioteca de assets —
// portados desde Supabase `spaces`/`saved_assets` (ver supabase/migrations
// 20260308134743 y 20260328_saved_assets_space_id). `canvas_nodes` (el grafo
// del lienzo en sí) sigue pendiente de migrar — ver docs/PLAN_REFACTOR_GENESIS.md.
import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth.js";

export const space = pgTable("space", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Untitled Space"),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  settings: jsonb("settings").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const savedAsset = pgTable("saved_asset", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  spaceId: text("space_id").references(() => space.id, { onDelete: "set null" }),
  /** id de un canvas_node de origen — sin FK: esa tabla no está migrada aún. */
  nodeId: text("node_id"),
  assetUrl: text("asset_url").notNull(),
  prompt: text("prompt"),
  type: text("type").notNull().default("image"),
  isFavorite: boolean("is_favorite").notNull().default(false),
  tags: text("tags").array().notNull().default([]),
  /** Solo para type === 'document' — contenido editable del editor de texto. */
  content: text("content"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
