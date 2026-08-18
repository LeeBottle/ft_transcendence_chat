import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import type { Repository } from 'typeorm';

import { CalendarTaskEntity } from '#modules/calendar/entities/calendar-task.entity.js';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarTaskEntity)
    private readonly calendarTaskRepository: Repository<CalendarTaskEntity>,
  ) {}
}
