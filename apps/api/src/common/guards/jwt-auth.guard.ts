import { Injectable, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import type { Observable } from 'rxjs';

import type { AuthenticatedUser } from '@repo/schemas/auth';

import { IS_PUBLIC_KEY } from '#common/decorators/public.decorator.js';

interface AuthErrorResponse {
  statusCode: number;
  error: string;
  code: 'AUTH_TOKEN_EXPIRED' | 'AUTH_TOKEN_INVALID' | 'AUTH_TOKEN_MALFORMED' | 'AUTH_REQUIRED';
  message: string;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // @Public() 데코레이터가 선언된 라우트는 인증 절차 생략
    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  override handleRequest<TUser = AuthenticatedUser>(
    err: unknown,
    user: TUser | null | undefined | false,
    info: unknown,
  ): TUser {
    // JwtStrategy validate() 또는 시스템 내부에서 throw된 예외 우선 전파
    if (err instanceof Error) {
      throw err;
    }

    // passport-jwt 내부 검증 실패(info) 세부 분류
    if (info instanceof Error) {
      if (info.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          statusCode: 401,
          error: 'Unauthorized',
          code: 'AUTH_TOKEN_EXPIRED',
          message: '액세스 토큰이 만료되었습니다.',
        } satisfies AuthErrorResponse);
      }

      if (info.name === 'JsonWebTokenError') {
        throw new UnauthorizedException({
          statusCode: 401,
          error: 'Unauthorized',
          code: 'AUTH_TOKEN_INVALID',
          message: '유효하지 않거나 위변조된 토큰입니다.',
        } satisfies AuthErrorResponse);
      }

      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        code: 'AUTH_TOKEN_MALFORMED',
        message: info.message || '토큰 형식이 올바르지 않습니다.',
      } satisfies AuthErrorResponse);
    }

    // 헤더/쿠키에 토큰 자체가 누락되었거나 user 객체가 생성되지 않은 경우
    if (user === null || user === undefined || user === false) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        code: 'AUTH_REQUIRED',
        message: '인증 자격 증명이 제공되지 않았습니다.',
      } satisfies AuthErrorResponse);
    }

    return user; // `req.user`에 인증된 사용자 정보 할당
  }
}
