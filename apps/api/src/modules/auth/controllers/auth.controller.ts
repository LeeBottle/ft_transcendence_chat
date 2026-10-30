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

import { ClientIp, UserAgent } from '#common/decorators/client-info.decorator.js';
import { Cookies } from '#common/decorators/cookies.decorator.js';
import { CurrentUserId } from '#common/decorators/current-user.decorator.js';
import { Public } from '#common/decorators/public.decorator.js';
import { ZodValidateResponse } from '#common/decorators/zod-validation-response.decorator.js';
import { parseDurationToMs } from '#common/utils/duration.util.js';
import type { ApiEnv } from '#config/api-env.schema.js';
import {
  ChangePasswordRequestDto,
  ChangePasswordResponseDto,
  LoginUserRequestDto,
  LoginUserResponseDto,
  RefreshTokenResponseDto,
  RegisterUserRequestDto,
  RegisterUserResponseDto,
} from '#modules/auth/controllers/auth.dto.js';
import { AuthService } from '#modules/auth/services/auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService<ApiEnv, true>,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @Public()
  @ZodValidateResponse(RegisterUserResponseDto)
  async register(@Body() dto: RegisterUserRequestDto): Promise<RegisterUserResponseDto> {
    return await this.authService.register({
      loginId: dto.loginId,
      password: dto.password,
      name: dto.name,
      email: dto.email,
    });
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ZodValidateResponse(LoginUserResponseDto)
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

  // 현재 기기(세션)만 로그아웃 처리
  @Post('logout')
  @Public()
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

  // 비밀번호 변경 후, 새로운 토큰 발급
  // 나머지 기기(세션)들은 로그아웃 처리
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ZodValidateResponse(ChangePasswordResponseDto)
  async changePassword(
    @CurrentUserId() userId: string,
    @Body() dto: ChangePasswordRequestDto,
    @ClientIp() ipAddress: string,
    @UserAgent() userAgent: string | null,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ChangePasswordResponseDto> {
    const tokens = await this.authService.changePassword({
      userId,
      ipAddress,
      userAgent,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });

    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ZodValidateResponse(RefreshTokenResponseDto)
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
