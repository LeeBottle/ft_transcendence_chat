import { z } from 'zod';
import { ChatRoomMessageType } from '@repo/constants/chat-room-message';

export const sendMessageRequestSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z
    .enum([
      ChatRoomMessageType.TEXT,
      ChatRoomMessageType.IMAGE,
      ChatRoomMessageType.FILE,
      ChatRoomMessageType.SYSTEM,
    ])
    .default(ChatRoomMessageType.TEXT),
});

export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;
