'use client';

import { useRouter } from 'next/navigation';

import CreateRoomForm from '@/features/room/components/CreateRoomForm';
import { createRoom } from '@/features/room/roomApi';
import { useRoomContext } from '@/features/room/RoomContext';

export default function CreateRoomPage() {
  const router = useRouter();
  const { refreshRooms } = useRoomContext();

  async function handleSubmit(input: { name: string; memberLoginIds: string[] }): Promise<void> {
    // memberLoginIds 는 유저 검색으로 고른 loginId → 생성과 동시에 멤버가 됨
    const room = await createRoom(input.name, input.memberLoginIds);

    // 방금 만든 방이 사이드바에 바로 보이도록 목록을 먼저 갱신한 뒤 그 방으로 이동
    await refreshRooms();
    router.push(`/chat/${room.id}`);
  }

  return (
    <CreateRoomForm
      onCancel={() => {
        router.push('/chat');
      }}
      onSubmit={handleSubmit}
    />
  );
}
