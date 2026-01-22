CREATE TABLE "parents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"phone_number" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"guardian_name" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"gender" text DEFAULT 'Not specified',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "parents_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "parents_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"employee_id" text NOT NULL,
	"department" text NOT NULL,
	"role_details" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"phone_number" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"joining_date" timestamp DEFAULT now() NOT NULL,
	"salary" text DEFAULT '0.00' NOT NULL,
	"gender" text DEFAULT 'Not specified',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "staff_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "staff_employee_id_unique" UNIQUE("employee_id"),
	CONSTRAINT "staff_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "student_parents" (
	"student_id" uuid NOT NULL,
	"parent_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"student_id" text NOT NULL,
	"class" text NOT NULL,
	"enrollment_year" integer NOT NULL,
	"emergency_number" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"blood_group" text DEFAULT 'Unknown',
	"date_of_birth" timestamp DEFAULT now(),
	"gender" text DEFAULT 'Not specified',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "students_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "students_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "teachers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"employee_id" text NOT NULL,
	"department" text NOT NULL,
	"subject" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"gender" text DEFAULT 'Not specified',
	"class_teacher_of" text DEFAULT '',
	"phone_number" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"joining_date" timestamp DEFAULT now() NOT NULL,
	"salary" text DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "teachers_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "teachers_employee_id_unique" UNIQUE("employee_id"),
	CONSTRAINT "teachers_class_teacher_of_unique" UNIQUE("class_teacher_of"),
	CONSTRAINT "teachers_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
ALTER TABLE "parents" ADD CONSTRAINT "parents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_parents" ADD CONSTRAINT "student_parents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_parents" ADD CONSTRAINT "student_parents_parent_id_parents_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;