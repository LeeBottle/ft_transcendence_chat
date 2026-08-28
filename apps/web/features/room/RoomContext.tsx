'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

import type { Room } from './types';

// TODO(API): GET /rooms 로 내 채팅방 목록 조회 필요 - 지금은 mock
const MOCK_ROOMS: Room[] = [
  { id: '1', name: '디자인 팀', avatarLabel: '디', avatarColor: 'indigo', unreadCount: 3 },
  { id: '2', name: '박민준', avatarLabel: '박', avatarColor: 'teal' },
  { id: '3', name: '개발팀 백엔드', avatarLabel: '백', avatarColor: 'orange', unreadCount: 7 },
];

interface RoomContextValue {
  rooms: Room[];
  activeRoomId: string | null;
  setActiveRoomId: (id: string) => void;
}

const RoomContext = createContext<RoomContextValue | null>(null);

// (user) 레이아웃 아래 모든 페이지가 같은 채팅방 목록/선택 상태를 공유하기 위한 컨텍스트.
// 사이드바(레이아웃)에서 방을 고르면 /chat 페이지가 그 상태를 그대로 읽어서 보여준다.
export function RoomProvider({ children }: { children: ReactNode }) {
  const [rooms] = useState<Room[]>(MOCK_ROOMS);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(MOCK_ROOMS[0]?.id ?? null);

  return (
    <RoomContext.Provider value={{ rooms, activeRoomId, setActiveRoomId }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoomContext(): RoomContextValue {
  const ctx = useContext(RoomContext);
  if (ctx === null) {
    throw new Error('useRoomContext는 RoomProvider 내부에서만 사용할 수 있어요.');
  }
  return ctx;
}
