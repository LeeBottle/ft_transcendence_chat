import { z } from 'zod';

export const createChatRoomRequestSchema = z.object({
  title: z.string().min(1).max(100),
  memberUserIds: z.array(z.string()).optional(),
  password: z.string().max(12).optional(),
});

export type CreateChatRoomRequest = z.infer<typeof createChatRoomRequestSchema>;
