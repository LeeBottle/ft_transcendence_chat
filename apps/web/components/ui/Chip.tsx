'use client';

// Chip — 선택된 항목을 보여주는 태그 (초대할 멤버 목록 등). onRemove 를 주면 ✕ 버튼이 생긴다.
import type { ReactNode } from 'react';

import Icon from '@/components/ui/Icon';
import { cn } from '@/lib/cn';

interface ChipProps {
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
}

export default function Chip({ children, onRemove, className }: ChipProps) {
  return (
    <span
      className={cn(
        'border-border bg-surface-muted text-caption text-text inline-flex items-center gap-1 rounded-full border py-1 pr-1.5 pl-2.5',
        className,
      )}
    >
      {children}
      {onRemove !== undefined && (
        <button
          type="button"
          aria-label="제거"
          onClick={onRemove}
          className="text-text-subtle hover:bg-border hover:text-text flex h-4 w-4 cursor-pointer items-center justify-center rounded-full"
        >
          <Icon
            name="close"
            size={12}
          />
        </button>
      )}
    </span>
  );
}
