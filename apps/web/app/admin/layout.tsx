'use client';

// 어드민 셸 — 세로 사이드바 (mvp_v5_0706.html ADMIN SHELL 참고).
// role !== 'ADMIN' 이면 접근 차단.
import { useEffect } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/features/auth/AuthContext';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/admin/users', label: '사용자 관리', icon: '👤' },
  { href: '/admin/rooms', label: '채팅방 관리', icon: '💬' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user, logout } = useAuth();

  const allowed = status === 'authenticated' && user?.role === 'ADMIN';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated' && user?.role !== 'ADMIN') {
      router.replace('/calendar');
    }
  }, [status, user, router]);

  if (!allowed) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-400">
        {status === 'loading' ? '불러오는 중…' : '관리자만 접근할 수 있어요.'}
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-14 items-center gap-2.5 border-b border-gray-200 px-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500 text-sm text-white">
            🛡
          </span>
          <span className="text-base font-semibold text-red-600">관리자</span>
        </div>

        <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
          관리 메뉴
        </p>
        <nav className="flex flex-col gap-0.5 px-1.5">
          {NAV.map((item) => {
            const active = pathname === item.href;

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => {
                  router.push(item.href);
                }}
                className={cn(
                  'flex h-9 cursor-pointer items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors',
                  active
                    ? 'bg-purple-50 font-medium text-purple-600'
                    : 'text-gray-600 hover:bg-gray-50',
                )}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => {
            void logout().then(() => {
              router.replace('/login');
            });
          }}
          className="mt-auto flex items-center gap-2.5 border-t border-gray-200 px-4 py-3 text-left hover:bg-gray-50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
            A
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-gray-900">{user.name}</span>
            <span className="block text-[11px] font-medium text-red-600">
              관리자 계정 · 로그아웃
            </span>
          </span>
        </button>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">{children}</main>
    </div>
  );
}
