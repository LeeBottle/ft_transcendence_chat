// ConfirmDialog.tsx
// 원본 openConfirm()을 대체하는 확인/취소 모달

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
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
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="
          flex flex-col gap-4
          bg-white rounded-2xl border border-gray-200
          px-8 py-7 w-80
        "
      >
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold text-gray-900">{title}</p>
          {description && (
            <p className="text-sm text-gray-400">{description}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onCancel}
            className="
              px-4 h-9 rounded-lg
              border border-gray-300 text-gray-600 text-sm
              hover:bg-gray-50 transition-colors cursor-pointer
            "
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`
              px-4 h-9 rounded-lg text-sm transition-colors cursor-pointer
              ${danger
                ? 'bg-red-50 text-red-600 border border-red-300 hover:bg-red-100'
                : 'bg-purple-500 text-white hover:bg-purple-600'}
            `}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
