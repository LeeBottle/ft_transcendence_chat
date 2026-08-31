export const ChatRoomMemberStatus = {
  /** 활성화 */
  ACTIVE: 'ACTIVE',

  /** 자진퇴장 */
  LEFT: 'LEFT',

  /** 강퇴 */
  KICKED: 'KICKED',
} as const;
export type ChatRoomMemberStatus = (typeof ChatRoomMemberStatus)[keyof typeof ChatRoomMemberStatus];

export const ChatRoomMemberRole = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
} as const;
export type ChatRoomMemberRole = (typeof ChatRoomMemberRole)[keyof typeof ChatRoomMemberRole];
