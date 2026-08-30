'use client';

// Textarea — 여러 줄 입력칸. TextField 와 같은 라벨/에러 규칙.
import { useId, type TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
  hint?: string;
}

export default function Textarea({
  label,
  error,
  hint,
  id,
  className,
  rows = 3,
  ...rest
}: TextareaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hasError = typeof error === 'string' && error.length > 0;

  return (
    <div className="flex flex-col gap-1">
      {label !== undefined && (
        <label
          htmlFor={fieldId}
          className="text-caption text-text-muted font-medium"
        >
          {label}
        </label>
      )}

      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={hasError}
        className={cn(
          'bg-surface text-body w-full resize-y rounded-lg border px-3 py-2 transition-colors outline-none',
          'placeholder:text-text-subtle disabled:bg-surface-muted disabled:cursor-not-allowed',
          hasError
            ? 'border-danger focus:border-danger'
            : 'border-border-strong focus:border-primary-ring',
          className,
        )}
        {...rest}
      />

      {hasError && <p className="text-caption text-danger">{error}</p>}
      {!hasError && hint !== undefined && <p className="text-caption text-text-subtle">{hint}</p>}
    </div>
  );
}
