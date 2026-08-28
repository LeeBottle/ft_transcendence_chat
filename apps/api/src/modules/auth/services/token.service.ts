import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import type { UserRole } from '@repo/constants/user';

import type { ApiEnv } from '#config/api-env.schema.js';

interface TokenPayload {
  readonly sub: string; // id
  readonly loginId: string; // loginId
  readonly role: UserRole; // role
  readonly iat: number; // 발급 시각 (Unix Timestamp, 초)
  readonly exp: number; // 만료 시각 (Unix Timestamp, 초)
}

type TokenInputPayload = Omit<TokenPayload, 'iat' | 'exp'>;

export interface GeneratedTokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<ApiEnv, true>,
  ) {}

  async generateTokenPair(payload: TokenInputPayload): Promise<GeneratedTokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload),
      this.signRefreshToken(payload),
    ]);

    return { accessToken, refreshToken };
  }

  private async signAccessToken(payload: TokenInputPayload): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow('JWT_ACCESS_SECRET', { infer: true }),
      expiresIn: this.configService.getOrThrow('JWT_ACCESS_EXPIRATION', { infer: true }),
      algorithm: 'HS256',
    });
  }

  private async signRefreshToken(payload: TokenInputPayload): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_SECRET', { infer: true }),
      expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRATION', { infer: true }),
      algorithm: 'HS256',
    });
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    const payload = await this.jwtService
      .verifyAsync<TokenPayload>(token, {
        secret: this.configService.getOrThrow('JWT_ACCESS_SECRET', { infer: true }),
      })
      .catch((_error: unknown) => {
        throw new UnauthorizedException('유효하지 않거나 만료된 Access Token입니다.');
      });

    return payload;
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    const payload = await this.jwtService
      .verifyAsync<TokenPayload>(token, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET', { infer: true }),
      })
      .catch((_error: unknown) => {
        throw new UnauthorizedException('유효하지 않거나 만료된 Refresh Token입니다.');
      });

    return payload;
  }
}
