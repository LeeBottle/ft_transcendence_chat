import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BadRequestException } from '@nestjs/common';

import type { CalendarTaskEntity } from '#modules/calendar/entities/calendar-task.entity.js';
import {
  CalendarService,
  type CalendarTaskRepository,
} from '#modules/calendar/services/calendar.service.js';

function createTask(): CalendarTaskEntity {
  return {
    id: '7',
    userId: '42',
    title: '기존 제목',
    startedAt: new Date('2026-08-23T10:00:00Z'),
    dueAt: new Date('2026-08-23T11:00:00Z'),
    completedAt: null,
    createdAt: new Date('2026-08-22T00:00:00Z'),
    updatedAt: new Date('2026-08-22T00:00:00Z'),
    deletedAt: null,
  };
}

function createRepository(task: CalendarTaskEntity): {
  readonly repository: CalendarTaskRepository;
  readonly getSavedTask: () => CalendarTaskEntity | undefined;
} {
  let savedTask: CalendarTaskEntity | undefined;
  const repository: CalendarTaskRepository = {
    create: () => {
      throw new Error('Unexpected create call');
    },
    save: async (target) => {
      savedTask = target;

      return await Promise.resolve(target);
    },
    find: async () => await Promise.resolve([]),
    findOne: async () => await Promise.resolve(task),
  };

  return { repository, getSavedTask: () => savedTask };
}

void describe('CalendarService.update', () => {
  void it('updates only supplied fields and preserves the remaining schedule', async () => {
    const task = createTask();
    const { repository, getSavedTask } = createRepository(task);
    const service = new CalendarService(repository);

    const response = await service.update('42', '7', { title: '새 제목' });

    assert.equal(getSavedTask(), task);
    assert.equal(response.title, '새 제목');
    assert.equal(response.startedAt, '2026-08-23T10:00:00.000Z');
    assert.equal(response.dueAt, '2026-08-23T11:00:00.000Z');
  });

  void it('rejects an invalid final range before saving a partial date patch', async () => {
    const task = createTask();
    const { repository, getSavedTask } = createRepository(task);
    const service = new CalendarService(repository);

    await assert.rejects(
      service.update('42', '7', { startedAt: '2026-08-23T12:00:00.000Z' }),
      BadRequestException,
    );
    assert.equal(getSavedTask(), undefined);
  });
});
