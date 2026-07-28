import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import type { DatabaseEnv } from '#config/database-env.schema.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<DatabaseEnv, true>) => ({
        type: 'mysql',
        host: configService.getOrThrow('DB_HOST', { infer: true }),
        port: configService.getOrThrow('DB_PORT', { infer: true }),
        username: configService.getOrThrow('DB_USERNAME', { infer: true }),
        password: configService.getOrThrow('DB_PASSWORD', { infer: true }),
        database: configService.getOrThrow('DB_SCHEMA_NAME', { infer: true }),
        synchronize: false, // 실무에서는 무조건 false (마이그레이션으로 관리)
        logging: true,
        autoLoadEntities: true, // 👈 모듈별로 엔티티를 자동 수집하는 핵심 옵션
        entities: [],
        subscribers: [],
        migrations: [],
      }),
    }),
  ],
})
export class DatabaseModule {}

// autoLoadEntities: true,
// 커넥션 풀 설정 (실무 필수)
// extra: {
//   connectionLimit: 10, // 애플리케이션 당 최대 유지할 커넥션 수
// },
