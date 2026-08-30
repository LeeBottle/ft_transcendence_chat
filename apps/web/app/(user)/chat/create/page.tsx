'use client';

import { useRouter } from 'next/navigation';

import CreateRoomForm from '@/features/room/components/CreateRoomForm';
import { createRoom } from '@/features/room/roomApi';
import { useRoomContext } from '@/features/room/RoomContext';

export default function CreateRoomPage() {
  const router = useRouter();
  const { setActiveRoomId, refreshRooms } = useRoomContext();

  async function handleSubmit(input: { name: string; memberIds: string[] }): Promise<void> {
    // memberIds 는 유저 검색으로 고른 실제 숫자 id → 생성과 동시에 초대됨
    const room = await createRoom(input.name, input.memberIds);

    // 방금 만든 방이 사이드바에 바로 보이도록 목록을 먼저 갱신한 뒤 이동
    await refreshRooms();
    setActiveRoomId(room.id);
    router.push('/chat');
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
