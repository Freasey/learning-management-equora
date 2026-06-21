CREATE TABLE "curriculum_subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" text NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "level" text;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "source" text DEFAULT 'custom' NOT NULL;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "catalog_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "curriculum_subjects_level_name_unq" ON "curriculum_subjects" USING btree ("level","name");--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_catalog_id_curriculum_subjects_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."curriculum_subjects"("id") ON DELETE set null ON UPDATE no action;