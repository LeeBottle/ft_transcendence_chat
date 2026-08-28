import { z } from 'zod';

export const getMessagesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  direction: z.enum(['BEFORE', 'AFTER']).default('BEFORE').optional(),
});

export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>;
