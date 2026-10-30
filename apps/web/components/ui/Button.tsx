'use client';

// Button — 앱 전체의 기본 버튼.
//   variant: primary(보라, 기본) / secondary(테두리) / danger(빨강) / ghost(배경 없음)
//   size: sm / md(기본)
//   loading: true 면 스피너 표시 + 자동 비활성화
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'border border-border-strong bg-surface text-text-muted hover:bg-surface-muted',
  danger: 'bg-danger text-white hover:bg-danger-hover',
  ghost: 'text-text-muted hover:bg-surface-muted',
};

const SIZE_CLASS: Record<Size, string> = {
  sm: 'h-8 px-3 text-caption',
  md: 'h-9 px-4 text-body',
};

function Spinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
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
  );
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leadingIcon,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled === true || loading}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : leadingIcon}
      {children}
    </button>
  );
}
