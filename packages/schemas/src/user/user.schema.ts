import { z } from 'zod';

import { UserRole, UserStatus } from '@repo/constants/user';

import type { StringValidationOptions } from '#common/types.js';
import { createStringFieldSchema } from '#common/utils.js';

import {
  USER_CONFIGS,
  USER_REQUEST_VALIDATION_OPTIONS,
  USER_RESPONSE_VALIDATION_OPTIONS,
} from './user.config.js';

export {
  /* For UX */
  LOGIN_ID_ALLOWED_REGEX,
} from './user.config.js';

export { USER_REQUEST_VALIDATION_OPTIONS, USER_RESPONSE_VALIDATION_OPTIONS };

export const updateProfileRequestSchema = z.object({
  name: createNameSchema(USER_REQUEST_VALIDATION_OPTIONS.name),
  email: createEmailSchema(USER_REQUEST_VALIDATION_OPTIONS.email).optional(),
});
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

export const updateProfileResponseSchema = z.object({
  name: createNameSchema(USER_RESPONSE_VALIDATION_OPTIONS.name),
  email: createEmailSchema(USER_RESPONSE_VALIDATION_OPTIONS.email),
});
export type UpdateProfileResponse = z.infer<typeof updateProfileResponseSchema>;

/* 요청 & 응답 공용 */

export function createLoginIdSchema(options?: StringValidationOptions): z.ZodType<string> {
  return createStringFieldSchema(USER_CONFIGS.loginId, options);
}

export function createNameSchema(options?: StringValidationOptions): z.ZodType<string> {
  return createStringFieldSchema(USER_CONFIGS.name, options);
}

export function createEmailSchema(options?: StringValidationOptions): z.ZodType<string> {
  return createStringFieldSchema(USER_CONFIGS.email, options);
}

/* 응답 전용 */

export function createProfileImagePathSchema(): z.ZodType<string | null> {
  return createStringFieldSchema(
    USER_CONFIGS.profileImagePath,
    USER_RESPONSE_VALIDATION_OPTIONS.profileImagePath,
  );
}

export const idSchema = z.string().regex(USER_CONFIGS.id.constraints.fullRegex);
export const emailVerifiedAtSchema = z.iso.datetime().nullable();
export const roleSchema = z.enum(UserRole);
export const statusSchema = z.enum(UserStatus);

export const profileResponseSchema = z.object({
  id: idSchema,
  loginId: createLoginIdSchema(USER_RESPONSE_VALIDATION_OPTIONS.loginId),
  name: createNameSchema(USER_RESPONSE_VALIDATION_OPTIONS.name),
  email: createEmailSchema(USER_RESPONSE_VALIDATION_OPTIONS.email),
  role: roleSchema,
  status: statusSchema,
  profileImagePath: createProfileImagePathSchema(),
  isOnline: z.boolean(),
});
export type ProfileResponse = z.infer<typeof profileResponseSchema>;

export const getMyFriendsResponseSchema = z.object({
  friends: z.array(profileResponseSchema),
});
export type GetMyFriendsResponse = z.infer<typeof getMyFriendsResponseSchema>;

/* 유저 검색 (초대 대상 고르기) — 민감 정보 없이 최소 필드만 */

export const searchUsersQuerySchema = z.object({
  q: z.string().trim().min(1, '검색어를 입력해 주세요.').max(50),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});
export type SearchUsersQuery = z.infer<typeof searchUsersQuerySchema>;

export const userSearchItemResponseSchema = z.object({
  id: idSchema,
  loginId: createLoginIdSchema(USER_RESPONSE_VALIDATION_OPTIONS.loginId),
  name: createNameSchema(USER_RESPONSE_VALIDATION_OPTIONS.name),
  profileImagePath: createProfileImagePathSchema(),
});
export type UserSearchItemResponse = z.infer<typeof userSearchItemResponseSchema>;

export const searchUsersResponseSchema = z.array(userSearchItemResponseSchema);
export type SearchUsersResponse = z.infer<typeof searchUsersResponseSchema>;
