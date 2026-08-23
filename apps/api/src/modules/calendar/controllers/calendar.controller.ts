import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '#modules/auth/guards/jwt-auth.guard.js';
import type { JwtPayload } from '#modules/auth/strategies/jwt.strategy.js';
import { CalendarService } from '#modules/calendar/services/calendar.service.js';

import {
  CalendarTaskListResponseDto,
  CalendarTaskParamsDto,
  CalendarTaskResponseDto,
  CreateCalendarTaskRequestDto,
  ListCalendarTasksQueryDto,
  UpdateCalendarTaskCompletionRequestDto,
  UpdateCalendarTaskRequestDto,
} from './calendar.dto.js';

type AuthenticatedRequest = Request & { user: JwtPayload };

@UseGuards(JwtAuthGuard)
@Controller('calendar/tasks')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListCalendarTasksQueryDto,
  ): Promise<CalendarTaskListResponseDto> {
    return await this.calendarService.findAll(request.user.sub, query);
  }

  @Get(':taskId')
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param() params: CalendarTaskParamsDto,
  ): Promise<CalendarTaskResponseDto> {
    return await this.calendarService.findOne(request.user.sub, params.taskId);
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCalendarTaskRequestDto,
  ): Promise<CalendarTaskResponseDto> {
    return await this.calendarService.create(request.user.sub, dto);
  }

  @Patch(':taskId')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param() params: CalendarTaskParamsDto,
    @Body() dto: UpdateCalendarTaskRequestDto,
  ): Promise<CalendarTaskResponseDto> {
    return await this.calendarService.update(request.user.sub, params.taskId, dto);
  }

  @Patch(':taskId/completion')
  async updateCompletion(
    @Req() request: AuthenticatedRequest,
    @Param() params: CalendarTaskParamsDto,
    @Body() dto: UpdateCalendarTaskCompletionRequestDto,
  ): Promise<CalendarTaskResponseDto> {
    return await this.calendarService.updateCompletion(request.user.sub, params.taskId, dto);
  }

  @Delete(':taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param() params: CalendarTaskParamsDto,
  ): Promise<void> {
    await this.calendarService.remove(request.user.sub, params.taskId);
  }
}
