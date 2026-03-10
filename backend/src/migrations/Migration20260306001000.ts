import { Migration } from "@mikro-orm/migrations";

export class Migration20260306001000 extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table "appointment" rename to "lesson";');
    this.addSql('alter table "appointment_students" rename to "lesson_students";');

    this.addSql(
      'alter table "lesson" rename constraint "appointment_pkey" to "lesson_pkey";',
    );
    this.addSql(
      'alter table "lesson" rename constraint "appointment_tutor_id_foreign" to "lesson_tutor_id_foreign";',
    );
    this.addSql(
      'alter table "lesson" rename constraint "appointment_course_id_foreign" to "lesson_course_id_foreign";',
    );

    this.addSql(
      'alter table "lesson_students" rename column "appointment_id" to "lesson_id";',
    );
    this.addSql(
      'alter table "lesson_students" rename constraint "appointment_students_pkey" to "lesson_students_pkey";',
    );
    this.addSql(
      'alter table "lesson_students" rename constraint "appointment_students_appointment_id_foreign" to "lesson_students_lesson_id_foreign";',
    );
    this.addSql(
      'alter table "lesson_students" rename constraint "appointment_students_user_id_foreign" to "lesson_students_user_id_foreign";',
    );

    this.addSql(
      'alter table "attendance" rename column "appointment_id" to "lesson_id";',
    );
    this.addSql(
      'alter table "attendance" rename constraint "attendance_appointment_id_foreign" to "attendance_lesson_id_foreign";',
    );

    this.addSql(
      'alter table "class_report" rename column "appointment_id" to "lesson_id";',
    );
    this.addSql(
      'alter table "class_report" rename constraint "class_report_appointment_id_foreign" to "class_report_lesson_id_foreign";',
    );

    this.addSql(
      "update \"attendance\" set \"status\" = 'absent' where \"status\" = 'on_time_cancellation';",
    );
    this.addSql(
      'alter table "attendance" drop constraint if exists "attendance_status_check";',
    );
    this.addSql(
      "alter table \"attendance\" add constraint \"attendance_status_check\" check (\"status\" in ('present', 'absent'));",
    );

    this.addSql(
      'alter table "attendance" add constraint "attendance_lesson_id_student_id_unique" unique ("lesson_id", "student_id");',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "attendance" drop constraint if exists "attendance_lesson_id_student_id_unique";',
    );

    this.addSql(
      'alter table "attendance" drop constraint if exists "attendance_status_check";',
    );
    this.addSql(
      "alter table \"attendance\" add constraint \"attendance_status_check\" check (\"status\" in ('present', 'absent', 'on_time_cancellation'));",
    );

    this.addSql(
      'alter table "class_report" rename constraint "class_report_lesson_id_foreign" to "class_report_appointment_id_foreign";',
    );
    this.addSql(
      'alter table "class_report" rename column "lesson_id" to "appointment_id";',
    );

    this.addSql(
      'alter table "attendance" rename constraint "attendance_lesson_id_foreign" to "attendance_appointment_id_foreign";',
    );
    this.addSql(
      'alter table "attendance" rename column "lesson_id" to "appointment_id";',
    );

    this.addSql(
      'alter table "lesson_students" rename constraint "lesson_students_user_id_foreign" to "appointment_students_user_id_foreign";',
    );
    this.addSql(
      'alter table "lesson_students" rename constraint "lesson_students_lesson_id_foreign" to "appointment_students_appointment_id_foreign";',
    );
    this.addSql(
      'alter table "lesson_students" rename constraint "lesson_students_pkey" to "appointment_students_pkey";',
    );
    this.addSql(
      'alter table "lesson_students" rename column "lesson_id" to "appointment_id";',
    );

    this.addSql(
      'alter table "lesson" rename constraint "lesson_course_id_foreign" to "appointment_course_id_foreign";',
    );
    this.addSql(
      'alter table "lesson" rename constraint "lesson_tutor_id_foreign" to "appointment_tutor_id_foreign";',
    );
    this.addSql(
      'alter table "lesson" rename constraint "lesson_pkey" to "appointment_pkey";',
    );

    this.addSql('alter table "lesson_students" rename to "appointment_students";');
    this.addSql('alter table "lesson" rename to "appointment";');
  }
}
