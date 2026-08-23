import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { FindOperator, type FindManyOptions } from 'typeorm';

import { CalendarTaskStatus } from '@repo/constants/calendar-task';

import type { CalendarTaskEntity } from '#modules/calendar/entities/calendar-task.entity.js';
import {
  CalendarService,
  type CalendarTaskRepository,
} from '#modules/calendar/services/calendar.service.js';

const NOW = new Date('2026-08-23T12:00:00Z');

function createTask(id: string, startedAt: string, completedAt: string | null): CalendarTaskEntity {
  return {
    id,
    userId: '42',
    title: `태스크 ${id}`,
    startedAt: new Date(startedAt),
    dueAt: new Date('2026-08-24T00:00:00Z'),
    completedAt: completedAt === null ? null : new Date(completedAt),
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
  };
}

function createRepository(tasks: CalendarTaskEntity[]): {
  readonly repository: CalendarTaskRepository;
  readonly getFindOptions: () => FindManyOptions<CalendarTaskEntity>;
} {
  let findOptions: FindManyOptions<CalendarTaskEntity> | undefined;
  const repository: CalendarTaskRepository = {
    create: () => {
      throw new Error('Unexpected create call');
    },
    save: async (task) => await Promise.resolve(task),
    softRemove: async (task) => await Promise.resolve(task),
    find: async (options) => {
      findOptions = options;

      return await Promise.resolve(tasks);
    },
    findOne: async () => await Promise.resolve(null),
  };

  return {
    repository,
    getFindOptions: () => {
      assert.ok(findOptions !== undefined);

      return findOptions;
    },
  };
}

function assertOperator(value: unknown, type: string): FindOperator<unknown> {
  assert.ok(value instanceof FindOperator);
  assert.equal(value.type, type);

  return value;
}

void describe('CalendarService.findAll', () => {
  void it('scopes overlap queries to the authenticated user and stable order', async () => {
    const tasks = [
      createTask('1', '2026-08-23T13:00:00Z', null),
      createTask('2', '2026-08-23T10:00:00Z', null),
      createTask('3', '2026-08-23T09:00:00Z', '2026-08-23T11:00:00Z'),
    ];
    const { repository, getFindOptions } = createRepository(tasks);
    const service = new CalendarService(repository);

    const response = await service.findAll(
      '42',
      {
        from: '2026-08-01T00:00:00.000Z',
        to: '2026-09-01T00:00:00.000Z',
      },
      NOW,
    );
    const options = getFindOptions();
    const where = options.where;

    assert.ok(where !== undefined && !Array.isArray(where));
    assert.equal(where.userId, '42');
    assertOperator(where.startedAt, 'lessThan');
    assertOperator(where.dueAt, 'moreThanOrEqual');
    assert.deepEqual(options.order, { startedAt: 'ASC', id: 'ASC' });
    assert.deepEqual(
      response.map((task) => task.status),
      [CalendarTaskStatus.PENDING, CalendarTaskStatus.IN_PROGRESS, CalendarTaskStatus.COMPLETED],
    );
  });

  void it('adds the expected derived-status predicates', async () => {
    const statusCases = [
      {
        status: CalendarTaskStatus.PENDING,
        startedAtOperators: ['lessThan', 'moreThan'],
        completedAtOperator: 'isNull',
      },
      {
        status: CalendarTaskStatus.IN_PROGRESS,
        startedAtOperators: ['lessThan', 'lessThanOrEqual'],
        completedAtOperator: 'isNull',
      },
      {
        status: CalendarTaskStatus.COMPLETED,
        startedAtOperators: null,
        completedAtOperator: 'not',
      },
    ] as const;

    await Promise.all(
      statusCases.map(async (statusCase) => {
        const { repository, getFindOptions } = createRepository([]);
        const service = new CalendarService(repository);

        await service.findAll(
          '42',
          {
            from: '2026-08-01T00:00:00.000Z',
            to: '2026-09-01T00:00:00.000Z',
            status: statusCase.status,
          },
          NOW,
        );

        const where = getFindOptions().where;

        assert.ok(where !== undefined && !Array.isArray(where));
        assertOperator(where.completedAt, statusCase.completedAtOperator);

        if (statusCase.startedAtOperators !== null) {
          const andOperator = assertOperator(where.startedAt, 'and');
          const childOperators = andOperator.value;

          assert.ok(Array.isArray(childOperators));
          assert.deepEqual(
            childOperators.map((operator) => {
              assert.ok(operator instanceof FindOperator);

              return operator.type;
            }),
            statusCase.startedAtOperators,
          );
        }
      }),
    );
  });
});
