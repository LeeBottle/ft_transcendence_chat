'use client';
// Header.tsx
// 사용자 뷰 상단 헤더 - 왼쪽 로고, 오른쪽 유저 id + 토글 메뉴(마이페이지/로그아웃)

import Link from 'next/link';
import { useState } from 'react';

interface HeaderProps {
  username: string;
  onLogout: () => void;
}

function Header({ username, onLogout }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-14 border-b border-gray-200 flex items-center px-4 gap-2 shrink-0 bg-white z-10">
      <Link href="/calendar" className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center text-sm">
          💬
        </span>
        <span className="text-base font-semibold text-gray-900">TaskChat</span>
      </Link>

      <div className="flex-1" />

      <div className="relative">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 h-9 px-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          <span className="w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-semibold">
            나
          </span>
          {username}
        </button>

        {menuOpen && (
          <>
            {/* 메뉴 바깥 클릭 시 닫히도록 하는 투명 오버레이 */}
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-11 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
              <Link
                href="/my-page"
                onClick={() => setMenuOpen(false)}
                className="block px-3 h-9 leading-9 text-sm text-gray-700 hover:bg-gray-50"
              >
                마이페이지
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="block w-full text-left px-3 h-9 leading-9 text-sm text-red-500 hover:bg-red-50 cursor-pointer"
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
