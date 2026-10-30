'use client';

// CalendarTaskCreateModal.tsx
// 캘린더 뷰에서 개인 태스크를 새로 생성하는 모달.
// "생성된 채팅방"은 항상 "개인생성"으로 고정 - 채팅방에서 추출된 태스크와 구분하기 위함.
import { useEffect, useState, type FormEvent } from 'react';

export interface NewCalendarTaskInput {
  title: string;
  start: string;
  end: string;
  color: string;
}

interface CalendarTaskCreateModalProps {
  open: boolean;
  defaultDate: string;
  onCancel: () => void;
  /** 성공 시 resolve(모달 닫힘), 실패 시 서버 메시지로 throw */
  onSubmit: (task: NewCalendarTaskInput) => void | Promise<void>;
}

const PRESET_COLORS = ['#6C63FF', '#0F6E56', '#BA7517', '#D92D20', '#2563EB'];
const DEFAULT_COLOR = PRESET_COLORS[0] ?? '#6C63FF';

function CalendarTaskCreateModal({
  open,
  defaultDate,
  onCancel,
  onSubmit,
}: CalendarTaskCreateModalProps) {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState(defaultDate);
  const [end, setEnd] = useState(defaultDate);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle('');
      setStart(defaultDate);
      setEnd(defaultDate);
      setColor(DEFAULT_COLOR);
      setError(null);
      setSubmitting(false);
    }
  }, [open, defaultDate]);

  if (!open) {
    return null;
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();

    if (title.trim() === '') {
      setError('태스크 이름을 입력해 주세요.');

      return;
    }

    if (end < start) {
      setError('마감일은 시작일보다 빠를 수 없어요.');

      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await onSubmit({ title: title.trim(), start, end, color });
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : '태스크를 만들지 못했어요.');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="w-[420px] overflow-hidden rounded-2xl border border-gray-200 bg-white"
      >
        <div className="flex h-[50px] items-center border-b border-gray-100 px-5">
          <span className="flex-1 text-sm font-semibold text-gray-900">새 태스크 생성</span>
          <button
            type="button"
            onClick={onCancel}
            aria-label="닫기"
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-gray-400 hover:bg-gray-50"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="ct-title"
              className="text-xs font-medium text-gray-500"
            >
              태스크 명
            </label>
            <input
              id="ct-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
              }}
              placeholder="태스크 이름 입력"
              className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="ct-start"
                className="text-xs font-medium text-gray-500"
              >
                시작일
              </label>
              <input
                id="ct-start"
                type="date"
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                }}
                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="ct-end"
                className="text-xs font-medium text-gray-500"
              >
                마감일
              </label>
              <input
                id="ct-end"
                type="date"
                value={end}
                onChange={(e) => {
                  setEnd(e.target.value);
                }}
                className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
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
                  onClick={() => {
                    setColor(preset);
                  }}
                  style={{ backgroundColor: preset }}
                  aria-label={`색상 ${preset}`}
                  className={`h-7 w-7 cursor-pointer rounded-full ${
                    color === preset ? 'ring-2 ring-gray-900 ring-offset-2' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="ct-room"
              className="text-xs font-medium text-gray-500"
            >
              생성된 채팅방
            </label>
            <input
              id="ct-room"
              value="개인생성"
              disabled
              className="h-9 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 text-sm text-gray-400"
            />
          </div>

          {error !== null && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 cursor-pointer rounded-lg border border-gray-300 px-4 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting || title.trim() === ''}
            className="h-9 cursor-pointer rounded-lg bg-purple-500 px-4 text-sm text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? '만드는 중…' : '생성'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CalendarTaskCreateModal;
