ALTER TABLE "assessments" ADD COLUMN "count_to_grade" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "grade_items" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "grade_items" ADD COLUMN "assessment_id" uuid;--> statement-breakpoint
ALTER TABLE "grade_items" ADD CONSTRAINT "grade_items_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;