import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

import { CalendarTaskStatus } from '@repo/constants/calendar-task';

import type {
  CreateTaskRequestDto,
  CreateTaskResponseDto,
  GetTasksRequestDto,
  UpdateCalendarTaskRequestDto,
  UpdateCalendarTaskResponseDto,
} from '#modules/calendar/controllers/calendar.dto.js';
import { CalendarTaskEntity } from '#modules/calendar/entities/calendar-task.entity.js';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarTaskEntity)
    private readonly calendarTaskRepository: Repository<CalendarTaskEntity>,
  ) {}

  async findTasksWithinRange(
    userId: string,
    query: GetTasksRequestDto,
  ): Promise<CalendarTaskEntity[]> {
    const startAtUtcDate = new Date(query.startAt);
    const dueAtUtcDate = new Date(query.dueAt);

    // 기간 겹침(Overlapping) 표준 조건:
    // (이벤트 시작 <= 조회 종료) AND (이벤트 종료 >= 조회 시작)
    return await this.calendarTaskRepository.find({
      where: {
        userId,
        startAt: LessThanOrEqual(dueAtUtcDate),
        dueAt: MoreThanOrEqual(startAtUtcDate),
      },
      order: {
        startAt: 'ASC',
      },
    });
  }

  async create(userId: string, dto: CreateTaskRequestDto): Promise<CreateTaskResponseDto> {
    const event = await this.calendarTaskRepository.save(
      this.calendarTaskRepository.create({
        userId,
        title: dto.title,
        startAt: new Date(dto.startAt),
        dueAt: new Date(dto.dueAt),
        completedAt: null,
        color: dto.color,
        memo: dto.memo,
      }),
    );

    return {
      id: event.id,
      userId: event.userId,
      title: event.title,
      startAt: event.startAt.toISOString(),
      dueAt: event.dueAt.toISOString(),
      completedAt: event.completedAt?.toISOString() ?? null,
      color: event.color,
      memo: event.memo,
      createdAt: event.createdAt.toISOString(),
    };
  }

  async update(
    userId: string,
    taskId: string,
    params: UpdateCalendarTaskRequestDto,
  ): Promise<UpdateCalendarTaskResponseDto> {
    const task = await this.calendarTaskRepository.findOneBy({ id: taskId, userId });

    if (task === null) {
      throw new NotFoundException(`Task with ID ${taskId} not found for user ${userId}`);
    }

    const startAt = params.startAt === undefined ? task.startAt : new Date(params.startAt);
    const dueAt = params.dueAt === undefined ? task.dueAt : new Date(params.dueAt);

    if (dueAt < startAt) {
      throw new BadRequestException('마감 시각은 시작 시각보다 빠를 수 없습니다.');
    }

    if (params.title !== undefined) {
      task.title = params.title;
    }

    task.startAt = startAt;
    task.dueAt = dueAt;

    if (task.completedAt === null && params.isCompleted === true) {
      task.completedAt = new Date();
    } else if (task.completedAt !== null && params.isCompleted === false) {
      task.completedAt = null;
    }

    task.color = params.color;

    if (params.memo !== undefined) {
      task.memo = params.memo;
    }

    const savedTask = await this.calendarTaskRepository.save(task);

    return {
      id: savedTask.id,
      userId: savedTask.userId,
      title: savedTask.title,
      startAt: savedTask.startAt.toISOString(),
      dueAt: savedTask.dueAt.toISOString(),
      completedAt: savedTask.completedAt?.toISOString() ?? null,
      color: savedTask.color,
      memo: savedTask.memo,
    };
  }

  async delete(userId: string, taskId: string): Promise<void> {
    const result = await this.calendarTaskRepository.softDelete({ id: taskId, userId });

    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${taskId} not found for user ${userId}`);
    }
  }
}
