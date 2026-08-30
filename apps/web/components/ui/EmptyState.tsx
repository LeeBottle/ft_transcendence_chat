'use client';

// EmptyState — "아직 아무것도 없어요" 화면. 아이콘 + 제목 + 설명 + (버튼).
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2 py-16 text-center', className)}>
      {icon !== undefined && (
        <span
          className="text-3xl"
          aria-hidden
        >
          {icon}
        </span>
      )}
      <p className="text-body text-text font-medium">{title}</p>
      {description !== undefined && (
        <p className="text-caption text-text-subtle max-w-xs">{description}</p>
      )}
      {action !== undefined && <div className="mt-2">{action}</div>}
    </div>
  );
}
