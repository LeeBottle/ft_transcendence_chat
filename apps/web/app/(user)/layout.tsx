'use client';

import { usePathname, useRouter } from 'next/navigation';

import Header from '@/components/Header';
import Sidebar, { type SidebarItem } from '@/components/Sidebar';
import { RoomProvider, useRoomContext } from '@/features/room/RoomContext';
import RoomList from '@/features/room/components/RoomList';
import { MOCK_USER } from '@/features/user/mockUser';

const NAV_ITEMS: SidebarItem[] = [
  { id: 'calendar', label: '캘린더' },
  { id: 'my-page', label: '마이페이지' },
  { id: 'chat', label: '채팅' },
];

function RoomSection() {
  const router = useRouter();
  const { rooms, activeRoomId, setActiveRoomId } = useRoomContext();

  function handleSelectRoom(id: string) {
    setActiveRoomId(id);
    router.push('/chat');
  }

  return (
    <div className="mt-2 px-3 flex flex-col gap-1">
      <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">채팅방</div>
      {rooms.length > 0 && (
        <RoomList rooms={rooms} activeRoomId={activeRoomId ?? undefined} onSelectRoom={handleSelectRoom} />
      )}
      <button
        onClick={() => { router.push('/chat/create'); }}
        className="h-9 rounded-lg border border-dashed border-gray-300 text-gray-400 text-xs cursor-pointer hover:text-purple-500 hover:border-purple-400"
      >
        + 새 채팅방
      </button>
    </div>
  );
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeId = NAV_ITEMS.find((item) => pathname.startsWith(`/${item.id}`))?.id;

  return (
    <RoomProvider>
      <div className="h-screen flex flex-col">
        <Header username={MOCK_USER.username} onLogout={() => { router.push('/login'); }} />
        <div className="flex-1 flex overflow-hidden">
          <aside className="w-56 shrink-0 h-full border-r border-gray-200 bg-white overflow-y-auto flex flex-col">
            <Sidebar items={NAV_ITEMS} activeId={activeId} onSelect={(id) => { router.push(`/${id}`); }} />
            <RoomSection />
          </aside>
          <div className="flex-1 min-w-0 overflow-hidden">{children}</div>
        </div>
      </div>
    </RoomProvider>
  );
}
