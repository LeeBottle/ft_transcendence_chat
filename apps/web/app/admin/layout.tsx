'use client';

// 어드민 셸 — 세로 사이드바 (mvp_v5_0706.html ADMIN SHELL 참고).
// role !== 'ADMIN' 이면 접근 차단.
import { useEffect } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import Icon, { type IconName } from '@/components/ui/Icon';
import { useAuth } from '@/features/auth/AuthContext';
import { cn } from '@/lib/cn';

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/admin/users', label: '사용자 관리', icon: 'user' },
  { href: '/admin/rooms', label: '채팅방 관리', icon: 'message' },
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
      <div className="text-body text-text-subtle flex h-screen items-center justify-center">
        {status === 'loading' ? '불러오는 중…' : '관리자만 접근할 수 있어요.'}
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <aside className="border-border bg-surface flex w-56 shrink-0 flex-col border-r">
        <div className="border-border flex h-14 items-center gap-2.5 border-b px-4">
          <span className="bg-danger flex h-7 w-7 items-center justify-center rounded-lg text-white">
            <Icon name="shield" />
          </span>
          <span className="text-body text-danger font-semibold">관리자</span>
        </div>

        <p className="text-text-subtle px-4 pt-3 pb-1 text-[10px] font-semibold tracking-wide uppercase">
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
                  'text-body flex h-9 cursor-pointer items-center gap-2 rounded-lg px-3 text-left transition-colors',
                  active
                    ? 'bg-primary-soft text-primary font-medium'
                    : 'text-text-muted hover:bg-surface-muted',
                )}
              >
                <Icon
                  name={item.icon}
                  size={16}
                />
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
          className="border-border hover:bg-surface-muted mt-auto flex items-center gap-2.5 border-t px-4 py-3 text-left"
        >
          <span className="bg-danger text-caption flex h-8 w-8 items-center justify-center rounded-full font-semibold text-white">
            A
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-text block text-[13px] font-semibold">{user.name}</span>
            <span className="text-danger flex items-center gap-1 text-[11px] font-medium">
              관리자 계정
              <Icon
                name="logout"
                size={12}
              />
            </span>
          </span>
        </button>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">{children}</main>
    </div>
  );
}
