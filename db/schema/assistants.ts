// Personalización de asistentes de IA — marca, prompt y capacidades por
// organización (cliente/colegio/empresa) o por usuario individual.
import { pgTable, text, timestamp, boolean, jsonb, integer, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { user, organization } from "./auth.js";

export const assistantVisibility = pgEnum("assistant_visibility", ["system", "organization", "private"]);

export const assistant = pgTable("assistant", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  ownerId: text("owner_id").references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").references(() => organization.id, { onDelete: "cascade" }),
  visibility: assistantVisibility("visibility").notNull().default("private"),

  name: text("name").notNull(),
  tagline: text("tagline"),
  avatarUrl: text("avatar_url"),
  // { gradient, accent, accentSoft, panel, font, theme: 'light'|'dark'|'system' }
  brand: jsonb("brand").notNull().default({}),
  // { title, subtitle, cards: [{ label, prompt, icon }] }
  welcome: jsonb("welcome").notNull().default({}),
  // { role, modules: [{ title, rules: string[] }], style: string[], guardrails: string[], language }
  persona: jsonb("persona").notNull().default({}),
  // { code, image, text, web, charts, vision }
  capabilities: jsonb("capabilities").notNull().default({}),

  defaultModel: text("default_model").notNull().default("deepseek/deepseek-chat"),
  allowedModels: text("allowed_models").array(),
  minTier: text("min_tier").notNull().default("free"),
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Ajustes que cada usuario hace sobre un asistente, dentro de lo permitido.
export const userAssistantSettings = pgTable("user_assistant_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  assistantId: text("assistant_id").notNull().references(() => assistant.id, { onDelete: "cascade" }),
  instructions: text("instructions"),
  preferredModel: text("preferred_model"),
  theme: text("theme"),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userAssistantUnique: uniqueIndex("user_assistant_settings_user_assistant_idx").on(t.userId, t.assistantId),
}));

// Marca por defecto de una organización + asistente por defecto para sus miembros.
export const organizationBranding = pgTable("organization_branding", {
  organizationId: text("organization_id").primaryKey().references(() => organization.id, { onDelete: "cascade" }),
  defaultAssistantId: text("default_assistant_id").references(() => assistant.id, { onDelete: "set null" }),
  brand: jsonb("brand").notNull().default({}),
  plan: text("plan").notNull().default("free"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Conversaciones y mensajes — unifica studio_conversations + studio_messages + historial de Tools.
export const conversation = pgTable("conversation", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  assistantId: text("assistant_id").notNull().references(() => assistant.id, { onDelete: "cascade" }),
  projectId: text("project_id"),
  title: text("title").notNull().default("Nueva conversación"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const message = pgTable("message", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => conversation.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  attachments: jsonb("attachments").notNull().default([]),
  toolCalls: jsonb("tool_calls").notNull().default([]),
  costCredits: integer("cost_credits").notNull().default(0),
  model: text("model"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
