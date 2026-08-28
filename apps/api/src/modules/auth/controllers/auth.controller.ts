import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { CookieOptions, Response } from 'express';

import { parseDurationToMs } from '#common/utils/duration.util.js';
import type { ApiEnv } from '#config/api-env.schema.js';
import {
  LoginUserRequestDto,
  LoginUserResponseDto,
  RefreshTokenResponseDto,
  RegisterUserRequestDto,
  RegisterUserResponseDto,
} from '#modules/auth/controllers/auth.dto.js';
import { ClientIp, UserAgent } from '#modules/auth/decorators/client-info.decorator.js';
import { Cookies } from '#modules/auth/decorators/cookies.decorator.js';
import { AuthService } from '#modules/auth/services/auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService<ApiEnv, true>,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterUserRequestDto): Promise<RegisterUserResponseDto> {
    return await this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginUserRequestDto,
    @ClientIp() ipAddress: string,
    @UserAgent() userAgent: string | null,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginUserResponseDto> {
    const { tokens, user } = await this.authService.login({
      loginId: dto.loginId,
      password: dto.password,
      ipAddress,
      userAgent,
    });

    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return { accessToken: tokens.accessToken, user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Cookies('refreshToken') refreshToken: string | null,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    if (refreshToken !== null) {
      await this.authService.logout(refreshToken);
    }

    // 브라우저의 Refresh Token 쿠키 즉시 만료 처리
    this.clearRefreshTokenCookie(res);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Cookies('refreshToken') refreshToken: string | null,
    @ClientIp() ipAddress: string,
    @UserAgent() userAgent: string | null,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshTokenResponseDto> {
    if (refreshToken === null) {
      throw new UnauthorizedException('Refresh Token이 전달되지 않았습니다.');
    }

    const tokens = await this.authService.reissueTokenPair({
      refreshToken,
      ipAddress,
      userAgent,
    });

    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }

  private getBaseCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.configService.getOrThrow('NODE_ENV', { infer: true }) === 'production',
      path: '/api/auth',
    };
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const refreshTokenExpiration = this.configService.getOrThrow('JWT_REFRESH_EXPIRATION', {
      infer: true,
    });

    res.cookie('refreshToken', refreshToken, {
      ...this.getBaseCookieOptions(),
      maxAge: parseDurationToMs(refreshTokenExpiration),
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refreshToken', this.getBaseCookieOptions());
  }
}
