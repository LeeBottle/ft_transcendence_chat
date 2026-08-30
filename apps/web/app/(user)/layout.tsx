'use client';

import { useEffect } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import Header from '@/components/Header';
import Sidebar, { type SidebarItem } from '@/components/Sidebar';
import { useAuth } from '@/features/auth/AuthContext';
import RoomList from '@/features/room/components/RoomList';
import { RoomProvider, useRoomContext } from '@/features/room/RoomContext';

const NAV_ITEMS: SidebarItem[] = [
  { id: 'calendar', label: '캘린더' },
  { id: 'my-page', label: '마이페이지' },
  { id: 'chat', label: '채팅' },
  { id: 'friends', label: '친구' },
];

function RoomSection() {
  const router = useRouter();
  const { rooms, activeRoomId, setActiveRoomId } = useRoomContext();

  function handleSelectRoom(id: string) {
    setActiveRoomId(id);
    router.push('/chat');
  }

  return (
    <div className="mt-2 flex flex-col gap-1 px-3">
      <div className="px-3 py-1 text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
        채팅방
      </div>
      {rooms.length > 0 && (
        <RoomList
          rooms={rooms}
          activeRoomId={activeRoomId ?? undefined}
          onSelectRoom={handleSelectRoom}
        />
      )}
      <button
        onClick={() => {
          router.push('/chat/create');
        }}
        className="h-9 cursor-pointer rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 hover:border-purple-400 hover:text-purple-500"
      >
        + 새 채팅방
      </button>
    </div>
  );
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user, logout } = useAuth();

  // 미인증이면 로그인 화면으로
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status !== 'authenticated' || user === null) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-400">
        {status === 'loading' ? '불러오는 중…' : '로그인이 필요합니다.'}
      </div>
    );
  }

  const activeId = NAV_ITEMS.find((item) => pathname.startsWith(`/${item.id}`))?.id;

  return (
    <RoomProvider>
      <div className="flex h-screen flex-col">
        <Header
          username={user.name}
          onLogout={() => {
            void logout().then(() => {
              router.replace('/login');
            });
          }}
        />
        <div className="flex flex-1 overflow-hidden">
          <aside className="flex h-full w-56 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white">
            <Sidebar
              items={NAV_ITEMS}
              activeId={activeId}
              onSelect={(id) => {
                router.push(`/${id}`);
              }}
            />
            <RoomSection />
          </aside>
          <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
        </div>
      </div>
    </RoomProvider>
  );
}
