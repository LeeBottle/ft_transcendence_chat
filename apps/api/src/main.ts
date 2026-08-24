import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.js';
import type { ApiEnv } from './config/api-env.schema.js';
import { ApiEnvError } from './config/exceptions/environment-validation.error.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get<ConfigService<ApiEnv, true>>(ConfigService);

  const clientUrl = configService.getOrThrow('CLIENT_URL', { infer: true });

  app.enableCors({
    origin: clientUrl,
    credentials: true,
    maxAge: 86400,
  });
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  app.set('trust proxy', 1);

  const apiPort = configService.getOrThrow('API_PORT', { infer: true });

  await app.listen(apiPort);
}

bootstrap().catch((error: unknown) => {
  console.error('### NestJS Application failed to bootstrap');
  if (error instanceof ApiEnvError) {
    console.error(error.toString());
  } else {
    console.error(error);
  }

  process.exit(1);
});
