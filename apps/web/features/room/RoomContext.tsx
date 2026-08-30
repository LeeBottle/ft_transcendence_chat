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

import { refreshAccessToken } from '@/features/auth/apiClient';
import { useAuth } from '@/features/auth/AuthContext';
import {
  connectChatSocket,
  disconnectChatSocket,
  getChatSocket,
  reconnectChatSocket,
} from '@/features/chat/socket';

import { fetchRooms } from './roomApi';
import type { Room } from './types';

interface RoomContextValue {
  rooms: Room[];
  /** 최초 방 목록 로드가 끝났는지 (false 면 아직 불러오는 중) */
  roomsLoaded: boolean;
  /** 방 생성/삭제/변경 후 서버 기준으로 목록을 다시 불러온다. */
  refreshRooms: () => Promise<void>;
}

const RoomContext = createContext<RoomContextValue | null>(null);

// WsException 메시지가 토큰/인증 관련인지 (→ 재발급 후 재연결 대상)
function isAuthError(payload: unknown): boolean {
  let message: unknown = payload;

  if (payload !== null && typeof payload === 'object' && 'message' in payload) {
    message = payload.message;
  }

  return typeof message === 'string' && (message.includes('토큰') || message.includes('인증'));
}

// (user) 레이아웃 아래 모든 페이지가 같은 채팅방 목록을 공유하기 위한 컨텍스트.
// 어떤 방을 보고 있는지는 URL(/chat/[roomId])이 정한다 — 컨텍스트는 목록만 관리.
export function RoomProvider({ children }: { children: ReactNode }) {
  const { status, getAccessToken } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoaded, setRoomsLoaded] = useState(false);

  // 소켓 이벤트 핸들러에서 최신 방 목록을 읽기 위한 ref (재구독 없이)
  const roomsRef = useRef<Room[]>([]);

  roomsRef.current = rooms;

  // 현재 소켓 연결에서 이미 join_room 을 보낸 방 id (중복 join 방지)
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  const refreshRooms = useCallback(async () => {
    try {
      setRooms(await fetchRooms());
    } catch (error) {
      console.error(error);
    } finally {
      setRoomsLoaded(true);
    }
  }, []);

  // 인증된 동안: 방 목록 로드 + 소켓 연결 + 방 이벤트 구독
  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    const run = { active: true };
    const joined = joinedRoomsRef.current;
    const socket = connectChatSocket(getAccessToken);

    // 새 연결이 되면 방 소속이 초기화되므로, join 기록을 비우고 전부 다시 join
    const joinAllRooms = () => {
      joined.clear();

      for (const room of roomsRef.current) {
        socket.emit('join_room', { roomId: room.id });
        joined.add(room.id);
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
      } catch (error) {
        if (run.active) {
          console.error(error);
        }
      } finally {
        if (run.active) {
          setRoomsLoaded(true);
        }
      }
    })();

    return () => {
      run.active = false;
      joined.clear();
      socket.off('connect', joinAllRooms);
      socket.off('room_created', reloadRooms);
      socket.off('room_updated', reloadRooms);
      socket.off('room_deleted', reloadRooms);
      socket.off('exception', handleException);
    };
  }, [status, getAccessToken, refreshRooms]);

  // 방 목록이 바뀌면(최초 로드·새 방 생성·초대 등) 아직 join 안 한 방을 join
  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    const socket = getChatSocket();

    if (socket === null) {
      return;
    }

    for (const room of rooms) {
      if (!joinedRoomsRef.current.has(room.id)) {
        socket.emit('join_room', { roomId: room.id });
        joinedRoomsRef.current.add(room.id);
      }
    }
  }, [rooms, status]);

  // 로그아웃(미인증 전환) 시 소켓 완전 종료 + 상태 초기화
  useEffect(() => {
    if (status === 'unauthenticated') {
      disconnectChatSocket();
      joinedRoomsRef.current.clear();
      setRooms([]);
      setRoomsLoaded(false);
    }
  }, [status]);

  const value = useMemo<RoomContextValue>(
    () => ({ rooms, roomsLoaded, refreshRooms }),
    [rooms, roomsLoaded, refreshRooms],
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
