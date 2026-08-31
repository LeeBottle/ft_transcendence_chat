'use client';

// 어드민 화면 상단 바 (아이콘 + 제목 + 우측 부가정보)
import type { ReactNode } from 'react';

import Icon, { type IconName } from '@/components/ui/Icon';

interface AdminTopbarProps {
  icon: IconName;
  title: string;
  trailing?: ReactNode;
}

export default function AdminTopbar({ icon, title, trailing }: AdminTopbarProps) {
  return (
    <div className="border-border flex h-14 shrink-0 items-center gap-3 border-b px-6">
      <Icon
        name={icon}
        size={20}
        className="text-primary"
      />
      <span className="text-body text-text font-semibold">{title}</span>
      {trailing !== undefined && (
        <span className="text-caption text-text-subtle ml-1">{trailing}</span>
      )}
    </div>
  );
}
