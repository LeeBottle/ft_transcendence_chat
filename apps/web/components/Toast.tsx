'use client';
// Toast.tsx
// 원본 toast() 함수를 대체하는 프레젠테이션 컴포넌트
// 표시 여부/타이머 관리는 추후 hooks/useToast.ts에서 담당 예정

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

const TYPE_CLASSES: Record<NonNullable<ToastProps['type']>, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-gray-900',
};

function Toast({ message, type = 'info', onClose }: ToastProps) {
  return (
    <div
      role="status"
      className={`fixed top-5 right-5 flex items-center gap-3 rounded-lg px-5 py-3 text-sm text-white shadow-lg ${TYPE_CLASSES[type]} `}
    >
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="닫기"
          className="cursor-pointer text-white/80 hover:text-white"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default Toast;
