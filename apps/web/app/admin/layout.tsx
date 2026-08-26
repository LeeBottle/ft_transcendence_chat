'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ADMIN_TABS = [
  { id: 'users', label: '사용자 관리', href: '/admin/users' },
  { id: 'rooms', label: '채팅방 관리', href: '/admin/rooms' },
  { id: 'logs', label: '채팅방 로그', href: '/admin/logs' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-6">
        {ADMIN_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex h-8 items-center rounded-lg px-3.5 text-sm font-medium ${
              pathname === tab.href
                ? 'bg-purple-50 text-purple-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
