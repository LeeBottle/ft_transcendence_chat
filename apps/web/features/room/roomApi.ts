// 채팅방 관련 백엔드 호출 + 백엔드 ChatRoomResponse → 화면용 Room 변환.
//
// ⚠️ ft_transcendence_final 머지로 chat 모듈이 대폭 축소됨. 남은 REST:
//   POST   /api/chat/rooms                 방 생성 (body: { title, memberUserLoginIds })
//   GET    /api/chat/rooms                 내 방 목록 { rooms: [...] }
//   POST   /api/chat/rooms/:roomId         방(회의) 종료 — 방장만, 204
//   GET/POST /api/chat/rooms/:roomId/messages
// 삭제됨: 멤버 초대/강퇴, 차단, 주제, 비밀번호, 권한 변경, 방 상세 조회.

import { apiFetch } from '@/features/auth/apiClient';

import {
  chatRoomListResponseSchema,
  createChatRoomRequestSchema,
  createChatRoomResponseSchema,
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
    id: res.roomId,
    name,
    avatarLabel: name.slice(0, 2),
    avatarColor: pickAvatarColor(res.roomId),
    role: res.role,
    closedAt: res.closedAt,
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

  const parsed = chatRoomListResponseSchema.safeParse(await res.json());

  if (!parsed.success) {
    throw new Error('채팅방 목록 응답 형식이 예상과 달라요.');
  }

  return parsed.data.rooms.map(toRoom);
}

/**
 * 새 채팅방 생성. 만든 사람은 서버에서 자동으로 방장(FOUNDER) 멤버가 된다.
 * memberLoginIds 로 넘긴 유저는 생성과 동시에 멤버가 된다.
 */
export async function createRoom(title: string, memberLoginIds: string[] = []): Promise<Room> {
  const body = createChatRoomRequestSchema.parse({
    title: title.trim(),
    memberUserLoginIds: memberLoginIds,
  });

  const res = await apiFetch('/api/chat/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `채팅방을 만들지 못했어요 (${res.status})`));
  }

  const parsed = createChatRoomResponseSchema.safeParse(await res.json());

  if (!parsed.success) {
    throw new Error('채팅방 생성 응답 형식이 예상과 달라요.');
  }

  return toRoom({
    roomId: parsed.data.roomId,
    title: parsed.data.title,
    role: 'OWNER',
    closedAt: null,
    updatedAt: new Date().toISOString(),
  });
}

/** 방(회의) 종료 — 방장 전용. 서버가 room_deleted / session_ended 브로드캐스트. */
export async function closeRoom(roomId: string): Promise<void> {
  const res = await apiFetch(`/api/chat/rooms/${roomId}`, { method: 'POST' });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `채팅방을 종료하지 못했어요 (${res.status})`));
  }
}

/* ── 유저 검색 (방 생성 시 멤버 고르기) — GET /api/users?q= 는 유지됨 ── */

export interface UserSearchResult {
  id: string;
  loginId: string;
  name: string;
  profileImagePath: string | null;
}

/** 유저 검색 — 아이디/이름 부분 일치. 본인은 서버가 제외한다. */
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const q = query.trim();

  if (q === '') {
    return [];
  }

  const res = await apiFetch(`/api/users?q=${encodeURIComponent(q)}&limit=8`);

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `유저 검색에 실패했어요 (${res.status})`));
  }

  const data = (await res.json().catch(() => [])) as unknown;

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((raw) => {
    const u = raw as Record<string, unknown>;

    return {
      id: String(u.id),
      loginId: String(u.loginId),
      name: typeof u.name === 'string' && u.name !== '' ? u.name : String(u.loginId),
      profileImagePath: typeof u.profileImagePath === 'string' ? u.profileImagePath : null,
    };
  });
}
