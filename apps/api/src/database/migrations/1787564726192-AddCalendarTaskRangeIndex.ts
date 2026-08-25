import type { MigrationInterface } from 'typeorm';

export interface SqlQueryRunner {
  readonly query: (query: string) => Promise<unknown>;
}

export class AddCalendarTaskRangeIndex1787564726192 implements MigrationInterface {
  name = 'AddCalendarTaskRangeIndex1787564726192';

  async up(queryRunner: SqlQueryRunner): Promise<void> {
    await queryRunner.query(/* sql */ `
      CREATE INDEX idx_calendar_tasks_user_deleted_started_due ON calendar_tasks (user_id, deleted_at, started_at, due_at)
    `);
  }

  async down(queryRunner: SqlQueryRunner): Promise<void> {
    await queryRunner.query(/* sql */ `
      DROP INDEX idx_calendar_tasks_user_deleted_started_due ON calendar_tasks
    `);
  }
}
