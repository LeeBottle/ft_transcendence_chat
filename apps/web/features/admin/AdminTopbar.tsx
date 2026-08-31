'use client';

// 어드민 화면 상단 바 (아이콘 + 제목 + 우측 부가정보)
import type { ReactNode } from 'react';

interface AdminTopbarProps {
  icon: ReactNode;
  title: string;
  trailing?: ReactNode;
}

export default function AdminTopbar({ icon, title, trailing }: AdminTopbarProps) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 px-6">
      <span
        className="text-lg text-purple-600"
        aria-hidden
      >
        {icon}
      </span>
      <span className="text-base font-semibold text-gray-900">{title}</span>
      {trailing !== undefined && <span className="ml-1 text-xs text-gray-400">{trailing}</span>}
    </div>
  );
}
