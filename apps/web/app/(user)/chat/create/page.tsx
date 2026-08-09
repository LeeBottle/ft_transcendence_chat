'use client';

import { useRouter } from 'next/navigation';

import CreateRoomForm from '@/features/room/components/CreateRoomForm';

export default function CreateRoomPage() {
  const router = useRouter();

  // TODO(API): 실제로는 POST /rooms 로 채팅방 생성 요청 필요 - 지금은 mock
  function handleSubmit(input: { name: string; memberIds: string[] }) {
    // SUCCESS: 생성된 방으로 이동 (지금은 채팅 목록으로만 이동)
    console.warn('create room', input);
    router.push('/chat');
    // FAIL: 생성 실패 시 폼에 에러 메시지를 보여주고 이동하지 않아야 함 (백엔드 연동 시 추가)
  }

  return <CreateRoomForm onCancel={() => { router.push('/chat'); }} onSubmit={handleSubmit} />;
}
