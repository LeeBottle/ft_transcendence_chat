import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { DeepPartial } from 'typeorm';

import { CalendarTaskStatus } from '@repo/constants/calendar-task';

import { CalendarTaskEntity } from '#modules/calendar/entities/calendar-task.entity.js';
import {
  CalendarService,
  type CalendarTaskRepository,
} from '#modules/calendar/services/calendar.service.js';

void describe('CalendarService.create', () => {
  void it('uses the authenticated user id and returns a UTC response', async () => {
    let createInput: DeepPartial<CalendarTaskEntity> | undefined;
    const createdAt = new Date('2026-08-23T00:00:00Z');
    const createdTask: CalendarTaskEntity = {
      id: '0',
      userId: '42',
      title: '회의',
      startedAt: new Date('2099-08-23T01:00:00Z'),
      dueAt: new Date('2099-08-23T02:00:00Z'),
      completedAt: null,
      createdAt,
      updatedAt: createdAt,
      deletedAt: null,
    };
    const repository: CalendarTaskRepository = {
      create: (input) => {
        createInput = input;

        return createdTask;
      },
      save: async (task) => {
        return await Promise.resolve(Object.assign(new CalendarTaskEntity(), task, { id: '7' }));
      },
      softRemove: async (task) => await Promise.resolve(task),
      find: async () => await Promise.resolve([]),
      findOne: async () => await Promise.resolve(null),
    };
    const service = new CalendarService(repository);

    const response = await service.create('42', {
      title: '회의',
      startedAt: '2099-08-23T01:00:00.000Z',
      dueAt: '2099-08-23T02:00:00.000Z',
    });

    assert.ok(createInput !== undefined);
    assert.equal(createInput.userId, '42');
    assert.ok(createInput.startedAt instanceof Date);
    assert.ok(createInput.dueAt instanceof Date);
    assert.equal(createInput.completedAt, null);
    assert.deepEqual(response, {
      id: '7',
      title: '회의',
      startedAt: '2099-08-23T01:00:00.000Z',
      dueAt: '2099-08-23T02:00:00.000Z',
      completedAt: null,
      status: CalendarTaskStatus.PENDING,
      createdAt: '2026-08-23T00:00:00.000Z',
      updatedAt: '2026-08-23T00:00:00.000Z',
    });
    assert.equal('userId' in response, false);
  });
});
