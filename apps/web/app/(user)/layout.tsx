'use client';

import { usePathname, useRouter } from 'next/navigation';

import Sidebar, { type SidebarItem } from '@/components/Sidebar';

const NAV_ITEMS: SidebarItem[] = [
  { id: 'calendar', label: '캘린더' },
  { id: 'my-page', label: '마이페이지' },
  { id: 'chat', label: '채팅' },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeId = NAV_ITEMS.find((item) => pathname.startsWith(`/${item.id}`))?.id;

  return (
    <div className="flex h-screen">
      <Sidebar items={NAV_ITEMS} activeId={activeId} onSelect={(id) => { router.push(`/${id}`); }} />
      <div className="flex-1 min-w-0 overflow-hidden">{children}</div>
    </div>
  );
}
