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
    <div className="h-screen flex flex-col">
      <div className="h-14 border-b border-gray-200 flex items-center px-6 gap-2 shrink-0 bg-white">
        {ADMIN_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`h-8 px-3.5 rounded-lg text-sm font-medium flex items-center ${
              pathname === tab.href ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
    </div>
  );
}
