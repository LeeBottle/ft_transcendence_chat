// features/room/types.ts

// 백엔드 DB enum: OWNER=방장 / MANAGER=운영자 / MEMBER=일반
export type RoomMemberRole = 'OWNER' | 'MANAGER' | 'MEMBER';

export interface Room {
  id: string;
  name: string;
  avatarLabel: string;
  avatarColor: 'indigo' | 'teal' | 'orange' | 'pink';
  /** 내 방 내 역할 (OWNER/MANAGER/MEMBER) */
  role?: string;
  /** 방장 포함 인원수 */
  memberCount?: number;
  /** 회의 종료(close) 된 방이면 종료 시각 */
  closedAt?: string | null;
}

export interface RoomFormValues {
  name: string;
  id: string;
  owner: string;
}
