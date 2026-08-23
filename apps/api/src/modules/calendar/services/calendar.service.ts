import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import type { DeepPartial } from 'typeorm';

import { CalendarTaskStatus } from '@repo/constants/calendar-task';

import type { CalendarTaskResponseDto } from '#modules/calendar/controllers/calendar.dto.js';
import { CalendarTaskEntity } from '#modules/calendar/entities/calendar-task.entity.js';

interface CreateCalendarTaskParams {
  readonly title: string;
  readonly startedAt: string;
  readonly dueAt: string;
}

export interface CalendarTaskRepository {
  readonly create: (input: DeepPartial<CalendarTaskEntity>) => CalendarTaskEntity;
  readonly save: (task: CalendarTaskEntity) => Promise<CalendarTaskEntity>;
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
