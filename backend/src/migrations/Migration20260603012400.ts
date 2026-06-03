import { Migration } from "@mikro-orm/migrations";

export class Migration20260603012400 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "lesson" add column "original_start_time" timestamptz(0) null;',
    );
  }

  async down(): Promise<void> {
    this.addSql('alter table "lesson" drop column "original_start_time";');
  }
}
