'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { apiFetch, refreshAccessToken } from '@/features/auth/apiClient';
import { useAuth } from '@/features/auth/AuthContext';
import {
  connectChatSocket,
  disconnectChatSocket,
  reconnectChatSocket,
} from '@/features/chat/socket';

import { chatRoomResponseSchema, type ChatRoomResponse } from '@repo/schemas/chat';

import type { Room } from './types';

interface RoomContextValue {
  rooms: Room[];
  activeRoomId: string | null;
  setActiveRoomId: (id: string) => void;
  /** 방 생성/삭제/변경 후 서버 기준으로 목록을 다시 불러온다. */
  refreshRooms: () => Promise<void>;
}

const RoomContext = createContext<RoomContextValue | null>(null);

const AVATAR_COLORS: ReadonlyArray<Room['avatarColor']> = ['indigo', 'teal', 'orange', 'pink'];

// 서버는 방 색을 주지 않으므로, 방 id 로부터 항상 같은 색을 뽑아 쓴다.
function pickAvatarColor(id: string): Room['avatarColor'] {
  let hash = 0;

  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }

  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? 'indigo';
}

// 백엔드 ChatRoomResponse → 화면용 Room
function toRoom(res: ChatRoomResponse): Room {
  const name = res.title.trim() === '' ? '이름 없는 방' : res.title;

  return {
    id: res.id,
    name,
    avatarLabel: name.slice(0, 2),
    avatarColor: pickAvatarColor(res.id),
    unreadCount: res.unreadCount,
  };
}

async function fetchRooms(): Promise<Room[]> {
  const res = await apiFetch('/api/chat/rooms');

  if (!res.ok) {
    throw new Error(`채팅방 목록을 불러오지 못했어요 (${res.status})`);
  }

  const parsed = chatRoomResponseSchema.array().safeParse(await res.json());

  if (!parsed.success) {
    throw new Error('채팅방 목록 응답 형식이 예상과 달라요.');
  }

  return parsed.data.map(toRoom);
}

// WsException 메시지가 토큰/인증 관련인지 (→ 재발급 후 재연결 대상)
function isAuthError(payload: unknown): boolean {
  let message: unknown = payload;

  if (payload !== null && typeof payload === 'object' && 'message' in payload) {
    message = payload.message;
  }

  return typeof message === 'string' && (message.includes('토큰') || message.includes('인증'));
}

// (user) 레이아웃 아래 모든 페이지가 같은 채팅방 목록/선택 상태를 공유하기 위한 컨텍스트.
// 사이드바(레이아웃)에서 방을 고르면 /chat 페이지가 그 상태를 그대로 읽어서 보여준다.
export function RoomProvider({ children }: { children: ReactNode }) {
  const { status, getAccessToken } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  // 소켓 이벤트 핸들러에서 최신 방 목록을 읽기 위한 ref (재구독 없이)
  const roomsRef = useRef<Room[]>([]);

  roomsRef.current = rooms;

  const refreshRooms = useCallback(async () => {
    try {
      setRooms(await fetchRooms());
    } catch (error) {
      console.error(error);
    }
  }, []);

  // 인증된 동안: 방 목록 로드 + 소켓 연결 + 방 이벤트 구독
  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    const run = { active: true };
    const socket = connectChatSocket(getAccessToken);

    const joinAllRooms = () => {
      for (const room of roomsRef.current) {
        socket.emit('join_room', { roomId: room.id });
      }
    };

    const reloadRooms = () => {
      void refreshRooms();
    };

    const handleException = (payload: unknown) => {
      if (!isAuthError(payload)) {
        console.error('채팅 소켓 예외:', payload);

        return;
      }

      void refreshAccessToken().then((next) => {
        if (next !== null && run.active) {
          reconnectChatSocket();
        }
      });
    };

    socket.on('connect', joinAllRooms);
    socket.on('room_created', reloadRooms);
    socket.on('room_updated', reloadRooms);
    socket.on('room_deleted', reloadRooms);
    socket.on('exception', handleException);

    void (async () => {
      try {
        const next = await fetchRooms();

        if (!run.active) {
          return;
        }

        setRooms(next);

        for (const room of next) {
          socket.emit('join_room', { roomId: room.id });
        }
      } catch (error) {
        if (run.active) {
          console.error(error);
        }
      }
    })();

    return () => {
      run.active = false;
      socket.off('connect', joinAllRooms);
      socket.off('room_created', reloadRooms);
      socket.off('room_updated', reloadRooms);
      socket.off('room_deleted', reloadRooms);
      socket.off('exception', handleException);
    };
  }, [status, getAccessToken, refreshRooms]);

  // 로그아웃(미인증 전환) 시 소켓 완전 종료 + 상태 초기화
  useEffect(() => {
    if (status === 'unauthenticated') {
      disconnectChatSocket();
      setRooms([]);
      setActiveRoomId(null);
    }
  }, [status]);

  const value = useMemo<RoomContextValue>(
    () => ({ rooms, activeRoomId, setActiveRoomId, refreshRooms }),
    [rooms, activeRoomId, refreshRooms],
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoomContext(): RoomContextValue {
  const ctx = useContext(RoomContext);

  if (ctx === null) {
    throw new Error('useRoomContext는 RoomProvider 내부에서만 사용할 수 있어요.');
  }

  return ctx;
}
