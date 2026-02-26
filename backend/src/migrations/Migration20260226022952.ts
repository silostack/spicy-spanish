import { Migration } from '@mikro-orm/migrations';

export class Migration20260226022952 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "course_schedule" ("id" varchar(255) not null, "course_id" varchar(255) not null, "day_of_week" int not null, "start_time" varchar(255) not null, "end_time" varchar(255) not null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, constraint "course_schedule_pkey" primary key ("id"));');

    this.addSql('create table "course_students" ("course_id" varchar(255) not null, "user_id" varchar(255) not null, constraint "course_students_pkey" primary key ("course_id", "user_id"));');

    this.addSql('create table "appointment_students" ("appointment_id" varchar(255) not null, "user_id" varchar(255) not null, constraint "appointment_students_pkey" primary key ("appointment_id", "user_id"));');

    this.addSql('alter table "course_schedule" add constraint "course_schedule_course_id_foreign" foreign key ("course_id") references "course" ("id") on update cascade;');

    this.addSql('alter table "course_students" add constraint "course_students_course_id_foreign" foreign key ("course_id") references "course" ("id") on update cascade on delete cascade;');
    this.addSql('alter table "course_students" add constraint "course_students_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete cascade;');

    this.addSql('alter table "appointment_students" add constraint "appointment_students_appointment_id_foreign" foreign key ("appointment_id") references "appointment" ("id") on update cascade on delete cascade;');
    this.addSql('alter table "appointment_students" add constraint "appointment_students_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete cascade;');

    this.addSql('drop table if exists "course_lesson" cascade;');

    this.addSql('drop table if exists "student_course" cascade;');

    this.addSql('alter table "appointment" drop constraint "appointment_student_id_foreign";');
    this.addSql('alter table "appointment" drop constraint "appointment_course_id_foreign";');

    this.addSql('alter table "course" add column "tutor_id" varchar(255) not null, add column "start_date" timestamptz(0) not null, add column "hours_balance" numeric(6,2) not null default 0, add column "needs_renewal" boolean not null default false;');
    this.addSql('alter table "course" add constraint "course_tutor_id_foreign" foreign key ("tutor_id") references "user" ("id") on update cascade;');
    this.addSql('alter table "course" drop column "description";');
    this.addSql('alter table "course" drop column "learning_level";');

    this.addSql('alter table "appointment" add column "credited_back" boolean null;');
    this.addSql('alter table "appointment" alter column "course_id" type varchar(255) using ("course_id"::varchar(255));');
    this.addSql('alter table "appointment" alter column "course_id" set not null;');
    this.addSql('alter table "appointment" drop column "student_id";');
    this.addSql('alter table "appointment" add constraint "appointment_course_id_foreign" foreign key ("course_id") references "course" ("id") on update cascade;');
  }

  async down(): Promise<void> {
    this.addSql('create table "course_lesson" ("id" varchar(255) not null default null, "course_id" varchar(255) not null default null, "title" varchar(255) not null default null, "content" text not null default null, "order" int4 not null default null, "created_at" timestamptz(0) not null default null, "updated_at" timestamptz(0) not null default null, constraint "course_lesson_pkey" primary key ("id"));');

    this.addSql('create table "student_course" ("id" varchar(255) not null default null, "student_id" varchar(255) not null default null, "tutor_id" varchar(255) not null default null, "course_id" varchar(255) not null default null, "progress" int4 not null default 0, "created_at" timestamptz(0) not null default null, "updated_at" timestamptz(0) not null default null, constraint "student_course_pkey" primary key ("id"));');

    this.addSql('alter table "course_lesson" add constraint "course_lesson_course_id_foreign" foreign key ("course_id") references "course" ("id") on update cascade on delete no action;');

    this.addSql('alter table "student_course" add constraint "student_course_course_id_foreign" foreign key ("course_id") references "course" ("id") on update cascade on delete no action;');
    this.addSql('alter table "student_course" add constraint "student_course_student_id_foreign" foreign key ("student_id") references "user" ("id") on update cascade on delete no action;');
    this.addSql('alter table "student_course" add constraint "student_course_tutor_id_foreign" foreign key ("tutor_id") references "user" ("id") on update cascade on delete no action;');

    this.addSql('drop table if exists "course_schedule" cascade;');

    this.addSql('drop table if exists "course_students" cascade;');

    this.addSql('drop table if exists "appointment_students" cascade;');

    this.addSql('alter table "appointment" drop constraint "appointment_course_id_foreign";');

    this.addSql('alter table "course" drop constraint "course_tutor_id_foreign";');

    this.addSql('alter table "appointment" add column "student_id" varchar(255) not null default null;');
    this.addSql('alter table "appointment" alter column "course_id" type varchar(255) using ("course_id"::varchar(255));');
    this.addSql('alter table "appointment" alter column "course_id" drop not null;');
    this.addSql('alter table "appointment" add constraint "appointment_student_id_foreign" foreign key ("student_id") references "user" ("id") on update cascade on delete no action;');
    this.addSql('alter table "appointment" drop column "credited_back";');
    this.addSql('alter table "appointment" add constraint "appointment_course_id_foreign" foreign key ("course_id") references "course" ("id") on update cascade on delete set null;');

    this.addSql('alter table "course" add column "description" text not null default null, add column "learning_level" text check ("learning_level" in (\'beginner\', \'intermediate\', \'advanced\')) not null default null;');
    this.addSql('alter table "course" drop column "tutor_id";');
    this.addSql('alter table "course" drop column "start_date";');
    this.addSql('alter table "course" drop column "hours_balance";');
    this.addSql('alter table "course" drop column "needs_renewal";');
  }

}
