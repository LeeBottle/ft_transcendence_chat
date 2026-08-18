export const ChatRoomMessageType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  FILE: 'FILE',
  SYSTEM: 'SYSTEM',
} as const;
export type ChatRoomMessageType = (typeof ChatRoomMessageType)[keyof typeof ChatRoomMessageType];
