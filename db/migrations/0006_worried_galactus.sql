DROP INDEX "basalt_conversation_user_updated_idx";--> statement-breakpoint
ALTER TABLE "basalt_conversation" ADD COLUMN "assistant_slug" text;--> statement-breakpoint
CREATE INDEX "basalt_conversation_user_assistant_updated_idx" ON "basalt_conversation" USING btree ("user_id","assistant_slug","updated_at");