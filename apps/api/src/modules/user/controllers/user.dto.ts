import { createZodDto } from 'nestjs-zod';

import {
  getMyFriendsResponseSchema,
  profileResponseSchema,
  searchUsersQuerySchema,
  updateProfileRequestSchema,
  updateProfileResponseSchema,
} from '@repo/schemas/user';

export class UpdateProfileRequestDto extends createZodDto(updateProfileRequestSchema) {}
export class UpdateProfileResponseDto extends createZodDto(updateProfileResponseSchema) {}
export class ProfileResponseDto extends createZodDto(profileResponseSchema) {}
export class GetMyFriendsResponseDto extends createZodDto(getMyFriendsResponseSchema) {}

// 유저 검색 (초대 대상 고르기) — 쿼리만 DTO, 응답은 UserSearchItemResponse[] 타입으로 반환
export class SearchUsersQueryDto extends createZodDto(searchUsersQuerySchema) {}
