'use client';

import { useRouter } from 'next/navigation';

import CreateRoomForm from '@/features/room/components/CreateRoomForm';

export default function CreateRoomPage() {
  const router = useRouter();

  // TODO(API): POST /api/chat/rooms 로 방 생성 → 응답의 room.id 로 이동, 실패 시 폼에 에러 표시
  function handleSubmit(_input: { name: string; memberIds: string[] }) {
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
