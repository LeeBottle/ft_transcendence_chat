'use client';

// Toast — 화면 오른쪽 위에 잠깐 떴다 사라지는 알림.
// 표시 여부/타이머는 사용하는 쪽에서 관리하고, 이 컴포넌트는 모양만 담당한다.
import IconButton from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose?: () => void;
}

const TYPE_CLASS: Record<ToastType, string> = {
  success: 'bg-success text-white',
  error: 'bg-danger text-white',
  info: 'bg-text text-white',
};

export default function Toast({ message, type = 'info', onClose }: ToastProps) {
  return (
    <div
      role="status"
      className={cn(
        'text-caption fixed top-5 right-5 z-50 flex items-center gap-3 rounded-lg px-5 py-3 shadow-lg',
        TYPE_CLASS[type],
      )}
    >
      <span>{message}</span>
      {onClose !== undefined && (
        <IconButton
          label="닫기"
          size="sm"
          className="text-white/80 hover:bg-white/10 hover:text-white"
          onClick={onClose}
        >
          ✕
        </IconButton>
      )}
    </div>
  );
}
