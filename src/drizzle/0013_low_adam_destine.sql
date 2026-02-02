ALTER TABLE "teachers" RENAME COLUMN "subjects" TO "subjects_id";--> statement-breakpoint
ALTER TABLE "teachers" DROP CONSTRAINT "teachers_subjects_unique";--> statement-breakpoint
ALTER TABLE "teachers" DROP CONSTRAINT "teachers_subjects_subjects_id_fk";
--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_subjects_id_subjects_id_fk" FOREIGN KEY ("subjects_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_subjects_id_unique" UNIQUE("subjects_id");