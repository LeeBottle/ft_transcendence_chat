import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
  type FindOneOptions,
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

interface UpdateCalendarTaskParams {
  readonly title?: string;
  readonly startedAt?: string;
  readonly dueAt?: string;
}

interface UpdateCalendarTaskCompletionParams {
  readonly completed: boolean;
}

export interface CalendarTaskRepository {
  readonly create: (input: DeepPartial<CalendarTaskEntity>) => CalendarTaskEntity;
  readonly save: (task: CalendarTaskEntity) => Promise<CalendarTaskEntity>;
  readonly find: (options: FindManyOptions<CalendarTaskEntity>) => Promise<CalendarTaskEntity[]>;
  readonly findOne: (
    options: FindOneOptions<CalendarTaskEntity>,
  ) => Promise<CalendarTaskEntity | null>;
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

  async findOne(
    userId: string,
    taskId: string,
    now = new Date(),
  ): Promise<CalendarTaskResponseDto> {
    const task = await this.findOwnedTaskOrThrow(userId, taskId);

    return this.toResponse(task, now);
  }

  async update(
    userId: string,
    taskId: string,
    params: UpdateCalendarTaskParams,
    now = new Date(),
  ): Promise<CalendarTaskResponseDto> {
    const task = await this.findOwnedTaskOrThrow(userId, taskId);
    const startedAt = params.startedAt === undefined ? task.startedAt : new Date(params.startedAt);
    const dueAt = params.dueAt === undefined ? task.dueAt : new Date(params.dueAt);

    if (dueAt < startedAt) {
      throw new BadRequestException('마감 시각은 시작 시각보다 빠를 수 없습니다.');
    }

    if (params.title !== undefined) {
      task.title = params.title;
    }

    task.startedAt = startedAt;
    task.dueAt = dueAt;

    const savedTask = await this.calendarTaskRepository.save(task);

    return this.toResponse(savedTask, now);
  }

  async updateCompletion(
    userId: string,
    taskId: string,
    params: UpdateCalendarTaskCompletionParams,
    now = new Date(),
  ): Promise<CalendarTaskResponseDto> {
    const task = await this.findOwnedTaskOrThrow(userId, taskId);
    const isCompleted = task.completedAt !== null;

    if (params.completed === isCompleted) {
      return this.toResponse(task, now);
    }

    task.completedAt = params.completed ? now : null;

    const savedTask = await this.calendarTaskRepository.save(task);

    return this.toResponse(savedTask, now);
  }

  private async findOwnedTaskOrThrow(userId: string, taskId: string): Promise<CalendarTaskEntity> {
    const task = await this.calendarTaskRepository.findOne({ where: { id: taskId, userId } });

    if (task === null) {
      throw new NotFoundException('캘린더 태스크를 찾을 수 없습니다.');
    }

    return task;
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
