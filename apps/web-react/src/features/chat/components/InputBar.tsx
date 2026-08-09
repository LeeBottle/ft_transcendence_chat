// InputBar.tsx (.input-bar)

import type { FormEvent } from 'react'

interface InputBarProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
}

function InputBar({ value, onChange, onSend, disabled }: InputBarProps) {
  function handleSubmit(e: FormEvent): void {
    e.preventDefault()
    if (!value.trim() || disabled) return
    onSend()
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-100 px-3.5 py-3 flex items-center gap-2 shrink-0">
      <button
        type="button"
        disabled={disabled}
        aria-label="파일 첨부"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        📎
      </button>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? '회의가 종료됐어요' : '메시지를 입력하세요... (Enter로 전송)'}
        className="flex-1 h-9.5 px-4 rounded-full border border-gray-300 bg-gray-50 text-[13.5px] outline-none focus:border-purple-400 disabled:opacity-45 disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={disabled}
        aria-label="전송"
        className="w-9 h-9 rounded-full bg-purple-500 text-white flex items-center justify-center cursor-pointer hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
      >
        ➤
      </button>
    </form>
  )
}

export default InputBar
