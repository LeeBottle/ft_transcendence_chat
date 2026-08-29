'use client';

import { useRouter } from 'next/navigation';

import CreateRoomForm from '@/features/room/components/CreateRoomForm';
import { createRoom } from '@/features/room/roomApi';
import { useRoomContext } from '@/features/room/RoomContext';

export default function CreateRoomPage() {
  const router = useRouter();
  const { setActiveRoomId, refreshRooms } = useRoomContext();

  async function handleSubmit(input: { name: string; memberIds: string[] }): Promise<void> {
    // memberIds 는 아이디(loginId) 문자열이라 백엔드가 원하는 숫자 userId 로 못 바꿈
    // (유저 검색 API 부재 → 1-E). 지금은 title 만 전송하고 초대는 무시한다.
    void input.memberIds;

    const room = await createRoom(input.name);

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
