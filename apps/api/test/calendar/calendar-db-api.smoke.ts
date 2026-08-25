import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it, type TestContext } from 'node:test';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { DataSource } from 'typeorm';
import { z } from 'zod';

import { CalendarTaskStatus } from '@repo/constants/calendar-task';
import { loginUserResponseSchema } from '@repo/schemas/auth';
import {
  calendarTaskListResponseSchema,
  calendarTaskResponseSchema,
} from '@repo/schemas/calendar-task';

import { AppModule } from '#app.module.js';
import { UserLoginHistoryEntity } from '#modules/auth/entities/user-login-history.entity.js';
import { CalendarTaskEntity } from '#modules/calendar/entities/calendar-task.entity.js';
import { UserEntity } from '#modules/user/entities/user.entity.js';

const LOCAL_DATABASE_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);
const RANGE_INDEX_NAME = 'idx_calendar_tasks_user_deleted_started_due';
const RANGE_INDEX_COLUMNS = ['user_id', 'deleted_at', 'started_at', 'due_at'];
const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
const loginId = `cal1${suffix}`;
const email = `calendar-smoke-${suffix}@example.test`;
const password = 'Test1234!';

interface HttpResult {
  readonly status: number;
  readonly body: unknown;
}

interface RequestOptions {
  readonly method?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: unknown;
}

let app: NestExpressApplication | undefined;
let dataSource: DataSource | undefined;
let baseUrl: string | undefined;

function assertSafeEnvironment(): void {
  const databaseHost = process.env.DB_HOST;

  assert.equal(
    process.env.NODE_ENV,
    'test',
    'The calendar smoke test only runs with NODE_ENV=test.',
  );
  assert.ok(
    databaseHost !== undefined && LOCAL_DATABASE_HOSTS.has(databaseHost),
    'The calendar smoke test only runs against a local database host.',
  );
}

function getBaseUrl(): string {
  assert.ok(baseUrl !== undefined);

  return baseUrl;
}

function getDataSource(): DataSource {
  assert.ok(dataSource !== undefined);
  assert.equal(dataSource.isInitialized, true);

  return dataSource;
}

async function request(path: string, options: RequestOptions = {}): Promise<HttpResult> {
  const hasBody = options.body !== undefined;
  const response = await fetch(`${getBaseUrl()}${path}`, {
    method: options.method,
    headers: {
      ...(hasBody ? { 'content-type': 'application/json' } : {}),
      ...options.headers,
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  let body: unknown = null;

  if (text.length > 0) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = text;
    }
  }

  return { status: response.status, body };
}

function assertStatus(
  context: TestContext,
  label: string,
  result: HttpResult,
  expectedStatus: number,
): void {
  assert.equal(result.status, expectedStatus, `${label} returned an unexpected status.`);
  context.diagnostic(`${label}=${result.status}`);
}

async function cleanupTestData(): Promise<boolean> {
  if (dataSource?.isInitialized !== true) {
    return true;
  }

  const userRepository = dataSource.getRepository(UserEntity);
  const calendarRepository = dataSource.getRepository(CalendarTaskEntity);
  const loginHistoryRepository = dataSource.getRepository(UserLoginHistoryEntity);
  const user = await userRepository.findOne({ where: { loginId }, withDeleted: true });

  await loginHistoryRepository.delete({ attemptedIdentifier: loginId });

  if (user === null) {
    return true;
  }

  await calendarRepository.delete({ userId: user.id });
  await loginHistoryRepository.delete({ userId: user.id });
  await userRepository.delete({ id: user.id });

  return (await userRepository.count({ where: { id: user.id }, withDeleted: true })) === 0;
}

before(async () => {
  assertSafeEnvironment();

  app = await NestFactory.create<NestExpressApplication>(AppModule, {
    abortOnError: false,
    logger: false,
  });
  app.setGlobalPrefix('api');
  app.set('trust proxy', 1);
  await app.listen(0, '127.0.0.1');

  baseUrl = `${await app.getUrl()}/api`;
  dataSource = app.get(DataSource);
  await cleanupTestData();
});

after(async () => {
  try {
    await cleanupTestData();
  } finally {
    await app?.close();
  }
});

void describe('Calendar Docker DB/API smoke test', () => {
  void it('has the expected range-query index in MySQL', async (context) => {
    const rawRows: unknown = await getDataSource().query(
      `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'calendar_tasks'
          AND INDEX_NAME = ?
        ORDER BY SEQ_IN_INDEX`,
      [RANGE_INDEX_NAME],
    );
    const rows = z.array(z.object({ COLUMN_NAME: z.string() })).parse(rawRows);

    assert.deepEqual(
      rows.map((row) => row.COLUMN_NAME),
      RANGE_INDEX_COLUMNS,
    );
    context.diagnostic(`rangeIndex=${RANGE_INDEX_NAME}`);
  });

  void it('runs the authenticated calendar task lifecycle', async (context) => {
    const unauthorized = await request('/calendar/tasks');

    assertStatus(context, 'unauthorized', unauthorized, 401);

    const register = await request('/auth/register', {
      method: 'POST',
      body: {
        loginId,
        email,
        password,
        passwordConfirm: password,
        name: 'Calendar Tester',
      },
    });

    assertStatus(context, 'register', register, 201);

    const user = await getDataSource().getRepository(UserEntity).findOneByOrFail({ loginId });

    const login = await request('/auth/login', {
      method: 'POST',
      body: { loginId, password },
    });

    assertStatus(context, 'login', login, 200);

    const loginResponse = loginUserResponseSchema.parse(login.body);
    const headers = { authorization: `Bearer ${loginResponse.accessToken}` };

    const now = Date.now();
    const startedAt = new Date(now + 60 * 60 * 1000).toISOString();
    const dueAt = new Date(now + 2 * 60 * 60 * 1000).toISOString();
    const create = await request('/calendar/tasks', {
      method: 'POST',
      headers,
      body: { title: 'Calendar smoke task', startedAt, dueAt },
    });

    assertStatus(context, 'create', create, 201);

    const createdTask = calendarTaskResponseSchema.parse(create.body);

    const from = encodeURIComponent(new Date(now - 60 * 60 * 1000).toISOString());
    const to = encodeURIComponent(new Date(now + 24 * 60 * 60 * 1000).toISOString());
    const list = await request(`/calendar/tasks?from=${from}&to=${to}`, { headers });

    assertStatus(context, 'list', list, 200);

    const listedTasks = calendarTaskListResponseSchema.parse(list.body);

    assert.ok(listedTasks.some((task) => task.id === createdTask.id));

    const read = await request(`/calendar/tasks/${createdTask.id}`, { headers });

    assertStatus(context, 'read', read, 200);
    calendarTaskResponseSchema.parse(read.body);

    const update = await request(`/calendar/tasks/${createdTask.id}`, {
      method: 'PATCH',
      headers,
      body: { title: 'Calendar smoke task updated' },
    });

    assertStatus(context, 'update', update, 200);

    const updatedTask = calendarTaskResponseSchema.parse(update.body);

    assert.equal(updatedTask.title, 'Calendar smoke task updated');

    const complete = await request(`/calendar/tasks/${createdTask.id}/completion`, {
      method: 'PATCH',
      headers,
      body: { completed: true },
    });

    assertStatus(context, 'complete', complete, 200);

    const completedTask = calendarTaskResponseSchema.parse(complete.body);

    assert.equal(completedTask.status, CalendarTaskStatus.COMPLETED);
    assert.notEqual(completedTask.completedAt, null);

    const reopen = await request(`/calendar/tasks/${createdTask.id}/completion`, {
      method: 'PATCH',
      headers,
      body: { completed: false },
    });

    assertStatus(context, 'reopen', reopen, 200);

    const reopenedTask = calendarTaskResponseSchema.parse(reopen.body);

    assert.equal(reopenedTask.status, CalendarTaskStatus.PENDING);
    assert.equal(reopenedTask.completedAt, null);

    const remove = await request(`/calendar/tasks/${createdTask.id}`, {
      method: 'DELETE',
      headers,
    });

    assertStatus(context, 'delete', remove, 204);
    assert.equal(remove.body, null);

    const readAfterDelete = await request(`/calendar/tasks/${createdTask.id}`, { headers });

    assertStatus(context, 'readAfterDelete', readAfterDelete, 404);

    const deletedTask = await getDataSource()
      .getRepository(CalendarTaskEntity)
      .findOne({
        where: { id: createdTask.id, userId: user.id },
        withDeleted: true,
      });

    assert.notEqual(deletedTask, null);
    assert.notEqual(deletedTask?.deletedAt, null);
    context.diagnostic('softDeletePersisted=true');

    assert.equal(await cleanupTestData(), true);
    context.diagnostic('cleanup=true');
  });
});
