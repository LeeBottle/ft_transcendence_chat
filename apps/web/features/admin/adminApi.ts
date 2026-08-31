// 어드민 API — GET/PATCH/DELETE/POST /api/admin/*  (전부 role: ADMIN 가드)

import { apiFetch } from '@/features/auth/apiClient';

import {
  adminChatRoomListResponseSchema,
  adminCreateUserResponseSchema,
  adminUserListQueryResponseSchema,
} from '@repo/schemas/admin';

export type AdminUserStatus = 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';
export type AdminUserRole = 'USER' | 'ADMIN';

export interface AdminUser {
  id: string;
  loginId: string;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  createdAt: string;
}

export interface AdminRoom {
  id: string;
  title: string;
  creatorLoginId: string;
  memberCount: number;
  createdAt: string;
}

async function readError(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { message?: string };

  return body.message ?? `${fallback} (${res.status})`;
}

/* ── 사용자 ── */

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await apiFetch('/api/admin/users?limit=100&sortBy=createdAt&sortOrder=DESC');

  if (!res.ok) {
    throw new Error(await readError(res, '사용자 목록을 불러오지 못했어요'));
  }

  const parsed = adminUserListQueryResponseSchema.safeParse(await res.json());

  if (!parsed.success) {
    throw new Error('사용자 목록 응답 형식이 예상과 달라요.');
  }

  return parsed.data.items;
}

export async function updateAdminUserStatus(
  userId: string,
  status: AdminUserStatus,
): Promise<void> {
  const res = await apiFetch(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error(await readError(res, '상태를 바꾸지 못했어요'));
  }
}

export async function deleteAdminUser(userId: string): Promise<void> {
  const res = await apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });

  if (!res.ok) {
    throw new Error(await readError(res, '사용자를 삭제하지 못했어요'));
  }
}

export interface NewAdminUser {
  loginId: string;
  password: string;
  name: string;
  email: string;
  role: AdminUserRole;
}

export async function createAdminUser(input: NewAdminUser): Promise<AdminUser> {
  const res = await apiFetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(await readError(res, '사용자를 만들지 못했어요'));
  }

  const parsed = adminCreateUserResponseSchema.safeParse(await res.json());

  if (!parsed.success) {
    throw new Error('사용자 생성 응답 형식이 예상과 달라요.');
  }

  return parsed.data;
}

/* ── 채팅방 ── */

export async function fetchAdminRooms(): Promise<AdminRoom[]> {
  const res = await apiFetch('/api/admin/chat/rooms');

  if (!res.ok) {
    throw new Error(await readError(res, '채팅방 목록을 불러오지 못했어요'));
  }

  const parsed = adminChatRoomListResponseSchema.safeParse(await res.json());

  if (!parsed.success) {
    throw new Error('채팅방 목록 응답 형식이 예상과 달라요.');
  }

  return parsed.data.items;
}

export async function updateAdminRoomTitle(roomId: string, title: string): Promise<void> {
  const res = await apiFetch(`/api/admin/chat/rooms/${roomId}/title`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title.trim() }),
  });

  if (!res.ok) {
    throw new Error(await readError(res, '채팅방 이름을 바꾸지 못했어요'));
  }
}

export async function deleteAdminRoom(roomId: string): Promise<void> {
  const res = await apiFetch(`/api/admin/chat/rooms/${roomId}`, { method: 'DELETE' });

  if (!res.ok) {
    throw new Error(await readError(res, '채팅방을 삭제하지 못했어요'));
  }
}
