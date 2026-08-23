import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  And,
  IsNull,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Not,
  type DeepPartial,
  type FindManyOptions,
  type FindOptionsWhere,
} from 'typeorm';

import { CalendarTaskStatus } from '@repo/constants/calendar-task';

import type {
  CalendarTaskListResponseDto,
  CalendarTaskResponseDto,
} from '#modules/calendar/controllers/calendar.dto.js';
import { CalendarTaskEntity } from '#modules/calendar/entities/calendar-task.entity.js';

interface CreateCalendarTaskParams {
  readonly title: string;
  readonly startedAt: string;
  readonly dueAt: string;
}

interface ListCalendarTasksParams {
  readonly from: string;
  readonly to: string;
  readonly status?: 1 | 2 | 3;
}

export interface CalendarTaskRepository {
  readonly create: (input: DeepPartial<CalendarTaskEntity>) => CalendarTaskEntity;
  readonly save: (task: CalendarTaskEntity) => Promise<CalendarTaskEntity>;
  readonly find: (options: FindManyOptions<CalendarTaskEntity>) => Promise<CalendarTaskEntity[]>;
}

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarTaskEntity)
    private readonly calendarTaskRepository: CalendarTaskRepository,
  ) {}

  async create(userId: string, params: CreateCalendarTaskParams): Promise<CalendarTaskResponseDto> {
    const task = this.calendarTaskRepository.create({
      userId,
      title: params.title,
      startedAt: new Date(params.startedAt),
      dueAt: new Date(params.dueAt),
      completedAt: null,
    });
    const savedTask = await this.calendarTaskRepository.save(task);

    return this.toResponse(savedTask);
  }

  async findAll(
    userId: string,
    params: ListCalendarTasksParams,
    now = new Date(),
  ): Promise<CalendarTaskListResponseDto> {
    const from = new Date(params.from);
    const to = new Date(params.to);
    const where: FindOptionsWhere<CalendarTaskEntity> = {
      userId,
      startedAt: LessThan(to),
      dueAt: MoreThanOrEqual(from),
    };

    if (params.status === CalendarTaskStatus.PENDING) {
      where.completedAt = IsNull();
      where.startedAt = And(LessThan(to), MoreThan(now));
    } else if (params.status === CalendarTaskStatus.IN_PROGRESS) {
      where.completedAt = IsNull();
      where.startedAt = And(LessThan(to), LessThanOrEqual(now));
    } else if (params.status === CalendarTaskStatus.COMPLETED) {
      where.completedAt = Not(IsNull());
    }

    const tasks = await this.calendarTaskRepository.find({
      where,
      order: { startedAt: 'ASC', id: 'ASC' },
    });

    return tasks.map((task) => this.toResponse(task, now));
  }

  private toResponse(task: CalendarTaskEntity, now = new Date()): CalendarTaskResponseDto {
    let status: CalendarTaskResponseDto['status'];

    if (task.completedAt !== null) {
      status = CalendarTaskStatus.COMPLETED;
    } else if (task.startedAt > now) {
      status = CalendarTaskStatus.PENDING;
    } else {
      status = CalendarTaskStatus.IN_PROGRESS;
    }

    return {
      id: task.id,
      title: task.title,
      startedAt: task.startedAt.toISOString(),
      dueAt: task.dueAt.toISOString(),
      completedAt: task.completedAt?.toISOString() ?? null,
      status,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }
}
