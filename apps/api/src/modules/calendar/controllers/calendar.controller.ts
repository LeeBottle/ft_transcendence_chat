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
  UnauthorizedException,
} from '@nestjs/common';

import type { Request } from 'express';

import type { AuthenticatedUser } from '@repo/schemas/auth';

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

// 전역 JwtAuthGuard 가 토큰 검증 후 req.user = { id, loginId, role } 를 채워준다.
function extractUserId(req: Request): string {
  const user = (req as Request & { user?: AuthenticatedUser }).user;

  if (typeof user?.id === 'string' && user.id.length > 0) {
    return user.id;
  }

  throw new UnauthorizedException('인증 정보가 유효하지 않습니다.');
}

@Controller('calendar/tasks')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  async findAll(
    @Req() req: Request,
    @Query() query: ListCalendarTasksQueryDto,
  ): Promise<CalendarTaskListResponseDto> {
    return await this.calendarService.findAll(extractUserId(req), query);
  }

  @Get(':taskId')
  async findOne(
    @Req() req: Request,
    @Param() params: CalendarTaskParamsDto,
  ): Promise<CalendarTaskResponseDto> {
    return await this.calendarService.findOne(extractUserId(req), params.taskId);
  }

  @Post()
  async create(
    @Req() req: Request,
    @Body() dto: CreateCalendarTaskRequestDto,
  ): Promise<CalendarTaskResponseDto> {
    return await this.calendarService.create(extractUserId(req), dto);
  }

  @Patch(':taskId')
  async update(
    @Req() req: Request,
    @Param() params: CalendarTaskParamsDto,
    @Body() dto: UpdateCalendarTaskRequestDto,
  ): Promise<CalendarTaskResponseDto> {
    return await this.calendarService.update(extractUserId(req), params.taskId, dto);
  }

  @Patch(':taskId/completion')
  async updateCompletion(
    @Req() req: Request,
    @Param() params: CalendarTaskParamsDto,
    @Body() dto: UpdateCalendarTaskCompletionRequestDto,
  ): Promise<CalendarTaskResponseDto> {
    return await this.calendarService.updateCompletion(extractUserId(req), params.taskId, dto);
  }

  @Delete(':taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param() params: CalendarTaskParamsDto): Promise<void> {
    await this.calendarService.remove(extractUserId(req), params.taskId);
  }
}
