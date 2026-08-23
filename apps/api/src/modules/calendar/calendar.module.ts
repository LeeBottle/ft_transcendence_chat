import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '#modules/auth/auth.module.js';

import { CalendarController } from './controllers/calendar.controller.js';
import { CalendarTaskEntity } from './entities/calendar-task.entity.js';
import { CalendarService } from './services/calendar.service.js';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([CalendarTaskEntity])],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
