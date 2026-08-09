// RoomModal.tsx
// 채팅방 추가/수정 모달 — room 기능과 admin(수정)에서 공유해서 씀

import { useEffect, useState, type FormEvent } from 'react'
import type { RoomFormValues } from '../types'

interface RoomModalProps {
  open: boolean
  mode: 'create' | 'edit'
  initialValues?: RoomFormValues
  onSubmit: (values: RoomFormValues) => void
  onCancel: () => void
}

const EMPTY_VALUES: RoomFormValues = { name: '', id: '', owner: '' }

function RoomModal({ open, mode, initialValues, onSubmit, onCancel }: RoomModalProps) {
  const [values, setValues] = useState<RoomFormValues>(initialValues ?? EMPTY_VALUES)

  useEffect(() => {
    if (open) setValues(initialValues ?? EMPTY_VALUES)
  }, [open, initialValues])

  if (!open) return null

  function handleSubmit(e: FormEvent): void {
    e.preventDefault()
    onSubmit(values)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="w-[460px] bg-white rounded-2xl border border-gray-200 overflow-hidden"
      >
        <div className="h-[50px] border-b border-gray-100 flex items-center px-5">
          <span className="text-sm font-semibold text-gray-900 flex-1">
            {mode === 'create' ? '채팅방 추가' : '채팅방 수정'}
          </span>
          <button
            type="button"
            onClick={onCancel}
            aria-label="닫기"
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:bg-gray-50 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="rm-name" className="text-xs font-medium text-gray-500">채팅방 이름</label>
            <input
              id="rm-name"
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="rm-id" className="text-xs font-medium text-gray-500">채팅방 ID</label>
            <input
              id="rm-id"
              value={values.id}
              onChange={(e) => setValues({ ...values, id: e.target.value })}
              placeholder="자동 생성"
              disabled={mode === 'edit'}
              className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="rm-owner" className="text-xs font-medium text-gray-500">생성자 ID</label>
            <input
              id="rm-owner"
              value={values.owner}
              onChange={(e) => setValues({ ...values, owner: e.target.value })}
              placeholder="user_id"
              className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
            />
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 h-9 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 h-9 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 transition-colors cursor-pointer"
          >
            저장
          </button>
        </div>
      </form>
    </div>
  )
}

export default RoomModal
