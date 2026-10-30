'use client';

// IconButton — 아이콘 하나만 있는 정사각 버튼 (닫기 ✕, 메뉴 ⋯ 등).
// label 은 필수: 눈에는 안 보여도 스크린리더가 읽어줄 이름.
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type Size = 'sm' | 'md';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: Size;
  variant?: 'ghost' | 'outline';
}

const SIZE_CLASS: Record<Size, string> = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
};

export default function IconButton({
  label,
  size = 'md',
  variant = 'ghost',
  className,
  type = 'button',
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'text-text-muted inline-flex cursor-pointer items-center justify-center rounded-lg transition-colors',
        'hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'outline' && 'border-border-strong bg-surface border',
        SIZE_CLASS[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
