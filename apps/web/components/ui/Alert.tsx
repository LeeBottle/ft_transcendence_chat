'use client';

// Alert — 화면 안에 박아두는 안내/경고 상자 (폼 위의 "저장됨" / "에러" 메시지 등).
//   variant: info(파랑) / success(초록) / warning(주황) / danger(빨강)
import type { ReactNode } from 'react';

import IconButton from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';

type Variant = 'info' | 'success' | 'warning' | 'danger';

interface AlertProps {
  variant?: Variant;
  title?: string;
  children?: ReactNode;
  onClose?: () => void;
}

const VARIANT_CLASS: Record<Variant, string> = {
  info: 'bg-info-soft text-info',
  success: 'bg-success-soft text-success-hover',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

const ICON: Record<Variant, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  danger: '⛔',
};

export default function Alert({ variant = 'info', title, children, onClose }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'text-caption flex items-start gap-2 rounded-lg px-3 py-2.5',
        VARIANT_CLASS[variant],
      )}
    >
      <span aria-hidden>{ICON[variant]}</span>

      <div className="min-w-0 flex-1">
        {title !== undefined && <p className="font-semibold">{title}</p>}
        {children !== undefined && children !== null && (
          <div className="text-text-muted">{children}</div>
        )}
      </div>

      {onClose !== undefined && (
        <IconButton
          label="닫기"
          size="sm"
          onClick={onClose}
        >
          ✕
        </IconButton>
      )}
    </div>
  );
}
