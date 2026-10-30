import {
  Injectable,
  InternalServerErrorException,
  Logger,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { z } from 'zod';

import { ZOD_RESPONSE_KEY } from '#common/decorators/zod-validation-response.decorator.js';

@Injectable()
export class ZodResponseInterceptor implements NestInterceptor {
  private readonly logger: Logger = new Logger(ZodResponseInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const schema = this.reflector.getAllAndOverride<z.ZodType | undefined>(ZOD_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 데코레이터가 없으면 직렬화 연산 없이 바이패스
    if (schema === undefined) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data: unknown): unknown => {
        const parseResult = schema.safeParse(data);

        if (!parseResult.success) {
          const handlerName = context.getHandler().name;
          const className = context.getClass().name;
          const request = context.switchToHttp().getRequest<{ method: string; url: string }>();

          this.logger.error(
            `[Response Validation Failed] ${request.method} ${request.url} (${className}.${handlerName})\n${JSON.stringify(
              z.treeifyError(parseResult.error),
              null,
              2,
            )}`,
          );

          // 클라이언트에 내부 스키마 에러를 노출하지 않고 500 반환
          throw new InternalServerErrorException('서버 내부 응답 데이터 규격이 일치하지 않습니다.');
        }

        // 스키마에 정의되지 않은 민감 필드가 제거된 안전한 데이터 반환
        return parseResult.data;
      }),
    );
  }
}
