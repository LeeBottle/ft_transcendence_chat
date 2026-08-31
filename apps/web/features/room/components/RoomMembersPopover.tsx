'use client';

// 채팅방 헤더의 "N명" 을 눌렀을 때 뜨는 참여자 목록 팝오버.
// 열릴 때 GET /api/chat/rooms/:id/members 로 로드하고, user_joined/user_left WS 이벤트로 갱신.
import { useCallback, useEffect, useRef, useState } from 'react';

import Avatar from '@/components/Avatar';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { getChatSocket } from '@/features/chat/socket';
import { fetchRoomMembers, type RoomMember } from '@/features/room/roomApi';

interface RoomMembersPopoverProps {
  roomId: string;
  memberCount?: number;
}

const ROLE_LABEL: Record<string, string> = {
  OWNER: '방장',
  MANAGER: '운영자',
  MEMBER: '',
};

export default function RoomMembersPopover({ roomId, memberCount }: RoomMembersPopoverProps) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<RoomMember[] | null>(null);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      setMembers(await fetchRoomMembers(roomId));
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // 방이 바뀌면 캐시 비우기 (닫힌 채로)
  useEffect(() => {
    setMembers(null);
    setOpen(false);
  }, [roomId]);

  // 열려 있는 동안: 최초 로드 + user_joined/left 시 갱신 + 바깥 클릭/ESC 닫기
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    void load();

    const socket = getChatSocket();
    const refresh = (): void => {
      void load();
    };

    if (socket !== null) {
      socket.on('user_joined', refresh);
      socket.on('user_left', refresh);
    }

    const handlePointer = (event: MouseEvent): void => {
      if (rootRef.current !== null && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);

    return () => {
      if (socket !== null) {
        socket.off('user_joined', refresh);
        socket.off('user_left', refresh);
      }

      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, load]);

  const count = members?.length ?? memberCount;

  return (
    <div
      ref={rootRef}
      className="relative inline-block"
    >
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
        }}
        className="cursor-pointer rounded px-1 text-xs text-gray-400 hover:bg-gray-50 hover:text-gray-600"
      >
        {count === undefined ? '참여자' : `${count}명`} ▾
      </button>

      {open && (
        <div className="absolute top-full left-0 z-20 mt-1 max-h-72 w-56 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <p className="px-3 py-1.5 text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
            참여자 {count ?? ''}
          </p>

          {loading && members === null && (
            <div className="px-3 py-3">
              <Spinner
                size="sm"
                label="불러오는 중…"
              />
            </div>
          )}

          {members?.map((m) => (
            <div
              key={m.userId}
              className="flex items-center gap-2 px-3 py-1.5"
            >
              <Avatar
                name={m.name}
                imageUrl={m.profileImagePath}
                size="sm"
                status={m.isOnline ? 'online' : 'offline'}
              />
              <span className="flex-1 truncate text-sm text-gray-800">{m.name}</span>
              {ROLE_LABEL[m.role] !== undefined && ROLE_LABEL[m.role] !== '' && (
                <Badge variant={m.role === 'OWNER' ? 'primary' : 'neutral'}>
                  {ROLE_LABEL[m.role]}
                </Badge>
              )}
            </div>
          ))}

          {members !== null && members.length === 0 && !loading && (
            <p className="px-3 py-3 text-xs text-gray-400">참여자가 없어요.</p>
          )}
        </div>
      )}
    </div>
  );
}
