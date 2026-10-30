'use client';

// TextField — 라벨 + 입력칸 + (에러/도움말)을 한 묶음으로.
//   error 가 있으면 테두리가 빨개지고 아래에 메시지가 뜬다.
//   trailing 으로 오른쪽에 아이콘/버튼(비밀번호 보기 등)을 넣을 수 있다.
import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string | null;
  hint?: string;
  trailing?: ReactNode;
}

export default function TextField({
  label,
  error,
  hint,
  trailing,
  id,
  className,
  ...rest
}: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hasError = typeof error === 'string' && error.length > 0;

  return (
    <div className="flex flex-col gap-1">
      {label !== undefined && (
        <label
          htmlFor={inputId}
          className="text-caption text-text-muted font-medium"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          aria-invalid={hasError}
          className={cn(
            'bg-surface text-body h-9 w-full rounded-lg border px-3 transition-colors outline-none',
            'placeholder:text-text-subtle disabled:bg-surface-muted disabled:cursor-not-allowed',
            hasError
              ? 'border-danger focus:border-danger'
              : 'border-border-strong focus:border-primary-ring',
            trailing !== undefined && 'pr-9',
            className,
          )}
          {...rest}
        />
        {trailing !== undefined && (
          <span className="absolute inset-y-0 right-2 flex items-center">{trailing}</span>
        )}
      </div>

      {hasError && <p className="text-caption text-danger">{error}</p>}
      {!hasError && hint !== undefined && <p className="text-caption text-text-subtle">{hint}</p>}
    </div>
  );
}
