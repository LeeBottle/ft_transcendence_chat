// features/room/types.ts

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
}

export interface RoomFormValues {
  name: string;
  id: string;
  owner: string;
}
