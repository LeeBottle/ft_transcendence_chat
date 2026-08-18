import { Controller } from '@nestjs/common';

import { CalendarService } from '#modules/calendar/services/calendar.service.js';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}
}
