'use client';

// /chat — 아직 방을 안 고른 상태. 실제 대화는 /chat/[roomId] 에서 보여준다.
import Link from 'next/link';

import { useRoomContext } from '@/features/room/RoomContext';

export default function ChatIndexPage() {
  const { rooms, roomsLoaded } = useRoomContext();

  if (!roomsLoaded) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        불러오는 중…
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-gray-400">
        아직 채팅방이 없어요.
        <Link
          href="/chat/create"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-purple-400 hover:text-purple-500"
        >
          + 새 채팅방 만들기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center text-sm text-gray-400">
      왼쪽 목록에서 채팅방을 선택하세요.
    </div>
  );
}
