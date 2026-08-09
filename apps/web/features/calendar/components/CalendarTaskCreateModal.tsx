'use client';
// CalendarTaskCreateModal.tsx
// 캘린더 뷰에서 개인 태스크를 새로 생성하는 모달.
// "생성된 채팅방"은 항상 "개인생성"으로 고정 - 채팅방에서 추출된 태스크와 구분하기 위함.

import { useEffect, useState, type FormEvent } from 'react';

import type { CalendarTask } from '../types';

interface CalendarTaskCreateModalProps {
  open: boolean;
  defaultDate: string;
  onCancel: () => void;
  onSubmit: (task: Omit<CalendarTask, 'id' | 'room'>) => void;
}

const PRESET_COLORS = ['#6C63FF', '#0F6E56', '#BA7517', '#D92D20', '#2563EB'];
const DEFAULT_COLOR = PRESET_COLORS[0] ?? '#6C63FF';

function CalendarTaskCreateModal({ open, defaultDate, onCancel, onSubmit }: CalendarTaskCreateModalProps) {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState(defaultDate);
  const [end, setEnd] = useState(defaultDate);
  const [color, setColor] = useState(DEFAULT_COLOR);

  useEffect(() => {
    if (open) {
      setTitle('');
      setStart(defaultDate);
      setEnd(defaultDate);
      setColor(DEFAULT_COLOR);
    }
  }, [open, defaultDate]);

  if (!open) {
    return null;
  }

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    if (title.trim() === '') {
      return;
    }
    onSubmit({ title: title.trim(), start, end, color });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="w-[420px] bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="h-[50px] border-b border-gray-100 flex items-center px-5">
          <span className="text-sm font-semibold text-gray-900 flex-1">새 태스크 생성</span>
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
            <label htmlFor="ct-title" className="text-xs font-medium text-gray-500">
              태스크 명
            </label>
            <input
              id="ct-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="태스크 이름 입력"
              className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="ct-start" className="text-xs font-medium text-gray-500">
                시작일
              </label>
              <input
                id="ct-start"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="ct-end" className="text-xs font-medium text-gray-500">
                마감일
              </label>
              <input
                id="ct-end"
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">태스크 색상</span>
            <div className="flex gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  style={{ backgroundColor: preset }}
                  aria-label={`색상 ${preset}`}
                  className={`w-7 h-7 rounded-full cursor-pointer ${
                    color === preset ? 'ring-2 ring-offset-2 ring-gray-900' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="ct-room" className="text-xs font-medium text-gray-500">
              생성된 채팅방
            </label>
            <input
              id="ct-room"
              value="개인생성"
              disabled
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
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
            생성
          </button>
        </div>
      </form>
    </div>
  );
}

export default CalendarTaskCreateModal;
