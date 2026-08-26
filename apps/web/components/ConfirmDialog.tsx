'use client';
// ConfirmDialog.tsx
// 원본 openConfirm()을 대체하는 확인/취소 모달

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex w-80 flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-8 py-7">
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold text-gray-900">{title}</p>
          {description && <p className="text-sm text-gray-400">{description}</p>}
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-9 cursor-pointer rounded-lg border border-gray-300 px-4 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`h-9 cursor-pointer rounded-lg px-4 text-sm transition-colors ${
              danger
                ? 'border border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-purple-500 text-white hover:bg-purple-600'
            } `}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
