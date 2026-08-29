import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCalendarTaskRangeIndex1788350000000 implements MigrationInterface {
  name = 'AddCalendarTaskRangeIndex1788350000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/* sql */ `
      CREATE INDEX \`idx_calendar_tasks_user_deleted_started_due\` ON \`calendar_tasks\` (\`user_id\`, \`deleted_at\`, \`started_at\`, \`due_at\`)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(/* sql */ `
      DROP INDEX \`idx_calendar_tasks_user_deleted_started_due\` ON \`calendar_tasks\`
    `);
  }
}
