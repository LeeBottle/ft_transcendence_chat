'use client';

// Menu — 버튼을 누르면 아래에 뜨는 작은 목록 (헤더의 마이페이지/로그아웃 같은 것).
//   바깥을 클릭하거나 ESC 를 누르면 닫힘.
//   <Menu trigger={<button>⋯</button>}> <MenuItem onSelect={...}>수정</MenuItem> ... </Menu>
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface MenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
}

export function MenuItem({
  children,
  onSelect,
  danger = false,
}: {
  children: ReactNode;
  onSelect: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={cn(
        'text-body block h-9 w-full cursor-pointer px-3 text-left leading-9 transition-colors',
        danger ? 'text-danger hover:bg-danger-soft' : 'text-text hover:bg-surface-muted',
      )}
    >
      {children}
    </button>
  );
}

export default function Menu({ trigger, children, align = 'right' }: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointer = (event: MouseEvent): void => {
      if (rootRef.current !== null && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative inline-block"
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((prev) => !prev);
        }}
      >
        {trigger}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'border-border bg-surface absolute top-full z-20 mt-1 min-w-40 overflow-hidden rounded-lg border py-1 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          onClick={() => {
            setOpen(false);
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
