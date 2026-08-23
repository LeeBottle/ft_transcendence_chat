import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { parseApiEnv } from '#config/api-env.schema.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, validate: parseApiEnv }),
    DatabaseModule,
  ],
})
export class AppModule {}
