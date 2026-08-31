import { createZodDto } from 'nestjs-zod';

import {
  createTaskRequestSchema,
  createTaskResponseSchema,
  getTasksRequestSchema,
  getTasksResponseSchema,
  taskIdParamSchema,
  updateCalendarTaskRequestSchema,
  updateCalendarTaskResponseSchema,
} from '@repo/schemas/calendar';

export class TaskIdParamDto extends createZodDto(taskIdParamSchema) {}

export class GetTasksRequestDto extends createZodDto(getTasksRequestSchema) {}
export class GetTasksResponseDto extends createZodDto(getTasksResponseSchema) {}
export class CreateTaskRequestDto extends createZodDto(createTaskRequestSchema) {}
export class CreateTaskResponseDto extends createZodDto(createTaskResponseSchema) {}
export class UpdateCalendarTaskRequestDto extends createZodDto(updateCalendarTaskRequestSchema) {}
export class UpdateCalendarTaskResponseDto extends createZodDto(updateCalendarTaskResponseSchema) {}
