import { createZodDto } from 'nestjs-zod';

import {
  chatMessageResponseSchema,
  chatRoomListResponseSchema,
  chatRoomMemberListResponseSchema,
  chatRoomResponseSchema,
  createChatRoomRequestSchema,
  createChatRoomResponseSchema,
  endSessionResponseSchema,
  getMessagesQuerySchema,
  getMessagesResponseSchema,
  sendMessageRequestSchema,
} from '@repo/schemas/chat';

export class CreateChatRoomRequestDto extends createZodDto(createChatRoomRequestSchema) {}
export class CreateChatRoomResponseDto extends createZodDto(createChatRoomResponseSchema) {}
export class ChatRoomResponseDto extends createZodDto(chatRoomResponseSchema) {}
export class ChatRoomListResponseDto extends createZodDto(chatRoomListResponseSchema) {}
export class ChatRoomMemberListResponseDto extends createZodDto(chatRoomMemberListResponseSchema) {}
export class SendMessageRequestDto extends createZodDto(sendMessageRequestSchema) {}
export class GetMessagesQueryDto extends createZodDto(getMessagesQuerySchema) {}
export class ChatMessageResponseDto extends createZodDto(chatMessageResponseSchema) {}
export class GetMessagesResponseDto extends createZodDto(getMessagesResponseSchema) {}
export class EndSessionResponseDto extends createZodDto(endSessionResponseSchema) {}
