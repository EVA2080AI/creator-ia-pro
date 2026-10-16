CREATE TYPE "public"."acuerdo_estado" AS ENUM('pendiente', 'parcial', 'firmado');--> statement-breakpoint
CREATE TABLE "acuerdo" (
	"id" text PRIMARY KEY NOT NULL,
	"titulo" text NOT NULL,
	"pdf_url" text NOT NULL,
	"pdf_firmado_url" text,
	"hash_sha256" text NOT NULL,
	"estado" "acuerdo_estado" DEFAULT 'pendiente' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "acuerdo_firmante" (
	"id" text PRIMARY KEY NOT NULL,
	"acuerdo_id" text NOT NULL,
	"nombre" text NOT NULL,
	"rol" text NOT NULL,
	"documento" text,
	"email" text,
	"orden" integer DEFAULT 0 NOT NULL,
	"token" text NOT NULL,
	"firma_url" text,
	"firmado_at" timestamp,
	"ip" text,
	"user_agent" text,
	CONSTRAINT "acuerdo_firmante_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "acuerdo" ADD CONSTRAINT "acuerdo_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acuerdo_firmante" ADD CONSTRAINT "acuerdo_firmante_acuerdo_id_acuerdo_id_fk" FOREIGN KEY ("acuerdo_id") REFERENCES "public"."acuerdo"("id") ON DELETE cascade ON UPDATE no action;