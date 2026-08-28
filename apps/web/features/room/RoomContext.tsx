'use client';

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

import type { Room } from './types';

interface RoomContextValue {
  rooms: Room[];
  setRooms: Dispatch<SetStateAction<Room[]>>;
  activeRoomId: string | null;
  setActiveRoomId: (id: string) => void;
}

const RoomContext = createContext<RoomContextValue | null>(null);

// (user) 레이아웃 아래 모든 페이지가 같은 채팅방 목록/선택 상태를 공유하기 위한 컨텍스트.
// 사이드바(레이아웃)에서 방을 고르면 /chat 페이지가 그 상태를 그대로 읽어서 보여준다.
export function RoomProvider({ children }: { children: ReactNode }) {
  // TODO(API): GET /api/chat/rooms 로 내 채팅방 목록을 받아 setRooms 로 채운다.
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  return (
    <RoomContext.Provider value={{ rooms, setRooms, activeRoomId, setActiveRoomId }}>
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
