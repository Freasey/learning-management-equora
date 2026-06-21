CREATE TABLE "contact_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text DEFAULT 'contact' NOT NULL,
	"name" text NOT NULL,
	"school_name" text,
	"email" text NOT NULL,
	"phone" text,
	"plan_key" text,
	"message" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
