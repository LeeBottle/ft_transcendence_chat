'use client';

// StatusDot — 온라인/오프라인 초록·회색 점. 단독으로도, Avatar 위에 겹쳐서도 쓴다.
import { cn } from '@/lib/cn';

type Size = 'sm' | 'md';

interface StatusDotProps {
  online: boolean;
  size?: Size;
  ring?: boolean; // 아바타 위에 겹칠 때 흰 테두리
  className?: string;
}

const SIZE_CLASS: Record<Size, string> = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
};

export default function StatusDot({
  online,
  size = 'md',
  ring = false,
  className,
}: StatusDotProps) {
  return (
    <span
      title={online ? '온라인' : '오프라인'}
      className={cn(
        'inline-block rounded-full',
        online ? 'bg-success' : 'bg-border-strong',
        ring && 'border-surface border-2',
        SIZE_CLASS[size],
        className,
      )}
    />
  );
}
