'use client';

import { useState } from 'react';

import RoomTable from '@/features/admin/components/RoomTable';
import type { AdminRoom } from '@/features/admin/types';

const INITIAL_ROOMS: AdminRoom[] = [
  { id: 1, name: '디자인 팀', owner: 'user_01', members: 3, createdAt: '2025-06-01' },
  { id: 2, name: '개발팀 백엔드', owner: 'user_02', members: 7, createdAt: '2025-06-05' },
];

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<AdminRoom[]>(INITIAL_ROOMS);

  // TODO(API): PATCH /admin/rooms/:id 필요 - 지금은 mock
  function handleSaveRoom(id: number, values: { name: string; owner: string }) {
    // SUCCESS: 로컬 목록 갱신
    setRooms((prev) => prev.map((room) => (room.id === id ? { ...room, ...values } : room)));
    // FAIL: 실패 시 원래 값으로 롤백 필요 (백엔드 연동 시 추가)
  }

  // TODO(API): DELETE /admin/rooms/:id 필요 - 지금은 mock
  function handleDeleteRoom(id: number) {
    // SUCCESS: 목록에서 제거
    setRooms((prev) => prev.filter((room) => room.id !== id));
    // FAIL: 실패 시 목록을 그대로 유지하고 에러 토스트 필요 (백엔드 연동 시 추가)
  }

  return <RoomTable rooms={rooms} onSaveRoom={handleSaveRoom} onDeleteRoom={handleDeleteRoom} />;
}
