import { createZodDto } from 'nestjs-zod';

import {
  calendarTaskListResponseSchema,
  calendarTaskParamsSchema,
  calendarTaskResponseSchema,
  createCalendarTaskRequestSchema,
  listCalendarTasksQuerySchema,
  updateCalendarTaskRequestSchema,
} from '@repo/schemas/calendar-task';

export class CalendarTaskParamsDto extends createZodDto(calendarTaskParamsSchema) {}
export class ListCalendarTasksQueryDto extends createZodDto(listCalendarTasksQuerySchema) {}
export class CreateCalendarTaskRequestDto extends createZodDto(createCalendarTaskRequestSchema) {}
export class UpdateCalendarTaskRequestDto extends createZodDto(updateCalendarTaskRequestSchema) {}
export class CalendarTaskResponseDto extends createZodDto(calendarTaskResponseSchema) {}
export class CalendarTaskListResponseDto extends createZodDto(calendarTaskListResponseSchema) {}
