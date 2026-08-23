import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotFoundException } from '@nestjs/common';

import type { FindOneOptions } from 'typeorm';

import type { CalendarTaskEntity } from '#modules/calendar/entities/calendar-task.entity.js';
import {
  CalendarService,
  type CalendarTaskRepository,
} from '#modules/calendar/services/calendar.service.js';

const TASK: CalendarTaskEntity = {
  id: '7',
  userId: '42',
  title: '회의',
  startedAt: new Date('2026-08-23T10:00:00Z'),
  dueAt: new Date('2026-08-23T11:00:00Z'),
  completedAt: null,
  createdAt: new Date('2026-08-22T00:00:00Z'),
  updatedAt: new Date('2026-08-22T00:00:00Z'),
  deletedAt: null,
};

function createRepository(foundTask: CalendarTaskEntity | null): {
  readonly repository: CalendarTaskRepository;
  readonly getFindOneOptions: () => FindOneOptions<CalendarTaskEntity>;
} {
  let findOneOptions: FindOneOptions<CalendarTaskEntity> | undefined;
  const repository: CalendarTaskRepository = {
    create: () => {
      throw new Error('Unexpected create call');
    },
    save: async (task) => await Promise.resolve(task),
    softRemove: async (task) => await Promise.resolve(task),
    find: async () => await Promise.resolve([]),
    findOne: async (options) => {
      findOneOptions = options;

      return await Promise.resolve(foundTask);
    },
  };

  return {
    repository,
    getFindOneOptions: () => {
      assert.ok(findOneOptions);

      return findOneOptions;
    },
  };
}

void describe('CalendarService.findOne', () => {
  void it('queries by both task id and authenticated user id', async () => {
    const { repository, getFindOneOptions } = createRepository(TASK);
    const service = new CalendarService(repository);

    const response = await service.findOne('42', '7', new Date('2026-08-23T10:30:00Z'));

    assert.deepEqual(getFindOneOptions().where, { id: '7', userId: '42' });
    assert.equal(response.id, '7');
  });

  void it('returns the same not-found error for missing or unowned tasks', async () => {
    const { repository } = createRepository(null);
    const service = new CalendarService(repository);

    await assert.rejects(service.findOne('99', '7'), NotFoundException);
  });
});
