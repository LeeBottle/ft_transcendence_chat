import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { ZodResponseInterceptor } from '#common/interceptors/zod-response.interceptor.js';
import { parseApiEnv } from '#config/api-env.schema.js';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CalendarModule } from './modules/calendar/calendar.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { SessionModule } from './modules/session/session.module.js';
import { UserModule } from './modules/user/user.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, validate: parseApiEnv }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    HealthModule,

    AdminModule,
    AuthModule,
    CalendarModule,
    ChatModule,
    SessionModule,
    UserModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodResponseInterceptor },

    /* 전역 가드 순서 변경 금지 */
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
