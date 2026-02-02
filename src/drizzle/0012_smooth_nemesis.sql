ALTER TABLE "teachers" RENAME COLUMN "subject" TO "subjects";--> statement-breakpoint
ALTER TABLE "teachers" DROP CONSTRAINT "teachers_subject_unique";--> statement-breakpoint
ALTER TABLE "teachers" DROP CONSTRAINT "teachers_subject_subjects_id_fk";
--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_subjects_subjects_id_fk" FOREIGN KEY ("subjects") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_subjects_unique" UNIQUE("subjects");