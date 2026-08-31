import { createZodDto } from 'nestjs-zod';

import {
  adminChatRoomIdParamSchema,
  adminChatRoomListResponseSchema,
  adminCreateUserRequestSchema,
  adminCreateUserResponseSchema,
  adminUpdateChatRoomTitleRequestSchema,
  adminUpdateChatRoomTitleResponseSchema,
  adminUpdateUserStatusRequestSchema,
  adminUpdateUserStatusResponseSchema,
  adminUserIdParamSchema,
  adminUserListQueryRequestSchema,
  adminUserListQueryResponseSchema,
} from '@repo/schemas/admin';

export class AdminUserListQueryRequestDto extends createZodDto(adminUserListQueryRequestSchema) {}
export class AdminUserListQueryResponseDto extends createZodDto(adminUserListQueryResponseSchema) {}

export class AdminUserIdParamDto extends createZodDto(adminUserIdParamSchema) {}
export class AdminUpdateUserStatusRequestDto extends createZodDto(
  adminUpdateUserStatusRequestSchema,
) {}
export class AdminUpdateUserStatusResponseDto extends createZodDto(
  adminUpdateUserStatusResponseSchema,
) {}

export class AdminCreateUserRequestDto extends createZodDto(adminCreateUserRequestSchema) {}
export class AdminCreateUserResponseDto extends createZodDto(adminCreateUserResponseSchema) {}

export class AdminChatRoomListResponseDto extends createZodDto(adminChatRoomListResponseSchema) {}

export class AdminChatRoomIdParamDto extends createZodDto(adminChatRoomIdParamSchema) {}
export class AdminUpdateChatRoomTitleRequestDto extends createZodDto(
  adminUpdateChatRoomTitleRequestSchema,
) {}
export class AdminUpdateChatRoomTitleResponseDto extends createZodDto(
  adminUpdateChatRoomTitleResponseSchema,
) {}
