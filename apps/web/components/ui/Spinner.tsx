'use client';

// Spinner — 빙글빙글 도는 로딩 표시. 옆에 글자(label)를 붙일 수 있다.
import { cn } from '@/lib/cn';

type Size = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: Size;
  label?: string;
  className?: string;
}

const SIZE_CLASS: Record<Size, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
};

export default function Spinner({ size = 'md', label, className }: SpinnerProps) {
  return (
    <span className={cn('text-text-subtle inline-flex items-center gap-2', className)}>
      <svg
        className={cn('animate-spin', SIZE_CLASS[size])}
        viewBox="0 0 24 24"
        fill="none"
        role="status"
        aria-label={label ?? '로딩 중'}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z"
        />
      </svg>
      {label !== undefined && <span className="text-caption">{label}</span>}
    </span>
  );
}
