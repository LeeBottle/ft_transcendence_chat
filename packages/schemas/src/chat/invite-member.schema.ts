import { z } from 'zod';
import { ChatRoomMemberRole } from '@repo/constants/chat-room-member';

export const inviteMemberRequestSchema = z.object({
  userId: z.string(),
  role: z
    .enum(['FOUNDER', 'OPERATOR', 'USER', 'OWNER', 'MANAGER', 'MEMBER', 'HOST'])
    .default('USER'),
});

export type InviteMemberRequest = z.infer<typeof inviteMemberRequestSchema>;
