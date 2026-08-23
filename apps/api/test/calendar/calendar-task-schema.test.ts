import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  calendarTaskParamsSchema,
  createCalendarTaskRequestSchema,
  listCalendarTasksQuerySchema,
  updateCalendarTaskRequestSchema,
} from '@repo/schemas/calendar-task';

void describe('calendar task schemas', () => {
  void it('normalizes create input to trimmed text and UTC', () => {
    const parsed = createCalendarTaskRequestSchema.parse({
      title: '  주간 회의  ',
      startedAt: '2026-08-23T09:00:00+09:00',
      dueAt: '2026-08-23T10:00:00+09:00',
    });

    assert.deepEqual(parsed, {
      title: '주간 회의',
      startedAt: '2026-08-23T00:00:00.000Z',
      dueAt: '2026-08-23T01:00:00.000Z',
    });
  });

  void it('rejects reversed dates, missing timezone and client-owned userId', () => {
    assert.equal(
      createCalendarTaskRequestSchema.safeParse({
        title: '회의',
        startedAt: '2026-08-23T02:00:00Z',
        dueAt: '2026-08-23T01:00:00Z',
      }).success,
      false,
    );
    assert.equal(
      createCalendarTaskRequestSchema.safeParse({
        title: '회의',
        startedAt: '2026-08-23T00:00:00',
        dueAt: '2026-08-23T01:00:00',
      }).success,
      false,
    );
    assert.equal(
      createCalendarTaskRequestSchema.safeParse({
        userId: '2',
        title: '회의',
        startedAt: '2026-08-23T00:00:00Z',
        dueAt: '2026-08-23T01:00:00Z',
      }).success,
      false,
    );
  });

  void it('validates positive BIGINT task identifiers', () => {
    assert.equal(calendarTaskParamsSchema.safeParse({ taskId: '1' }).success, true);
    assert.equal(calendarTaskParamsSchema.safeParse({ taskId: '0' }).success, false);
    assert.equal(
      calendarTaskParamsSchema.safeParse({ taskId: '18446744073709551616' }).success,
      false,
    );
  });

  void it('coerces status and enforces a forward range of at most 366 days', () => {
    const parsed = listCalendarTasksQuerySchema.parse({
      from: '2026-01-01T00:00:00Z',
      to: '2026-02-01T00:00:00Z',
      status: '2',
    });

    assert.equal(parsed.status, 2);
    assert.equal(
      listCalendarTasksQuerySchema.safeParse({
        from: '2026-02-01T00:00:00Z',
        to: '2026-01-01T00:00:00Z',
      }).success,
      false,
    );
    assert.equal(
      listCalendarTasksQuerySchema.safeParse({
        from: '2026-01-01T00:00:00Z',
        to: '2027-01-03T00:00:00Z',
      }).success,
      false,
    );
  });

  void it('rejects an empty update request', () => {
    assert.equal(updateCalendarTaskRequestSchema.safeParse({}).success, false);
  });
});
