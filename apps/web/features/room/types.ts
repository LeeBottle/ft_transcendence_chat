// features/room/types.ts

// 백엔드 DB enum: OWNER=방장 / MANAGER=운영자 / MEMBER=일반
export type RoomMemberRole = 'OWNER' | 'MANAGER' | 'MEMBER';

export interface RoomMember {
  userId: string;
  name: string;
  role: string;
}

export interface Room {
  id: string;
  name: string;
  avatarLabel: string;
  avatarColor: 'indigo' | 'teal' | 'orange' | 'pink';
  unreadCount?: number;
  members?: RoomMember[];
  topic?: string | null;
  hasPassword?: boolean;
  creatorUserId?: string;
}

export interface RoomFormValues {
  name: string;
  id: string;
  owner: string;
}
