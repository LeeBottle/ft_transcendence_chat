'use client';

// Modal — 화면 위에 뜨는 팝업 상자.
//   - ESC 키 또는 어두운 배경 클릭으로 닫힘
//   - 열려 있는 동안 뒤 배경 스크롤 잠금
//   - title / footer 는 선택. 내용은 children.
import { useEffect, type ReactNode } from 'react';

import IconButton from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';

type Size = 'sm' | 'md' | 'lg';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: Size;
  closeOnBackdrop?: boolean;
}

const SIZE_CLASS: Record<Size, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={cn(
          'rounded-card border-border bg-surface flex max-h-[85vh] w-full flex-col gap-4 overflow-y-auto border px-6 py-5',
          SIZE_CLASS[size],
        )}
        role="dialog"
        aria-modal
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        {title !== undefined && (
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-h3 text-text font-semibold">{title}</h2>
            <IconButton
              label="닫기"
              size="sm"
              onClick={onClose}
            >
              ✕
            </IconButton>
          </div>
        )}

        <div className="text-body text-text">{children}</div>

        {footer !== undefined && <div className="flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
