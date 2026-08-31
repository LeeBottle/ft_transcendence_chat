import { z } from 'zod';

import { AdminUserSortBy, AdminUserSortOrder } from '@repo/constants/admin';
import { UserRole, UserStatus } from '@repo/constants/user';

export const adminUserListQueryRequestSchema = z.object({
  // 1. 상태 필터 (선택적)
  status: z.enum(UserStatus).optional(),

  // 2. 동적 정렬 필드 및 방향
  sortBy: z.enum(AdminUserSortBy).default(AdminUserSortBy.CREATED_AT),
  sortOrder: z.enum(AdminUserSortOrder).default(AdminUserSortOrder.DESC),

  // 3. 무한 스크롤 페이징
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().trim().optional(), // Base64 인코딩된 커서 { v: string | number, id: string }
});
export type AdminUserListQueryRequest = z.infer<typeof adminUserListQueryRequestSchema>;

const adminUserItemSchema = z.object({
  id: z.string().min(1),
  loginId: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  role: z.enum(UserRole),
  status: z.enum(UserStatus),
  createdAt: z.iso.datetime(),
});

export const adminUserListQueryResponseSchema = z.object({
  items: z.array(adminUserItemSchema),
  nextCursor: z.string().nullable(),
  hasNextPage: z.boolean(),
});
export type AdminUserListQueryResponse = z.infer<typeof adminUserListQueryResponseSchema>;

export const adminUserIdParamSchema = z.object({
  userId: z
    .string()
    .min(1)
    .regex(/^[1-9]\d*$/),
});
export type AdminUserIdParam = z.infer<typeof adminUserIdParamSchema>;

export const adminUpdateUserStatusRequestSchema = z.object({
  status: z.enum(UserStatus),
});
export type AdminUserStatusUpdateRequest = z.infer<typeof adminUpdateUserStatusRequestSchema>;

export const adminUpdateUserStatusResponseSchema = z.object({
  id: z.string().min(1),
  status: z.enum(UserStatus),
  updatedAt: z.iso.datetime(),
});
export type AdminUserStatusUpdateResponse = z.infer<typeof adminUpdateUserStatusResponseSchema>;

export const adminCreateUserRequestSchema = z.object({
  loginId: z.string().trim().min(1).max(20),
  password: z.string().min(1),
  role: z.enum(UserRole).default(UserRole.USER),
  name: z.string().trim().max(50).default(''),
  email: z.email().default(''),
});
export type AdminCreateUserRequest = z.infer<typeof adminCreateUserRequestSchema>;

export const adminCreateUserResponseSchema = z.object({
  id: z.string(),
  loginId: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(UserRole),
  status: z.enum(UserStatus),
  createdAt: z.iso.datetime(),
});
export type AdminCreateUserResponse = z.infer<typeof adminCreateUserResponseSchema>;

const adminChatRoomItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(100),
  creatorLoginId: z.string().min(1),
  memberCount: z.number().int().min(1),
  createdAt: z.iso.datetime(),
});

export const adminChatRoomListResponseSchema = z.object({
  items: z.array(adminChatRoomItemSchema),
  totalCount: z.number().int(),
});
export type AdminChatRoomListResponse = z.infer<typeof adminChatRoomListResponseSchema>;

export const adminChatRoomIdParamSchema = z.object({
  chatRoomId: z
    .string()
    .min(1)
    .regex(/^[1-9]\d*$/),
});
export type AdminChatRoomIdParam = z.infer<typeof adminChatRoomIdParamSchema>;

export const adminUpdateChatRoomTitleRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, '채팅방 이름은 최소 1자 이상이어야 합니다.')
    .max(100, '채팅방 이름은 최대 100자까지 가능합니다.'),
});

export const adminUpdateChatRoomTitleResponseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(100),
  updatedAt: z.iso.datetime(),
});
export type AdminUpdateChatRoomTitleResponse = z.infer<
  typeof adminUpdateChatRoomTitleResponseSchema
>;
