import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe.js';
import { parseApiEnv } from './config/api-env.schema.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CalendarModule } from './modules/calendar/calendar.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { UserModule } from './modules/user/user.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, validate: parseApiEnv }),
    DatabaseModule,
    HealthModule,

    AuthModule,
    CalendarModule,
    ChatModule,
    UserModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
