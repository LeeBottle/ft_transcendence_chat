import { z } from 'zod';
import { ChatRoomMemberRole, ChatRoomMemberStatus } from '@repo/constants/chat-room-member';
import { ChatRoomMessageType } from '@repo/constants/chat-room-message';

export const chatRoomMemberResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  loginId: z.string().optional(),
  name: z.string().optional(),
  role: z.enum(['FOUNDER', 'OPERATOR', 'USER', 'OWNER', 'MANAGER', 'MEMBER', 'HOST']),
  status: z.enum([ChatRoomMemberStatus.ACTIVE, ChatRoomMemberStatus.LEFT, ChatRoomMemberStatus.KICKED]),
  joinedAt: z.string(),
});

export type ChatRoomMemberResponse = z.infer<typeof chatRoomMemberResponseSchema>;

export const chatRoomResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  topic: z.string().nullable().optional(),
  hasPassword: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  creatorUserId: z.string(),
  createdAt: z.string(),
  closedAt: z.string().nullable().optional(),
  unreadCount: z.number().optional(),
  members: z.array(chatRoomMemberResponseSchema).optional(),
});

export type ChatRoomResponse = z.infer<typeof chatRoomResponseSchema>;

export const chatMessageResponseSchema = z.object({
  id: z.string(),
  chatRoomId: z.string(),
  senderUserId: z.string(),
  senderName: z.string().optional(),
  type: z.enum([
    ChatRoomMessageType.TEXT,
    ChatRoomMessageType.IMAGE,
    ChatRoomMessageType.FILE,
    ChatRoomMessageType.SYSTEM,
  ]),
  content: z.string(),
  sentAt: z.string(),
});

export type ChatMessageResponse = z.infer<typeof chatMessageResponseSchema>;
