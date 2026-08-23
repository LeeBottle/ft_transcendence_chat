import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { parseApiEnv } from '#config/api-env.schema.js';
import { CalendarModule } from './modules/calendar/calendar.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { UserModule } from './modules/user/user.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, validate: parseApiEnv }),
    DatabaseModule,

    CalendarModule,
    ChatModule,
    UserModule,
  ],
})
export class AppModule {}
