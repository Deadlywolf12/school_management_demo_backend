CREATE TABLE "class_subjects" (
	"class_number" integer PRIMARY KEY NOT NULL,
	"subjects_Id" uuid[] NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_grades" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"class_number" integer NOT NULL,
	"year" integer NOT NULL,
	"subjects" text NOT NULL,
	"total_obtained" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_marks" numeric(10, 2) DEFAULT '0' NOT NULL,
	"percentage" numeric(5, 2) DEFAULT '0' NOT NULL,
	"grade" text DEFAULT 'F' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_grades_student_id_class_number_year_pk" PRIMARY KEY("student_id","class_number","year")
);
--> statement-breakpoint
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_subjects_Id_subjects_id_fk" FOREIGN KEY ("subjects_Id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;