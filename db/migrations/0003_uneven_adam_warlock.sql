ALTER TABLE "profile" ADD COLUMN "subscription_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "renewal_reminder_sent_at" timestamp;