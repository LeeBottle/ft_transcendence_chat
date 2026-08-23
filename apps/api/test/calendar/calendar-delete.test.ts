import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotFoundException } from '@nestjs/common';

import type { FindOneOptions } from 'typeorm';

import type { CalendarTaskEntity } from '#modules/calendar/entities/calendar-task.entity.js';
import {
  CalendarService,
  type CalendarTaskRepository,
} from '#modules/calendar/services/calendar.service.js';

function createTask(): CalendarTaskEntity {
  return {
    id: '7',
    userId: '42',
    title: '삭제할 태스크',
    startedAt: new Date('2026-08-23T10:00:00Z'),
    dueAt: new Date('2026-08-23T11:00:00Z'),
    completedAt: null,
    createdAt: new Date('2026-08-22T00:00:00Z'),
    updatedAt: new Date('2026-08-22T00:00:00Z'),
    deletedAt: null,
  };
}

void describe('CalendarService.remove', () => {
  void it('soft-deletes only the task found by both owner and task id', async () => {
    const task = createTask();
    let findOneOptions: FindOneOptions<CalendarTaskEntity> | undefined;
    let removedTask: CalendarTaskEntity | undefined;
    const repository: CalendarTaskRepository = {
      create: () => {
        throw new Error('Unexpected create call');
      },
      save: async (target) => await Promise.resolve(target),
      softRemove: async (target) => {
        removedTask = target;

        return await Promise.resolve(target);
      },
      find: async () => await Promise.resolve([]),
      findOne: async (options) => {
        findOneOptions = options;

        return await Promise.resolve(task);
      },
    };
    const service = new CalendarService(repository);

    await service.remove('42', '7');

    assert.deepEqual(findOneOptions?.where, { id: '7', userId: '42' });
    assert.equal(removedTask, task);
  });

  void it('returns not found without deleting when the task is absent or already deleted', async () => {
    let softRemoveCount = 0;
    const repository: CalendarTaskRepository = {
      create: () => {
        throw new Error('Unexpected create call');
      },
      save: async (target) => await Promise.resolve(target),
      softRemove: async (target) => {
        softRemoveCount += 1;

        return await Promise.resolve(target);
      },
      find: async () => await Promise.resolve([]),
      findOne: async () => await Promise.resolve(null),
    };
    const service = new CalendarService(repository);

    await assert.rejects(service.remove('42', '7'), NotFoundException);
    assert.equal(softRemoveCount, 0);
  });
});
