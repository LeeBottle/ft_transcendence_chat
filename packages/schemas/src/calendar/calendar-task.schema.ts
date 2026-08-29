import { z } from 'zod';

import { CalendarTaskStatus } from '@repo/constants/calendar-task';

const CALENDAR_TASK_TITLE_MAX_LENGTH = 255;
const MAX_LIST_RANGE_MILLISECONDS = 366 * 24 * 60 * 60 * 1000;
const UNSIGNED_BIGINT_MAX = 18_446_744_073_709_551_615n;

const calendarTaskStatusSchema = z.union([
  z.literal(CalendarTaskStatus.PENDING),
  z.literal(CalendarTaskStatus.IN_PROGRESS),
  z.literal(CalendarTaskStatus.COMPLETED),
]);

const calendarTaskTitleSchema = z
  .string()
  .trim()
  .min(1, '태스크 제목을 입력해 주세요.')
  .max(
    CALENDAR_TASK_TITLE_MAX_LENGTH,
    `태스크 제목은 ${CALENDAR_TASK_TITLE_MAX_LENGTH}자 이하여야 합니다.`,
  );

const requestDateTimeSchema = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value).toISOString());

const responseDateTimeSchema = z.iso.datetime();

export const calendarTaskIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, '태스크 ID는 양의 정수 문자열이어야 합니다.')
  .refine((value) => BigInt(value) <= UNSIGNED_BIGINT_MAX, {
    message: '태스크 ID가 BIGINT UNSIGNED 범위를 벗어났습니다.',
  });

export const calendarTaskParamsSchema = z
  .object({
    taskId: calendarTaskIdSchema,
  })
  .strict();
export type CalendarTaskParams = z.infer<typeof calendarTaskParamsSchema>;

export const createCalendarTaskRequestSchema = z
  .object({
    title: calendarTaskTitleSchema,
    startedAt: requestDateTimeSchema,
    dueAt: requestDateTimeSchema,
  })
  .strict()
  .superRefine(({ startedAt, dueAt }, ctx) => {
    if (dueAt < startedAt) {
      ctx.addIssue({
        code: 'custom',
        message: '마감 시각은 시작 시각보다 빠를 수 없습니다.',
        path: ['dueAt'],
      });
    }
  });
export type CreateCalendarTaskRequest = z.infer<typeof createCalendarTaskRequestSchema>;

export const updateCalendarTaskRequestSchema = z
  .object({
    title: calendarTaskTitleSchema.optional(),
    startedAt: requestDateTimeSchema.optional(),
    dueAt: requestDateTimeSchema.optional(),
  })
  .strict()
  .superRefine(({ title, startedAt, dueAt }, ctx) => {
    if (title === undefined && startedAt === undefined && dueAt === undefined) {
      ctx.addIssue({ code: 'custom', message: '수정할 필드를 하나 이상 입력해 주세요.' });
    }

    if (startedAt !== undefined && dueAt !== undefined && dueAt < startedAt) {
      ctx.addIssue({
        code: 'custom',
        message: '마감 시각은 시작 시각보다 빠를 수 없습니다.',
        path: ['dueAt'],
      });
    }
  });
export type UpdateCalendarTaskRequest = z.infer<typeof updateCalendarTaskRequestSchema>;

export const updateCalendarTaskCompletionRequestSchema = z
  .object({
    completed: z.boolean(),
  })
  .strict();
export type UpdateCalendarTaskCompletionRequest = z.infer<
  typeof updateCalendarTaskCompletionRequestSchema
>;

export const listCalendarTasksQuerySchema = z
  .object({
    from: requestDateTimeSchema,
    to: requestDateTimeSchema,
    status: z.coerce.number().pipe(calendarTaskStatusSchema).optional(),
  })
  .strict()
  .superRefine(({ from, to }, ctx) => {
    const fromTime = new Date(from).getTime();
    const toTime = new Date(to).getTime();

    if (toTime <= fromTime) {
      ctx.addIssue({
        code: 'custom',
        message: '조회 종료 시각은 시작 시각보다 늦어야 합니다.',
        path: ['to'],
      });

      return;
    }

    if (toTime - fromTime > MAX_LIST_RANGE_MILLISECONDS) {
      ctx.addIssue({
        code: 'custom',
        message: '한 번에 조회할 수 있는 기간은 최대 366일입니다.',
        path: ['to'],
      });
    }
  });
export type ListCalendarTasksQuery = z.infer<typeof listCalendarTasksQuerySchema>;

export const calendarTaskResponseSchema = z
  .object({
    id: calendarTaskIdSchema,
    title: calendarTaskTitleSchema,
    startedAt: responseDateTimeSchema,
    dueAt: responseDateTimeSchema,
    completedAt: responseDateTimeSchema.nullable(),
    status: calendarTaskStatusSchema,
    createdAt: responseDateTimeSchema,
    updatedAt: responseDateTimeSchema,
  })
  .strict();
export type CalendarTaskResponse = z.infer<typeof calendarTaskResponseSchema>;

export const calendarTaskListResponseSchema = z.array(calendarTaskResponseSchema);
export type CalendarTaskListResponse = z.infer<typeof calendarTaskListResponseSchema>;
