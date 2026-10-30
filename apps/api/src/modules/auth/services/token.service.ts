import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import {
  tokenPayloadSchema,
  type AuthenticatedUser,
  type TokenInputPayload,
  type TokenPayload,
} from '@repo/schemas/auth';

import type { ApiEnv } from '#config/api-env.schema.js';

export interface GeneratedTokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
}

type TokenType = 'ACCESS' | 'REFRESH';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<ApiEnv, true>,
  ) {}

  async generateTokenPair(user: AuthenticatedUser): Promise<GeneratedTokenPair> {
    const payload = {
      sub: user.id,
      loginId: user.loginId,
      role: user.role,
    } satisfies TokenInputPayload;

    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(payload, 'ACCESS'),
      this.signToken(payload, 'REFRESH'),
    ]);

    return { accessToken, refreshToken };
  }

  private async signToken(payload: TokenInputPayload, type: TokenType): Promise<string> {
    const secretKey = `JWT_${type}_SECRET` as const;
    const expirationKey = `JWT_${type}_EXPIRATION` as const;

    return await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow(secretKey, { infer: true }),
      expiresIn: this.configService.getOrThrow(expirationKey, { infer: true }),
    });
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    const decoded = await this.jwtService
      .verifyAsync<TokenPayload>(token, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET', { infer: true }),
      })
      .catch((_error: unknown) => {
        throw new UnauthorizedException(
          '유효하지 않거나 만료된 Refresh Token입니다. 다시 로그인해 주세요.',
        );
      });

    const result = tokenPayloadSchema.safeParse(decoded);

    if (!result.success) {
      throw new UnauthorizedException(
        '지원하지 않는 스키마이거나 규격이 유효하지 않은 Refresh Token입니다.',
      );
    }

    return result.data;
  }
}
