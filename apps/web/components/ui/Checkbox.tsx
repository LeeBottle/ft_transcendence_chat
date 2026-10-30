'use client';

// Checkbox — 체크박스 + 옆에 라벨. 라벨을 눌러도 토글된다.
import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

export default function Checkbox({ label, id, className, disabled, ...rest }: CheckboxProps) {
  const autoId = useId();
  const boxId = id ?? autoId;

  return (
    <label
      htmlFor={boxId}
      className={cn(
        'text-body text-text inline-flex cursor-pointer items-center gap-2',
        disabled === true && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <input
        id={boxId}
        type="checkbox"
        disabled={disabled}
        className="border-border-strong text-primary accent-primary focus:ring-primary-ring h-4 w-4 cursor-pointer rounded"
        {...rest}
      />
      {label}
    </label>
  );
}
