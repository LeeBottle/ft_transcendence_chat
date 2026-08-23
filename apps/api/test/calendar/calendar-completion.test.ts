import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { CalendarTaskEntity } from '#modules/calendar/entities/calendar-task.entity.js';
import {
  CalendarService,
  type CalendarTaskRepository,
} from '#modules/calendar/services/calendar.service.js';

function createTask(completedAt: Date | null = null): CalendarTaskEntity {
  return {
    id: '7',
    userId: '42',
    title: '캘린더 백엔드',
    startedAt: new Date('2026-08-23T10:00:00Z'),
    dueAt: new Date('2026-08-23T11:00:00Z'),
    completedAt,
    createdAt: new Date('2026-08-22T00:00:00Z'),
    updatedAt: new Date('2026-08-22T00:00:00Z'),
    deletedAt: null,
  };
}

function createRepository(task: CalendarTaskEntity): {
  readonly repository: CalendarTaskRepository;
  readonly getSaveCount: () => number;
} {
  let saveCount = 0;
  const repository: CalendarTaskRepository = {
    create: () => {
      throw new Error('Unexpected create call');
    },
    save: async (target) => {
      saveCount += 1;

      return await Promise.resolve(target);
    },
    softRemove: async (target) => await Promise.resolve(target),
    find: async () => await Promise.resolve([]),
    findOne: async () => await Promise.resolve(task),
  };

  return { repository, getSaveCount: () => saveCount };
}

void describe('CalendarService.updateCompletion', () => {
  void it('completes a task at the supplied server time', async () => {
    const task = createTask();
    const { repository, getSaveCount } = createRepository(task);
    const service = new CalendarService(repository);
    const now = new Date('2026-08-23T12:00:00Z');

    const response = await service.updateCompletion('42', '7', { completed: true }, now);

    assert.equal(task.completedAt, now);
    assert.equal(response.completedAt, '2026-08-23T12:00:00.000Z');
    assert.equal(response.status, 3);
    assert.equal(getSaveCount(), 1);
  });

  void it('reopens a completed task', async () => {
    const task = createTask(new Date('2026-08-23T11:30:00Z'));
    const { repository, getSaveCount } = createRepository(task);
    const service = new CalendarService(repository);

    const response = await service.updateCompletion(
      '42',
      '7',
      { completed: false },
      new Date('2026-08-23T12:00:00Z'),
    );

    assert.equal(task.completedAt, null);
    assert.equal(response.completedAt, null);
    assert.equal(response.status, 2);
    assert.equal(getSaveCount(), 1);
  });

  void it('does not rewrite an unchanged completion state', async () => {
    const completedAt = new Date('2026-08-23T11:30:00Z');
    const task = createTask(completedAt);
    const { repository, getSaveCount } = createRepository(task);
    const service = new CalendarService(repository);

    const response = await service.updateCompletion(
      '42',
      '7',
      { completed: true },
      new Date('2026-08-23T12:00:00Z'),
    );

    assert.equal(task.completedAt, completedAt);
    assert.equal(response.completedAt, '2026-08-23T11:30:00.000Z');
    assert.equal(getSaveCount(), 0);
  });
});
