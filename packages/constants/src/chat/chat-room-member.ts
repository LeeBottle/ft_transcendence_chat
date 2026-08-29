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
  /** 방장 / 최초 생성 소유자 (DB: OWNER) */
  FOUNDER: 'OWNER',

  /** 채널 관리자 / 운영자 (DB: MANAGER) */
  OPERATOR: 'MANAGER',

  /** 일반 사용자 (DB: MEMBER) */
  USER: 'MEMBER',

  /** 하위 호환 매핑 */
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
  HOST: 'OWNER',
} as const;
export type ChatRoomMemberRole = (typeof ChatRoomMemberRole)[keyof typeof ChatRoomMemberRole];
