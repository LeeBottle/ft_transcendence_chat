import { z } from 'zod';

const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, '올바른 16진수 색상 코드 형식(#RRGGBB)이어야 합니다.')
  .transform((val) => val.toUpperCase());
const memoSchema = z.string().max(255);

const calendarTaskTitleSchema = z
  .string()
  .trim()
  .min(1, '태스크 제목을 입력해 주세요.')
  .max(255, '태스크 제목은 255자 이하여야 합니다.');

export const getTasksRequestSchema = z
  .object({
    startAt: z.iso.datetime({ offset: true }),
    dueAt: z.iso.datetime({ offset: true }),
  })
  .refine((data) => new Date(data.startAt).getTime() <= new Date(data.dueAt).getTime(), {
    error: 'startAt은 dueAt보다 이전 시점이어야 합니다.',
    path: ['dueAt'],
  });
export type GetTasksRequest = z.infer<typeof getTasksRequestSchema>;

export const getTasksResponseSchema = z.object({
  userId: z.string().min(1),
  tasks: z.array(
    z.object({
      id: z.string(),
      title: calendarTaskTitleSchema,
      startAt: z.iso.datetime(),
      dueAt: z.iso.datetime(),
      completedAt: z.iso.datetime().nullable(),
      color: z.string(),
      memo: z.string().max(255),
      createdAt: z.iso.datetime(),
    }),
  ),
});
export type GetTasksResponse = z.infer<typeof getTasksResponseSchema>;

export const createTaskRequestSchema = z.object({
  userId: z.string().min(1),
  title: calendarTaskTitleSchema,
  startAt: z.iso.datetime({ offset: true }),
  dueAt: z.iso.datetime({ offset: true }),
  color: colorSchema.optional(),
  memo: memoSchema.optional(),
});
export type CreateTaskRequest = z.infer<typeof createTaskRequestSchema>;

export const createTaskResponseSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  title: calendarTaskTitleSchema,
  startAt: z.iso.datetime(),
  dueAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable(),
  color: colorSchema,
  memo: memoSchema,
  createdAt: z.iso.datetime(),
});
export type CreateTaskResponse = z.infer<typeof createTaskResponseSchema>;

export const taskIdParamSchema = z.object({ taskId: z.string().regex(/^[1-9]\d*$/) });
export type TaskIdParam = z.infer<typeof taskIdParamSchema>;

export const updateCalendarTaskRequestSchema = z.object({
  title: calendarTaskTitleSchema.optional(),
  startAt: z.iso.datetime({ offset: true }).optional(),
  dueAt: z.iso.datetime({ offset: true }).optional(),
  isCompleted: z.boolean().optional(),
  color: colorSchema,
  memo: memoSchema.optional(),
});
export type UpdateCalendarTaskRequest = z.infer<typeof updateCalendarTaskRequestSchema>;

export const updateCalendarTaskResponseSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  title: calendarTaskTitleSchema,
  startAt: z.iso.datetime(),
  dueAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable(),
  color: colorSchema,
  memo: memoSchema,
});
export type UpdateCalendarTaskResponse = z.infer<typeof updateCalendarTaskResponseSchema>;
