'use client';

// Header.tsx
// 사용자 뷰 상단 헤더 - 왼쪽 로고, 오른쪽 유저 id + 토글 메뉴(마이페이지/로그아웃)
import { useState } from 'react';

import Link from 'next/link';

interface HeaderProps {
  username: string;
  onLogout: () => void;
}

function Header({ username, onLogout }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="z-10 flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4">
      <Link
        href="/calendar"
        className="flex items-center gap-2"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500 text-sm text-white">
          💬
        </span>
        <span className="text-base font-semibold text-gray-900">TaskChat</span>
      </Link>

      <div className="flex-1" />

      <div className="relative">
        <button
          onClick={() => {
            setMenuOpen((prev) => !prev);
          }}
          className="flex h-9 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500 text-xs font-semibold text-white">
            나
          </span>
          {username}
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
            <div className="absolute top-11 right-0 z-20 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <Link
                href="/my-page"
                onClick={() => {
                  setMenuOpen(false);
                }}
                className="block h-9 px-3 text-sm leading-9 text-gray-700 hover:bg-gray-50"
              >
                마이페이지
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="block h-9 w-full cursor-pointer px-3 text-left text-sm leading-9 text-red-500 hover:bg-red-50"
              >
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
