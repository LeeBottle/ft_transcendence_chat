import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  AddCalendarTaskRangeIndex1787564726192,
  type SqlQueryRunner,
} from '#database/migrations/1787564726192-AddCalendarTaskRangeIndex.js';

function createQueryRunner(queries: string[]): SqlQueryRunner {
  const queryRunner: SqlQueryRunner = {
    query: async (query: string) => {
      queries.push(query.replaceAll(/\s+/g, ' ').trim());

      return await Promise.resolve(queries.length);
    },
  };

  return queryRunner;
}

void describe('AddCalendarTaskRangeIndex migration', () => {
  void it('creates and removes the owner-scoped active range index', async () => {
    const queries: string[] = [];
    const migration = new AddCalendarTaskRangeIndex1787564726192();
    const queryRunner = createQueryRunner(queries);

    await migration.up(queryRunner);
    await migration.down(queryRunner);

    assert.equal(
      queries[0],
      'CREATE INDEX idx_calendar_tasks_user_deleted_started_due ON calendar_tasks (user_id, deleted_at, started_at, due_at)',
    );
    assert.equal(
      queries[1],
      'DROP INDEX idx_calendar_tasks_user_deleted_started_due ON calendar_tasks',
    );
  });
});
