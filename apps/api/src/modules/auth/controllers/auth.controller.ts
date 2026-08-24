import { Body, Controller, HttpCode, Post } from '@nestjs/common';

import {
  LoginUserRequestDto,
  LoginUserResponseDto,
  RegisterUserRequestDto,
  RegisterUserResponseDto,
} from '#modules/auth/controllers/auth.dto.js';
import { AuthService } from '#modules/auth/services/auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterUserRequestDto): Promise<RegisterUserResponseDto> {
    return await this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginUserRequestDto): Promise<LoginUserResponseDto> {
    return await this.authService.login(dto);
  }
}
