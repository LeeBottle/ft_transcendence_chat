// 마이페이지 프로필 — GET / PATCH /api/users/me
// 백엔드 selfUserProfileResponseSchema 대응 (해당 스키마는 apps/api 내부에만 있어 직접 import 불가 → 여기서 형태 검증)

import { apiFetch } from '@/features/auth/apiClient';

export interface MyProfile {
  id: string;
  loginId: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  status: string;
  profileImagePath: string | null;
  // ⚠️ createdAt(가입일)은 백엔드 응답에 없음 — 스키마 추가 필요 (todos 2-A)
}

function normalizeProfile(data: Partial<MyProfile>): MyProfile {
  if (typeof data.id !== 'string' || typeof data.loginId !== 'string') {
    throw new Error('프로필 응답 형식이 예상과 달라요.');
  }

  return {
    id: data.id,
    loginId: data.loginId,
    name: typeof data.name === 'string' && data.name !== '' ? data.name : data.loginId,
    email: typeof data.email === 'string' ? data.email : '',
    role: data.role === 'ADMIN' ? 'ADMIN' : 'USER',
    status: typeof data.status === 'string' ? data.status : 'ACTIVE',
    profileImagePath: typeof data.profileImagePath === 'string' ? data.profileImagePath : null,
  };
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { message?: string };

  return body.message ?? fallback;
}

export async function fetchMyProfile(): Promise<MyProfile> {
  const res = await apiFetch('/api/users/me');

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `프로필을 불러오지 못했어요 (${res.status})`));
  }

  return normalizeProfile((await res.json()) as Partial<MyProfile>);
}

/**
 * 회원 정보 수정. `PATCH /api/users/me` — 백엔드가 `name`(필수), `email`(선택)을 받고
 * `{ name, email }` 만 돌려준다. (전체 프로필이 아님)
 * 이메일 중복이면 409.
 */
export async function updateMyProfile(patch: {
  name: string;
  email?: string;
}): Promise<{ name: string; email: string }> {
  const res = await apiFetch('/api/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `프로필을 저장하지 못했어요 (${res.status})`));
  }

  const data = (await res.json()) as { name?: unknown; email?: unknown };

  return {
    name: typeof data.name === 'string' ? data.name : patch.name,
    email: typeof data.email === 'string' ? data.email : (patch.email ?? ''),
  };
}
