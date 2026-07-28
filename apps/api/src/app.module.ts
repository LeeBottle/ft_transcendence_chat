import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { parseApiEnv } from './config/api-env.schema.js';
import { DatabaseModule } from './database/database.module.js';
import { UserModule } from './modules/user/user.module.js';

const API_ENV_PATH = '../../infra/.env.api';
const DB_ENV_PATH = '../../infra/.env.database';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [DB_ENV_PATH, API_ENV_PATH],
      ignoreEnvFile: process.env.NODE_ENV === 'production', // NODE_ENV는 이 시점에선 미검증 상태. But 이후 parseApiEnv()에서 검증 오류시 에러 발생시킴.
      validate: parseApiEnv,
    }),

    DatabaseModule,
    UserModule,
  ],
})
export class AppModule {}
