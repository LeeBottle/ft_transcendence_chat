export interface TempUser {
  id: string;
  loginId: string;
  name: string;
  email: string;
}

export type MemberRole =
  | 'FOUNDER'
  | 'OPERATOR'
  | 'USER'
  | 'HOST'
  | 'MEMBER'
  | 'OWNER'
  | 'MANAGER';

export interface ChatRoomMember {
  userId: string;
  loginId: string;
  name: string;
  role: MemberRole;
}

export interface BannedMember {
  userId: string;
  loginId: string;
  name: string;
  bannedAt: string;
}

export type RoomType = 'DIRECT' | 'GROUP' | 'MEETING';

export interface ChatRoom {
  id: string;
  title: string;
  topic?: string | null;
  hasPassword?: boolean;
  isPrivate?: boolean;
  type?: RoomType;
  hostId?: string;
  creatorUserId?: string;
  members: ChatRoomMember[];
  bannedMembers?: BannedMember[];
  createdAt: string;
  closedAt?: string | null;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export const TEMP_USERS: TempUser[] = [
  { id: '1', loginId: 'a', name: '사용자 A', email: 'a@example.com' },
  { id: '2', loginId: 'b', name: '사용자 B', email: 'b@example.com' },
  { id: '3', loginId: 'c', name: '사용자 C', email: 'c@example.com' },
];

export const DEFAULT_USER: TempUser = TEMP_USERS[0] ?? {
  id: '1',
  loginId: 'a',
  name: '사용자 A',
  email: 'a@example.com',
};

export const STORAGE_KEY_ROOMS = 'temp_chat_rooms';

export const STORAGE_KEY_MESSAGES = 'temp_chat_messages';

export const STORAGE_KEY_ACTIVE_USER = 'temp_chat_active_user';

export const STORAGE_KEY_DELETED_ROOMS = 'temp_chat_deleted_rooms';

export const STORAGE_KEY_VERIFIED_ROOMS_PREFIX = 'temp_chat_verified_rooms_';

export function getStoredVerifiedRooms(userId: string): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const saved = localStorage.getItem(`${STORAGE_KEY_VERIFIED_ROOMS_PREFIX}${userId}`);

  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved) as string[];
  } catch (_error) {
    return [];
  }
}

export function saveStoredVerifiedRoom(userId: string, roomId: string): void {
  if (typeof window !== 'undefined') {
    const existing = getStoredVerifiedRooms(userId);

    if (!existing.includes(roomId)) {
      localStorage.setItem(
        `${STORAGE_KEY_VERIFIED_ROOMS_PREFIX}${userId}`,
        JSON.stringify([...existing, roomId]),
      );
    }
  }
}

export function getStoredDeletedRoomIds(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const saved = localStorage.getItem(STORAGE_KEY_DELETED_ROOMS);

  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved) as string[];
  } catch (_error) {
    return [];
  }
}

export function saveStoredDeletedRoomId(roomId: string): void {
  if (typeof window !== 'undefined') {
    const existing = getStoredDeletedRoomIds();

    if (!existing.includes(roomId)) {
      localStorage.setItem(STORAGE_KEY_DELETED_ROOMS, JSON.stringify([...existing, roomId]));
    }
  }
}

export function getStoredRooms(): ChatRoom[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const saved = localStorage.getItem(STORAGE_KEY_ROOMS);

  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved) as ChatRoom[];
  } catch (_error) {
    return [];
  }
}

export function saveStoredRooms(rooms: ChatRoom[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(rooms));
  }
}

export function getStoredMessages(): ChatMessage[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);

  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved) as ChatMessage[];
  } catch (_error) {
    return [];
  }
}

export function saveStoredMessages(messages: ChatMessage[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
  }
}

export function getStoredActiveUser(): TempUser {
  if (typeof window === 'undefined') {
    return DEFAULT_USER;
  }

  const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);

  if (!saved) {
    return DEFAULT_USER;
  }

  const found = TEMP_USERS.find((u) => u.loginId === saved);

  return found ?? DEFAULT_USER;
}

export function saveStoredActiveUser(user: TempUser): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ACTIVE_USER, user.loginId);
  }
}

export function createMockJwtToken(user: TempUser): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: user.id,
    loginId: user.loginId,
    name: user.name,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
  };

  const base64UrlEncode = (obj: object) => {
    const jsonStr = JSON.stringify(obj);
    if (typeof window !== 'undefined') {
      const base64 = btoa(
        encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
          String.fromCharCode(parseInt(p1, 16)),
        ),
      );
      return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    }
    return Buffer.from(jsonStr).toString('base64url');
  };

  return `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.mock_signature`;
}
