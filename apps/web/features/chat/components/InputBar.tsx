'use client';

// InputBar.tsx (.input-bar)
import type { FormEvent } from 'react';

interface InputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

function InputBar({ value, onChange, onSend, disabled = false }: InputBarProps) {
  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    if (!value.trim() || disabled) {
      return;
    }
    onSend();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex shrink-0 items-center gap-2 border-t border-gray-100 px-3.5 py-3"
    >
      <button
        type="button"
        disabled={disabled}
        aria-label="파일 첨부"
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        📎
      </button>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        disabled={disabled}
        placeholder={disabled ? '회의가 종료됐어요' : '메시지를 입력하세요... (Enter로 전송)'}
        className="h-9.5 flex-1 rounded-full border border-gray-300 bg-gray-50 px-4 text-[13.5px] outline-none focus:border-purple-400 disabled:cursor-not-allowed disabled:opacity-45"
      />
      <button
        type="submit"
        disabled={disabled}
        aria-label="전송"
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-purple-500 text-white hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ➤
      </button>
    </form>
  );
}

export default InputBar;
