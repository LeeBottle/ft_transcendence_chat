import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { parseApiEnv } from '#config/api-env.schema.js';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/role.guard.js';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CalendarModule } from './modules/calendar/calendar.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { UserModule } from './modules/user/user.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, validate: parseApiEnv }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    HealthModule,

    AuthModule,
    CalendarModule,
    ChatModule,
    UserModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },

    /* 전역 가드 순서 변경 금지 */
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
