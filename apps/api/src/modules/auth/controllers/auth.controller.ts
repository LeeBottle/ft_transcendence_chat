import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
} from '@nestjs/common';

import type {
  LoginUserRequestDto,
  LoginUserResponseDto,
  RegisterUserRequestDto,
  RegisterUserResponseDto,
} from '#modules/auth/controllers/auth.dto.js';
import type { AuthService } from '#modules/auth/services/auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterUserRequestDto): Promise<RegisterUserResponseDto> {
    return await this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginUserRequestDto): Promise<LoginUserResponseDto> {
    return await this.authService.login(dto);
  }
}
