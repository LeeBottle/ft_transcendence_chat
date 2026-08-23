import { createZodDto } from 'nestjs-zod';

import {
  calendarTaskListResponseSchema,
  calendarTaskResponseSchema,
  createCalendarTaskRequestSchema,
  listCalendarTasksQuerySchema,
} from '@repo/schemas/calendar-task';

export class ListCalendarTasksQueryDto extends createZodDto(listCalendarTasksQuerySchema) {}
export class CreateCalendarTaskRequestDto extends createZodDto(createCalendarTaskRequestSchema) {}
export class CalendarTaskResponseDto extends createZodDto(calendarTaskResponseSchema) {}
export class CalendarTaskListResponseDto extends createZodDto(calendarTaskListResponseSchema) {}
