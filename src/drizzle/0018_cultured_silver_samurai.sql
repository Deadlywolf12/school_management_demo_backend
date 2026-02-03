CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_number" integer NOT NULL,
	"section" varchar(10),
	"class_teacher_id" uuid,
	"room_number" varchar(20) NOT NULL,
	"total_students" integer DEFAULT 0 NOT NULL,
	"student_ids" uuid[] DEFAULT '{}' NOT NULL,
	"class_subjects_id" integer,
	"academic_year" integer NOT NULL,
	"max_capacity" integer DEFAULT 40 NOT NULL,
	"description" text,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "classes_class_number_unique" UNIQUE("class_number")
);
--> statement-breakpoint
CREATE TABLE "bulk_marking_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_schedule_id" uuid NOT NULL,
	"examination_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"class_number" integer NOT NULL,
	"subject_id" uuid NOT NULL,
	"total_students" integer NOT NULL,
	"students_marked" integer NOT NULL,
	"students_absent" integer DEFAULT 0 NOT NULL,
	"marked_by" uuid NOT NULL,
	"marked_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_schedule_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" varchar(20) NOT NULL,
	"marked_by" uuid,
	"marked_at" timestamp DEFAULT now() NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_schedule_id" uuid NOT NULL,
	"examination_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"class_number" integer NOT NULL,
	"subject_id" uuid NOT NULL,
	"obtained_marks" integer NOT NULL,
	"total_marks" integer NOT NULL,
	"percentage" varchar(10) NOT NULL,
	"grade" varchar(5) NOT NULL,
	"status" varchar(20) NOT NULL,
	"marked_by" uuid NOT NULL,
	"marked_at" timestamp DEFAULT now() NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"examination_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"class_number" integer NOT NULL,
	"subject_id" uuid NOT NULL,
	"subject_name" varchar(255) NOT NULL,
	"date" date NOT NULL,
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10) NOT NULL,
	"duration" integer NOT NULL,
	"room_number" varchar(50) NOT NULL,
	"total_marks" integer DEFAULT 100 NOT NULL,
	"passing_marks" integer DEFAULT 40 NOT NULL,
	"invigilators" uuid[] DEFAULT '{}' NOT NULL,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"instructions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "examinations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"academic_year" integer NOT NULL,
	"term" varchar(20),
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"description" text,
	"instructions" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bonus_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"employee_type" varchar(20) NOT NULL,
	"bonus_type" varchar(50) NOT NULL,
	"amount" varchar(20) NOT NULL,
	"description" text,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"approved_by" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'approved' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deduction_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"employee_type" varchar(20) NOT NULL,
	"deduction_type" varchar(50) NOT NULL,
	"amount" varchar(20) NOT NULL,
	"description" text,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"approved_by" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'approved' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"employee_type" varchar(20) NOT NULL,
	"previous_salary" varchar(20) NOT NULL,
	"new_salary" varchar(20) NOT NULL,
	"adjustment_percentage" varchar(10),
	"effective_from" timestamp NOT NULL,
	"reason" text NOT NULL,
	"approved_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"employee_type" varchar(20) NOT NULL,
	"employee_name" varchar(255) NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"base_salary" varchar(20) NOT NULL,
	"bonus" varchar(20) DEFAULT '0' NOT NULL,
	"deductions" varchar(20) DEFAULT '0' NOT NULL,
	"net_salary" varchar(20) NOT NULL,
	"payment_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"payment_date" timestamp,
	"payment_method" varchar(50),
	"transaction_id" varchar(100),
	"remarks" text,
	"approved_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teachers" DROP CONSTRAINT "teachers_class_teacher_of_unique";--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "class_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "class_teacher_of_id" uuid;--> statement-breakpoint
ALTER TABLE "bulk_marking_sessions" ADD CONSTRAINT "bulk_marking_sessions_exam_schedule_id_exam_schedules_id_fk" FOREIGN KEY ("exam_schedule_id") REFERENCES "public"."exam_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attendance" ADD CONSTRAINT "exam_attendance_exam_schedule_id_exam_schedules_id_fk" FOREIGN KEY ("exam_schedule_id") REFERENCES "public"."exam_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_exam_schedule_id_exam_schedules_id_fk" FOREIGN KEY ("exam_schedule_id") REFERENCES "public"."exam_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_examination_id_examinations_id_fk" FOREIGN KEY ("examination_id") REFERENCES "public"."examinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_examination_id_examinations_id_fk" FOREIGN KEY ("examination_id") REFERENCES "public"."examinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_class_teacher_of_id_classes_id_fk" FOREIGN KEY ("class_teacher_of_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "class";--> statement-breakpoint
ALTER TABLE "teachers" DROP COLUMN "class_teacher_of";--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_class_teacher_of_id_unique" UNIQUE("class_teacher_of_id");