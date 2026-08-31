import { createZodDto } from 'nestjs-zod';

import { z } from 'zod';

import {
  calendarTaskListResponseSchema,
  calendarTaskParamsSchema,
  calendarTaskResponseSchema,
  createCalendarTaskRequestSchema,
  listCalendarTasksQuerySchema,
  updateCalendarTaskCompletionRequestSchema,
  updateCalendarTaskRequestSchema,
} from '@repo/schemas/calendar';

export class CalendarTaskParamsDto extends createZodDto(calendarTaskParamsSchema) {}
export class ListCalendarTasksQueryDto extends createZodDto(listCalendarTasksQuerySchema) {}
export class CreateCalendarTaskRequestDto extends createZodDto(createCalendarTaskRequestSchema) {}
export class UpdateCalendarTaskRequestDto extends createZodDto(updateCalendarTaskRequestSchema) {}
export class UpdateCalendarTaskCompletionRequestDto extends createZodDto(
  updateCalendarTaskCompletionRequestSchema,
) {}
export class CalendarTaskResponseDto extends createZodDto(calendarTaskResponseSchema) {}
export class CalendarTaskListResponseDto extends createZodDto(calendarTaskListResponseSchema) {}
