CREATE TYPE "public"."ticket_status" AS ENUM('abierto', 'en_progreso', 'resuelto');--> statement-breakpoint
CREATE TYPE "public"."ticket_type" AS ENUM('bug', 'mejora');--> statement-breakpoint
CREATE TABLE "ticket" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "ticket_type" DEFAULT 'bug' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"page_url" text,
	"status" "ticket_status" DEFAULT 'abierto' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;