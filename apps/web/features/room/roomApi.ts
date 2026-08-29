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
    members: res.members?.map((m) => ({
      userId: m.userId,
      name: m.name ?? m.loginId ?? '알 수 없음',
      role: m.role,
    })),
    topic: res.topic,
    hasPassword: res.hasPassword,
    creatorUserId: res.creatorUserId,
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

/** 채팅방 나가기 (본인 탈퇴). 백엔드가 status 를 LEFT 로 바꾸고 room_updated 를 브로드캐스트한다. */
export async function leaveRoom(roomId: string, myUserId: string): Promise<void> {
  await sendRoomAction(
    `/api/chat/rooms/${roomId}/members/${myUserId}`,
    { method: 'DELETE' },
    '채팅방을 나가지 못했어요',
  );
}

/** 방장 전용: 방 삭제(closeRoom). room_deleted / room_updated 브로드캐스트됨. */
export async function deleteRoom(roomId: string): Promise<void> {
  await sendRoomAction(
    `/api/chat/rooms/${roomId}`,
    { method: 'DELETE' },
    '채팅방을 삭제하지 못했어요',
  );
}

/** 방장/운영자: 주제 변경 */
export async function updateRoomTopic(roomId: string, topic: string): Promise<void> {
  await sendRoomAction(
    `/api/chat/rooms/${roomId}/topic`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    },
    '주제를 변경하지 못했어요',
  );
}

/** 방장: 비밀번호 설정(문자열) / 해제(null → 공개방) */
export async function updateRoomPassword(roomId: string, password: string | null): Promise<void> {
  await sendRoomAction(
    `/api/chat/rooms/${roomId}/password`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    },
    '비밀번호를 변경하지 못했어요',
  );
}

/** 방장/운영자: 멤버 강퇴 (status KICKED) */
export async function kickMember(roomId: string, targetUserId: string): Promise<void> {
  await sendRoomAction(
    `/api/chat/rooms/${roomId}/members/${targetUserId}`,
    { method: 'DELETE' },
    '강퇴하지 못했어요',
  );
}

/** 방장/운영자: 멤버 차단(Ban) */
export async function banMember(roomId: string, targetUserId: string): Promise<void> {
  await sendRoomAction(
    `/api/chat/rooms/${roomId}/bans/${targetUserId}`,
    { method: 'POST' },
    '차단하지 못했어요',
  );
}

/** 방장/운영자: 차단 해제 */
export async function unbanMember(roomId: string, targetUserId: string): Promise<void> {
  await sendRoomAction(
    `/api/chat/rooms/${roomId}/bans/${targetUserId}`,
    { method: 'DELETE' },
    '차단을 해제하지 못했어요',
  );
}

/** 방장: 멤버 권한 변경 */
export async function updateMemberRole(
  roomId: string,
  targetUserId: string,
  role: 'FOUNDER' | 'OPERATOR' | 'USER',
): Promise<void> {
  await sendRoomAction(
    `/api/chat/rooms/${roomId}/members/${targetUserId}/role`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    },
    '권한을 변경하지 못했어요',
  );
}

export interface BannedMember {
  userId: string;
  loginId: string;
  name: string;
  bannedAt: string;
}

/** 방장/운영자: 차단 목록 조회 */
export async function fetchBans(roomId: string): Promise<BannedMember[]> {
  const res = await apiFetch(`/api/chat/rooms/${roomId}/bans`);

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `차단 목록을 불러오지 못했어요 (${res.status})`));
  }

  const data = (await res.json().catch(() => [])) as unknown;

  return Array.isArray(data) ? (data as BannedMember[]) : [];
}

// 응답 본문을 쓰지 않는 방 관리 액션 공통 처리
async function sendRoomAction(path: string, init: RequestInit, fallback: string): Promise<void> {
  const res = await apiFetch(path, init);

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `${fallback} (${res.status})`));
  }
}
