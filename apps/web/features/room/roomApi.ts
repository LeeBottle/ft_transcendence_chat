// 채팅방 관련 백엔드 호출 + 백엔드 ChatRoomResponse → 화면용 Room 변환.

import { apiFetch } from '@/features/auth/apiClient';

import {
  chatRoomResponseSchema,
  createChatRoomRequestSchema,
  type ChatRoomResponse,
} from '@repo/schemas/chat';

import type { Room } from './types';

const AVATAR_COLORS: ReadonlyArray<Room['avatarColor']> = ['indigo', 'teal', 'orange', 'pink'];

// 서버는 방 색을 주지 않으므로, 방 id 로부터 항상 같은 색을 뽑아 쓴다.
function pickAvatarColor(id: string): Room['avatarColor'] {
  let hash = 0;

  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }

  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? 'indigo';
}

export function toRoom(res: ChatRoomResponse): Room {
  const name = res.title.trim() === '' ? '이름 없는 방' : res.title;

  return {
    id: res.id,
    name,
    avatarLabel: name.slice(0, 2),
    avatarColor: pickAvatarColor(res.id),
    unreadCount: res.unreadCount,
  };
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { message?: string };

  return body.message ?? fallback;
}

/** 내가 속한 채팅방 목록 */
export async function fetchRooms(): Promise<Room[]> {
  const res = await apiFetch('/api/chat/rooms');

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `채팅방 목록을 불러오지 못했어요 (${res.status})`));
  }

  const parsed = chatRoomResponseSchema.array().safeParse(await res.json());

  if (!parsed.success) {
    throw new Error('채팅방 목록 응답 형식이 예상과 달라요.');
  }

  return parsed.data.map(toRoom);
}

/**
 * 새 채팅방 생성. 만든 사람은 서버에서 자동으로 방장(FOUNDER) 멤버가 된다.
 * (멤버 지정 생성은 유저 검색 API 가 없어 보류 — 1-E)
 */
export async function createRoom(title: string): Promise<Room> {
  const body = createChatRoomRequestSchema.parse({ title: title.trim() });

  const res = await apiFetch('/api/chat/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `채팅방을 만들지 못했어요 (${res.status})`));
  }

  const parsed = chatRoomResponseSchema.safeParse(await res.json());

  if (!parsed.success) {
    throw new Error('채팅방 생성 응답 형식이 예상과 달라요.');
  }

  return toRoom(parsed.data);
}
