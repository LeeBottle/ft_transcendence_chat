import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '#modules/auth/guards/jwt-auth.guard.js';
import type { JwtPayload } from '#modules/auth/strategies/jwt.strategy.js';
import { CalendarService } from '#modules/calendar/services/calendar.service.js';

import { CalendarTaskResponseDto, CreateCalendarTaskRequestDto } from './calendar.dto.js';

type AuthenticatedRequest = Request & { user: JwtPayload };

@UseGuards(JwtAuthGuard)
@Controller('calendar/tasks')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCalendarTaskRequestDto,
  ): Promise<CalendarTaskResponseDto> {
    return await this.calendarService.create(request.user.sub, dto);
  }
}
