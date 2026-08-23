// apps/api/src/main.ts
import process from 'node:process';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 모든 API 경로 앞에 '/api'를 강제로 붙입니다.
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}

// 명시적인 예외 처리 체이닝 및 직관적인 에러 로깅
bootstrap().catch((error: unknown) => {
  console.error('NestJS Application failed to bootstrap:', error);
  // 에러 발생 시 Node.js 프로세스를 명시적으로 비정상 종료시킴
  process.exit(1);
});
