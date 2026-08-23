import { createZodDto } from 'nestjs-zod';

import {
  calendarTaskResponseSchema,
  createCalendarTaskRequestSchema,
} from '@repo/schemas/calendar-task';

export class CreateCalendarTaskRequestDto extends createZodDto(createCalendarTaskRequestSchema) {}
export class CalendarTaskResponseDto extends createZodDto(calendarTaskResponseSchema) {}
