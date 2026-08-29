import {
  createParamDecorator,
  InternalServerErrorException,
  type ExecutionContext,
} from '@nestjs/common';

import type { Request } from 'express';

import type { AuthenticatedUser } from '@repo/schemas/auth';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    return getAuthenticatedUser(ctx);
  },
);

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    return getAuthenticatedUser(ctx).id;
  },
);

function getAuthenticatedUser(ctx: ExecutionContext): AuthenticatedUser {
  const request = ctx.switchToHttp().getRequest<Request>();
  const user = request.user;

  // JwtAccessStrategy / Zod 검증을 통과했다면 user가 존재하기만 하면 무결성이 보장됨
  if (user === undefined) {
    throw new InternalServerErrorException(
      'CurrentUser/CurrentUserId 데코레이터는 인증 가드(JwtAuthGuard)가 적용된 라우트에서만 사용할 수 있습니다.',
    );
  }

  return user;
}
