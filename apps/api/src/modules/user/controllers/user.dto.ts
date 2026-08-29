import { createZodDto } from 'nestjs-zod';

import { z } from 'zod';

import {
  createEmailSchema,
  createLoginIdSchema,
  createNameSchema,
  createProfileImagePathSchema,
  idSchema,
  roleSchema,
  statusSchema,
  USER_REQUEST_VALIDATION_OPTIONS,
  USER_RESPONSE_VALIDATION_OPTIONS,
} from '@repo/schemas/user';

// 타인 공개용 프로필 (민감 정보 제외)

export const publicUserProfileResponseSchema = z.object({
  id: idSchema,
  loginId: createLoginIdSchema(USER_RESPONSE_VALIDATION_OPTIONS.loginId),
  name: createNameSchema(USER_RESPONSE_VALIDATION_OPTIONS.name),
  profileImagePath: createProfileImagePathSchema(),
  isOnline: z.boolean().default(false),
});
export type PublicUserProfileResponse = z.infer<typeof publicUserProfileResponseSchema>;
export class PublicUserProfileResponseDto extends createZodDto(publicUserProfileResponseSchema) {}

// 본인 조회용 프로필

export const selfUserProfileResponseSchema = z.object({
  id: idSchema,
  loginId: createLoginIdSchema(USER_RESPONSE_VALIDATION_OPTIONS.loginId),
  name: createNameSchema(USER_RESPONSE_VALIDATION_OPTIONS.name),
  email: createEmailSchema(USER_RESPONSE_VALIDATION_OPTIONS.email),
  role: roleSchema,
  status: statusSchema,
  profileImagePath: createProfileImagePathSchema(),
  isOnline: z.boolean().default(true),
});
export type SelfUserProfileResponse = z.infer<typeof selfUserProfileResponseSchema>;
export class SelfUserProfileResponseDto extends createZodDto(selfUserProfileResponseSchema) {}

// 유저 회원 정보 수정

export const updateUserProfileRequestSchema = z.object({
  name: createNameSchema(USER_REQUEST_VALIDATION_OPTIONS.name).optional(),
  profileImagePath: z.string().max(255).nullable().optional(),
});
export type UpdateUserProfileRequest = z.infer<typeof updateUserProfileRequestSchema>;
export class UpdateUserProfileRequestDto extends createZodDto(updateUserProfileRequestSchema) {}

// 친구 추가 (idSchema를 사용)

export const addFriendRequestSchema = z.object({
  friendUserId: idSchema,
});
export type AddFriendRequest = z.infer<typeof addFriendRequestSchema>;
export class AddFriendRequestDto extends createZodDto(addFriendRequestSchema) {}

// 친구 프로필 확인

export const friendItemResponseSchema = z.object({
  id: idSchema,
  friendUser: publicUserProfileResponseSchema,
});
export type FriendItemResponse = z.infer<typeof friendItemResponseSchema>;
export class FriendItemResponseDto extends createZodDto(friendItemResponseSchema) {}

export const getFriendsResponseSchema = z.array(friendItemResponseSchema);
export type GetFriendsResponse = z.infer<typeof getFriendsResponseSchema>;
export class GetFriendsResponseDto extends createZodDto(getFriendsResponseSchema) {}
