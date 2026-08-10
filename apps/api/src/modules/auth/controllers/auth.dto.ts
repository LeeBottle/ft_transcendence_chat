import { createZodDto } from 'nestjs-zod';

import {
  loginUserRequestSchema,
  loginUserResponseSchema,
  registerUserRequestSchema,
  registerUserResponseSchema,
} from '@repo/schemas/auth';

export class LoginUserRequestDto extends createZodDto(loginUserRequestSchema) {}
export class LoginUserResponseDto extends createZodDto(loginUserResponseSchema) {}
export class RegisterUserRequestDto extends createZodDto(registerUserRequestSchema) {}
export class RegisterUserResponseDto extends createZodDto(registerUserResponseSchema) {}
