'use client';

// Select — 네이티브 <select> 를 앱 스타일로 감싼 것.
// 옵션은 children 으로 <option> 을 직접 넣는다.
import { useId, type SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | null;
}

export default function Select({ label, error, id, className, children, ...rest }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const hasError = typeof error === 'string' && error.length > 0;

  return (
    <div className="flex flex-col gap-1">
      {label !== undefined && (
        <label
          htmlFor={selectId}
          className="text-caption text-text-muted font-medium"
        >
          {label}
        </label>
      )}

      <select
        id={selectId}
        aria-invalid={hasError}
        className={cn(
          'bg-surface text-body h-9 w-full cursor-pointer rounded-lg border px-3 transition-colors outline-none',
          'disabled:bg-surface-muted disabled:cursor-not-allowed',
          hasError
            ? 'border-danger focus:border-danger'
            : 'border-border-strong focus:border-primary-ring',
          className,
        )}
        {...rest}
      >
        {children}
      </select>

      {hasError && <p className="text-caption text-danger">{error}</p>}
    </div>
  );
}
