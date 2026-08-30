'use client';

// Badge — 아주 작은 상태 표시 알약 (역할: 방장/운영자, 상태: 활성/정지 등).
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

type Variant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

const VARIANT_CLASS: Record<Variant, string> = {
  neutral: 'bg-surface-muted text-text-muted',
  primary: 'bg-primary-soft text-primary-hover',
  success: 'bg-success-soft text-success-hover',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

export default function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'text-caption inline-flex items-center rounded-full px-2 py-0.5 font-medium',
        VARIANT_CLASS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
