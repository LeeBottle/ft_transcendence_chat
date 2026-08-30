import { createZodDto } from 'nestjs-zod';

import {
  changePasswordRequestSchema,
  changePasswordResponseSchema,
  getUserPresencesRequestSchema,
  getUserPresencesResponseSchema,
  loginUserRequestSchema,
  loginUserResponseSchema,
  refreshTokenResponseSchema,
  registerUserRequestSchema,
  registerUserResponseSchema,
} from '@repo/schemas/auth';

export class LoginUserRequestDto extends createZodDto(loginUserRequestSchema) {}
export class LoginUserResponseDto extends createZodDto(loginUserResponseSchema) {}
export class RegisterUserRequestDto extends createZodDto(registerUserRequestSchema) {}
export class RegisterUserResponseDto extends createZodDto(registerUserResponseSchema) {}
export class RefreshTokenResponseDto extends createZodDto(refreshTokenResponseSchema) {}
export class ChangePasswordRequestDto extends createZodDto(changePasswordRequestSchema) {}
export class ChangePasswordResponseDto extends createZodDto(changePasswordResponseSchema) {}
export class GetUserPresencesRequestDto extends createZodDto(getUserPresencesRequestSchema) {}
export class GetUserPresencesResponseDto extends createZodDto(getUserPresencesResponseSchema) {}
