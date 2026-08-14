import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { parseApiEnv } from './config/api-env.schema.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UserModule } from './modules/user/user.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      validate: parseApiEnv,
    }),
    DatabaseModule,

    AuthModule,
    UserModule,
  ],
})
export class AppModule {}
