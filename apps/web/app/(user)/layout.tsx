'use client';

import { useEffect } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import Header from '@/components/Header';
import Sidebar, { type SidebarItem } from '@/components/Sidebar';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/features/auth/AuthContext';
import RoomList from '@/features/room/components/RoomList';
import { RoomProvider, useRoomContext } from '@/features/room/RoomContext';

const NAV_ITEMS: SidebarItem[] = [
  { id: 'calendar', label: '캘린더', icon: <Icon name="calendar" /> },
  { id: 'my-page', label: '마이페이지', icon: <Icon name="user" /> },
  { id: 'friends', label: '친구', icon: <Icon name="users" /> },
];

// pathname 이 /chat/<id> 형태면 그 <id> 를 뽑는다 (/chat, /chat/create 는 제외).
function roomIdFromPath(pathname: string): string | undefined {
  const match = /^\/chat\/([^/]+)$/.exec(pathname);
  const id = match?.[1];

  return id === undefined || id === 'create' ? undefined : id;
}

function RoomSection() {
  const router = useRouter();
  const pathname = usePathname();
  const { rooms } = useRoomContext();

  const activeRoomId = roomIdFromPath(pathname);

  function handleSelectRoom(id: string) {
    router.push(`/chat/${id}`);
  }

  return (
    <div className="mt-2 flex flex-col gap-1 px-3">
      <div className="text-text-subtle px-3 py-1 text-[10px] font-semibold tracking-wide uppercase">
        채팅방
      </div>
      {rooms.length > 0 && (
        <RoomList
          rooms={rooms}
          activeRoomId={activeRoomId}
          onSelectRoom={handleSelectRoom}
        />
      )}
      <button
        onClick={() => {
          router.push('/chat/create');
        }}
        className="border-border-strong text-caption text-text-subtle hover:border-primary-ring hover:text-primary flex h-9 items-center justify-center gap-1 rounded-lg border border-dashed"
      >
        <Icon
          name="plus"
          size={14}
        />
        새 채팅방
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
