ALTER TABLE "answers" ADD COLUMN "file_url" text;--> statement-breakpoint
ALTER TABLE "grade_items" ADD COLUMN "attachment_url" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" text;