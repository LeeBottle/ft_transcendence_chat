import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { UserRole, UserStatus } from '@repo/constants/user';


// 유저 프로필 페이지

export const userProfileResponseSchema = z.object({
  id: z.string(),
  loginId: z.string(),
  name: z.string(),
  email: z.email(),
  role: z.enum(UserRole),
  status: z.enum(UserStatus),
  profileImagePath: z.string().nullable(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  isOnline: z.boolean().optional(),
});
export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;
export class UserProfileResponseDto extends createZodDto(userProfileResponseSchema) {}


// 유저 회원 정보 수정

export const updateUserProfileRequestSchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.').max(50).optional(),
  profileImagePath: z.string().max(255).nullable().optional(),
});
export type UpdateUserProfileRequest = z.infer<typeof updateUserProfileRequestSchema>;
export class UpdateUserProfileRequestDto extends createZodDto(updateUserProfileRequestSchema) {}


// 친구 추가

export const addFriendRequestSchema = z.object({
  friendUserId: z.string().min(1, '친구 유저 ID가 필요합니다.'),
});
export type AddFriendRequest = z.infer<typeof addFriendRequestSchema>;
export class AddFriendRequestDto extends createZodDto(addFriendRequestSchema) {}


// 친구 프로필 확인, 친구 온라인 접속 상태 확인

export const friendItemResponseSchema = z.object({
  id: z.string(),
  friendUser: z.object({
    id: z.string(),
    loginId: z.string(),
    name: z.string(),
    profileImagePath: z.string().nullable(),
    isOnline: z.boolean().default(false),
  }),
  createdAt: z.union([z.date(), z.string()]).optional(),
});
export type FriendItemResponse = z.infer<typeof friendItemResponseSchema>;
export class FriendItemResponseDto extends createZodDto(friendItemResponseSchema) {}

export const getFriendsResponseSchema = z.array(friendItemResponseSchema);
export type GetFriendsResponse = z.infer<typeof getFriendsResponseSchema>;
export class GetFriendsResponseDto extends createZodDto(getFriendsResponseSchema) {}
