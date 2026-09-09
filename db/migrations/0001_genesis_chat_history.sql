-- Historial de chat de Genesis en Drizzle (antes vivía en studio_messages de
-- Supabase, hoy pausado e irrecuperable).
--   1) Las conversaciones de Genesis pertenecen a un proyecto, no a un
--      asistente → assistant_id pasa a ser nullable.
--   2) Índice para "última conversación de un proyecto" (GET /api/projects/:id/messages).
ALTER TABLE "conversation" ALTER COLUMN "assistant_id" DROP NOT NULL;
--> statement-breakpoint
CREATE INDEX "conversation_project_updated_idx" ON "conversation" USING btree ("project_id","updated_at");