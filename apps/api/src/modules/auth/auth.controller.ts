import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
} from '@nestjs/common';

import {
  loginRequestSchema,
  loginResponseSchema,
  registerRequestSchema,
  registerResponseSchema,
  type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
  type RegisterResponse,
} from '@repo/schemas/auth';

import type { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: unknown): Promise<LoginResponse> {
    const req = loginRequestSchema.safeParse(body);

    if (!req.success) {
      throw new BadRequestException('일치하는 아이디 및 비밀번호의 유저를 찾을 수 없습니다.');
    }

    const user = await this.userService.findOneByCredentials({
      loginId: req.data.loginId,
      passwordHash: req.data.password,
    });

    const res = loginResponseSchema.safeParse(user);

    if (!res.success) {
      throw new InternalServerErrorException('유저 정보 변환에 실패했습니다.');
    }

    return res.data;
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() body: unknown): Promise<RegisterResponse> {
    const req = registerRequestSchema.safeParse(body);

    if (!req.success) {
      throw new BadRequestException('');
    }

    const user = await this.userService.findOneByCredentials({
      loginId: req.data.loginId,
      passwordHash: req.data.password,
    });

    const res = registerResponseSchema.safeParse(user);

    if (!res.success) {
      throw new InternalServerErrorException('');
    }

    return res.data;
  }
}
