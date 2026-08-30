// 친구 관련 백엔드 호출.
// 백엔드 (머지 f86198a):
//   GET    /api/users/me/friends           → { friends: ProfileResponse[] }  (친구별 isOnline 포함)
//   POST   /api/users/me/friends/:friendId  → 204  (숫자 user id. 즉시 친구됨 — 요청/수락 절차 없음)
//   DELETE /api/users/me/friends/:friendId  → 204

import { apiFetch } from '@/features/auth/apiClient';

export interface Friend {
  id: string; // 숫자 user id (문자열로 옴)
  loginId: string;
  name: string;
  profileImagePath: string | null;
  isOnline: boolean;
}

function asString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return '';
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { message?: string };

  return body.message ?? fallback;
}

function toFriend(raw: unknown): Friend {
  const u = (raw ?? {}) as Record<string, unknown>;
  const loginId = asString(u.loginId);
  const name = typeof u.name === 'string' && u.name !== '' ? u.name : loginId;

  return {
    id: asString(u.id),
    loginId,
    name,
    profileImagePath: typeof u.profileImagePath === 'string' ? u.profileImagePath : null,
    isOnline: u.isOnline === true,
  };
}

/** 내 친구 목록 (온라인 상태 포함) */
export async function fetchFriends(): Promise<Friend[]> {
  const res = await apiFetch('/api/users/me/friends');

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `친구 목록을 불러오지 못했어요 (${res.status})`));
  }

  const data = (await res.json().catch(() => ({}))) as { friends?: unknown };

  if (!Array.isArray(data.friends)) {
    return [];
  }

  return data.friends.map(toFriend);
}

/** 친구 추가 — 대상은 숫자 user id. 백엔드가 바로 친구로 등록한다(수락 없음). */
export async function addFriend(friendUserId: string): Promise<void> {
  const res = await apiFetch(`/api/users/me/friends/${encodeURIComponent(friendUserId)}`, {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, '친구를 추가하지 못했어요'));
  }
}

/** 친구 삭제 */
export async function removeFriend(friendUserId: string): Promise<void> {
  const res = await apiFetch(`/api/users/me/friends/${encodeURIComponent(friendUserId)}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, '친구를 삭제하지 못했어요'));
  }
}
