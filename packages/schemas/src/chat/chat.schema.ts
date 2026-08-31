import { z } from 'zod';

import { ChatRoomMemberRole, ChatRoomMemberStatus } from '@repo/constants/chat-room-member';
import { ChatRoomMessageType } from '@repo/constants/chat-room-message';

export const createChatRoomRequestSchema = z.object({
  title: z.string().min(1).max(100),
  memberUserLoginIds: z.array(z.string().min(1)),
});
export type CreateChatRoomRequest = z.infer<typeof createChatRoomRequestSchema>;

export const createChatRoomResponseSchema = z.object({
  roomId: z.string(),
  title: z.string(),
});
export type CreateChatRoomResponse = z.infer<typeof createChatRoomResponseSchema>;

export const chatRoomResponseSchema = z.object({
  roomId: z.string(),
  title: z.string(),
  role: z.enum(ChatRoomMemberRole),
  closedAt: z.iso.datetime().nullable(),
  updatedAt: z.iso.datetime(),
});
export type ChatRoomResponse = z.infer<typeof chatRoomResponseSchema>;

export const chatRoomListResponseSchema = z.object({ rooms: z.array(chatRoomResponseSchema) });
export type ChatRoomListResponse = z.infer<typeof chatRoomListResponseSchema>;

export const getMessagesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  direction: z.enum(['BEFORE', 'AFTER']).default('BEFORE').optional(),
});
export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>;

export const sendMessageRequestSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(ChatRoomMessageType).default(ChatRoomMessageType.TEXT),
});
export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;

export const chatMessageResponseSchema = z.object({
  id: z.string(),
  chatRoomId: z.string(),
  senderUserId: z.string(),
  senderName: z.string().optional(),
  type: z.enum(ChatRoomMessageType),
  content: z.string(),
  sentAt: z.string(),
});
export type ChatMessageResponse = z.infer<typeof chatMessageResponseSchema>;

export const getMessagesResponseSchema = z.object({ messages: z.array(chatMessageResponseSchema) });
export type GetMessagesResponse = z.infer<typeof getMessagesResponseSchema>;

export const aiTaskExtractionResultSchema = z.object({
  summary: z.string().optional(),
  actionItems: z
    .array(
      z.object({
        title: z.string(),
        assigneeUserId: z.string().optional(),
      }),
    )
    .optional(),
});
export type AiTaskExtractionResult = z.infer<typeof aiTaskExtractionResultSchema>;

export const endSessionResponseSchema = z.object({
  message: z.string().min(1),
  flushedCount: z.int().nonnegative(),
  aiResult: aiTaskExtractionResultSchema,
});
export type EndSessionResponse = z.infer<typeof endSessionResponseSchema>;
