// features/room/types.ts

export interface Room {
  id: string
  name: string
  avatarLabel: string
  avatarColor: 'indigo' | 'teal' | 'orange' | 'pink'
  unreadCount?: number
}

export interface RoomFormValues {
  name: string
  id: string
  owner: string
}
