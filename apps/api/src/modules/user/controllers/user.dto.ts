import { createZodDto } from 'nestjs-zod';

import {
  getMyFriendsResponseSchema,
  profileResponseSchema,
  updateProfileRequestSchema,
  updateProfileResponseSchema,
} from '@repo/schemas/user';

export class UpdateProfileRequestDto extends createZodDto(updateProfileRequestSchema) {}
export class UpdateProfileResponseDto extends createZodDto(updateProfileResponseSchema) {}
export class ProfileResponseDto extends createZodDto(profileResponseSchema) {}
export class GetMyFriendsResponseDto extends createZodDto(getMyFriendsResponseSchema) {}
