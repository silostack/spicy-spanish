import { Migration } from "@mikro-orm/migrations";

export class Migration20260320031525 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "ebook_subscriber" ("id" varchar(255) not null, "email" varchar(255) not null, "created_at" timestamptz(0) not null, constraint "ebook_subscriber_pkey" primary key ("id"));',
    );
    this.addSql(
      'alter table "ebook_subscriber" add constraint "ebook_subscriber_email_unique" unique ("email");',
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "ebook_subscriber" cascade;');
  }
}
