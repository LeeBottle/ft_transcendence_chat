import { createZodDto } from 'nestjs-zod';

import {
  chatMessageResponseSchema,
  chatRoomMemberResponseSchema,
  chatRoomResponseSchema,
  createChatRoomRequestSchema,
  getMessagesQuerySchema,
  inviteMemberRequestSchema,
  sendMessageRequestSchema,
} from '@repo/schemas/chat';

export class CreateChatRoomRequestDto extends createZodDto(createChatRoomRequestSchema) {}

export class InviteMemberRequestDto extends createZodDto(inviteMemberRequestSchema) {}

export class SendMessageRequestDto extends createZodDto(sendMessageRequestSchema) {}

export class GetMessagesQueryDto extends createZodDto(getMessagesQuerySchema) {}

export class ChatRoomResponseDto extends createZodDto(chatRoomResponseSchema) {}

export class ChatRoomMemberResponseDto extends createZodDto(chatRoomMemberResponseSchema) {}

export class ChatMessageResponseDto extends createZodDto(chatMessageResponseSchema) {}

export class UpdateMemberRoleDto {
  role!: 'FOUNDER' | 'OPERATOR' | 'USER';
}

export class UpdateTopicRequestDto {
  topic!: string;
}

export class VerifyPasswordRequestDto {
  password!: string;
}

export class UpdateRoomPasswordDto {
  password?: string | null;
}
