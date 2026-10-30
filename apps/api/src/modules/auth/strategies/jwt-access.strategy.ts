import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { tokenPayloadSchema, type AuthenticatedUser } from '@repo/schemas/auth';

import type { ApiEnv } from '#config/api-env.schema.js';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService<ApiEnv, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_ACCESS_SECRET', { infer: true }),
    });
  }

  validate(payload: unknown): AuthenticatedUser {
    const result = tokenPayloadSchema.safeParse(payload);

    if (!result.success) {
      throw new UnauthorizedException('유효하지 않은 토큰 페이로드입니다.');
    }

    const data = result.data;

    // 반환된 객체는 Request 객체의 user 프로퍼티(req.user)에 자동 할당됨
    return { id: data.sub, loginId: data.loginId, role: data.role };
  }
}
