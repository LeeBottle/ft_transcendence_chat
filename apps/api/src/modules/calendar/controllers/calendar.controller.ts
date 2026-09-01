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
} from '@nestjs/common';

import { CurrentUserId } from '#common/decorators/current-user.decorator.js';
import { ZodValidateResponse } from '#common/decorators/zod-validation-response.decorator.js';
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

@Controller('calendar/tasks')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @ZodValidateResponse(CalendarTaskListResponseDto)
  async findAll(
    @CurrentUserId() userId: string,
    @Query() query: ListCalendarTasksQueryDto,
  ): Promise<CalendarTaskListResponseDto> {
    return await this.calendarService.findAll(userId, query);
  }

  @Get(':taskId')
  @ZodValidateResponse(CalendarTaskResponseDto)
  async findOne(
    @CurrentUserId() userId: string,
    @Param() params: CalendarTaskParamsDto,
  ): Promise<CalendarTaskResponseDto> {
    return await this.calendarService.findOne(userId, params.taskId);
  }

  @Post()
  @ZodValidateResponse(CalendarTaskResponseDto)
  async create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateCalendarTaskRequestDto,
  ): Promise<CalendarTaskResponseDto> {
    return await this.calendarService.create(userId, dto);
  }

  @Patch(':taskId')
  @ZodValidateResponse(CalendarTaskResponseDto)
  async update(
    @CurrentUserId() userId: string,
    @Param() params: CalendarTaskParamsDto,
    @Body() dto: UpdateCalendarTaskRequestDto,
  ): Promise<CalendarTaskResponseDto> {
    return await this.calendarService.update(userId, params.taskId, dto);
  }

  @Patch(':taskId/completion')
  @ZodValidateResponse(CalendarTaskResponseDto)
  async updateCompletion(
    @CurrentUserId() userId: string,
    @Param() params: CalendarTaskParamsDto,
    @Body() dto: UpdateCalendarTaskCompletionRequestDto,
  ): Promise<CalendarTaskResponseDto> {
    return await this.calendarService.updateCompletion(userId, params.taskId, dto);
  }

  @Delete(':taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUserId() userId: string,
    @Param() params: CalendarTaskParamsDto,
  ): Promise<void> {
    await this.calendarService.remove(userId, params.taskId);
  }
}
