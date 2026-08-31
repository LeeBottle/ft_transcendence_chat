'use client';

// Header.tsx
// 사용자 뷰 상단 헤더 - 왼쪽 로고, 오른쪽 유저 id + 토글 메뉴(마이페이지/로그아웃)
import { useState } from 'react';

import Link from 'next/link';

import Icon from '@/components/ui/Icon';

interface HeaderProps {
  username: string;
  onLogout: () => void;
}

function Header({ username, onLogout }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-border bg-surface z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <Link
        href="/calendar"
        className="flex items-center gap-2"
      >
        <span className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg text-white">
          <Icon name="message" />
        </span>
        <span className="text-body text-text font-semibold">TaskChat</span>
      </Link>

      <div className="flex-1" />

      <div className="relative">
        <button
          onClick={() => {
            setMenuOpen((prev) => !prev);
          }}
          className="text-body text-text-muted hover:bg-surface-muted flex h-9 cursor-pointer items-center gap-2 rounded-lg px-2.5"
        >
          <span className="bg-primary text-caption flex h-7 w-7 items-center justify-center rounded-full font-semibold text-white">
            나
          </span>
          {username}
          <Icon
            name="chevron-down"
            size={14}
          />
        </button>

        {menuOpen && (
          <>
            {/* 메뉴 바깥 클릭 시 닫히도록 하는 투명 오버레이 */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => {
                setMenuOpen(false);
              }}
            />
            <div className="border-border bg-surface absolute top-11 right-0 z-20 w-40 overflow-hidden rounded-lg border py-1 shadow-lg">
              <Link
                href="/my-page"
                onClick={() => {
                  setMenuOpen(false);
                }}
                className="text-body text-text hover:bg-surface-muted flex h-9 items-center gap-2 px-3"
              >
                <Icon
                  name="user"
                  size={15}
                />
                마이페이지
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="text-body text-danger hover:bg-danger-soft flex h-9 w-full cursor-pointer items-center gap-2 px-3 text-left"
              >
                <Icon
                  name="logout"
                  size={15}
                />
                로그아웃
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
