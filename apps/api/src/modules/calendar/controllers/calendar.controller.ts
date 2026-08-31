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
import { CalendarService } from '#modules/calendar/services/calendar.service.js';

import {
  CreateTaskRequestDto,
  CreateTaskResponseDto,
  GetTasksRequestDto,
  GetTasksResponseDto,
  TaskIdParamDto,
  UpdateCalendarTaskRequestDto,
  UpdateCalendarTaskResponseDto,
} from './calendar.dto.js';

@Controller('calendar/tasks')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  async getTasks(
    @CurrentUserId() userId: string,
    @Query() query: GetTasksRequestDto,
  ): Promise<GetTasksResponseDto> {
    const tasks = await this.calendarService.findTasksWithinRange(userId, query);

    return {
      userId,
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        startAt: task.startAt.toISOString(),
        dueAt: task.dueAt.toISOString(),
        completedAt: task.completedAt?.toISOString() ?? null,
        color: task.color,
        memo: task.memo,
        createdAt: task.createdAt.toISOString(),
      })),
    };
  }

  @Post()
  async create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateTaskRequestDto,
  ): Promise<CreateTaskResponseDto> {
    return await this.calendarService.create(userId, dto);
  }

  @Patch(':taskId')
  async update(
    @CurrentUserId() userId: string,
    @Param() params: TaskIdParamDto,
    @Body() dto: UpdateCalendarTaskRequestDto,
  ): Promise<UpdateCalendarTaskResponseDto> {
    return await this.calendarService.update(userId, params.taskId, dto);
  }

  @Delete(':taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUserId() userId: string, @Param() params: TaskIdParamDto): Promise<void> {
    await this.calendarService.delete(userId, params.taskId);
  }
}
