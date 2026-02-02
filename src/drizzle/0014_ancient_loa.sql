ALTER TABLE "teachers" RENAME COLUMN "subjects_id" TO "subject_id";--> statement-breakpoint
ALTER TABLE "teachers" DROP CONSTRAINT "teachers_subjects_id_unique";--> statement-breakpoint
ALTER TABLE "teachers" DROP CONSTRAINT "teachers_subjects_id_subjects_id_fk";
--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;