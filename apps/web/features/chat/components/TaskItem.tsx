'use client';

// TaskItem.tsx (.t-item)
import type { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onToggleChecked?: (id: string) => void;
  onToggleDone: (id: string) => void;
  onDateChange?: (id: string, field: 'start' | 'end', value: string) => void;
}

function TaskItem({ task, onToggleChecked, onToggleDone, onDateChange }: TaskItemProps) {
  const { id, name, start, end, done, isAi, checked = false, existing = false } = task;

  // 캘린더 미연동 태스크인데 날짜가 비어 있으면 "필수" 표시
  const startMissing = !existing && (start === null || start === '');
  const endMissing = !existing && (end === null || end === '');

  return (
    <div className="relative mb-1.5 overflow-hidden rounded-lg border border-gray-200 bg-white">
      {isAi && (
        <span className="absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-[9px] font-bold text-purple-500">
          AI
        </span>
      )}

      <div className="flex items-center gap-2 px-2.5 pt-2 pb-1.5">
        {existing ? (
          <span
            title="이미 캘린더에 연동됨"
            className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded bg-purple-500 text-[10px] text-white"
          >
            ✓
          </span>
        ) : (
          <button
            onClick={() => onToggleChecked?.(id)}
            title="체크하면 캘린더에 삽입돼요"
            className={`flex h-4.5 w-4.5 shrink-0 cursor-pointer items-center justify-center rounded border text-[10px] text-white ${checked ? 'border-purple-500 bg-purple-500' : 'border-gray-300'} `}
          >
            {checked ? '✓' : ''}
          </button>
        )}
        <span
          className={`flex-1 text-[13px] leading-snug ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}
        >
          {name}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 px-2.5 pb-2">
        <div className="flex flex-col gap-0.5">
          <label className="flex items-center gap-1 text-[10px] font-medium text-gray-400 uppercase">
            시작일
            {startMissing && (
              <span className="rounded bg-red-50 px-1 text-[9px] text-red-600">필수</span>
            )}
          </label>
          <input
            type="date"
            value={start ?? ''}
            disabled={existing}
            onChange={(e) => onDateChange?.(id, 'start', e.target.value)}
            className={`h-7 w-full rounded-md border px-1.5 text-[11px] outline-none ${existing ? 'bg-gray-50 text-gray-400' : 'bg-white'} ${startMissing ? 'border-red-300 bg-red-50' : 'border-gray-300'} `}
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="flex items-center gap-1 text-[10px] font-medium text-gray-400 uppercase">
            마감일
            {endMissing && (
              <span className="rounded bg-red-50 px-1 text-[9px] text-red-600">필수</span>
            )}
          </label>
          <input
            type="date"
            value={end ?? ''}
            disabled={existing}
            onChange={(e) => onDateChange?.(id, 'end', e.target.value)}
            className={`h-7 w-full rounded-md border px-1.5 text-[11px] outline-none ${existing ? 'bg-gray-50 text-gray-400' : 'bg-white'} ${endMissing ? 'border-red-300 bg-red-50' : 'border-gray-300'} `}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 px-2.5 pb-2">
        <span className="text-[11px] text-gray-500">완료</span>
        <button
          onClick={() => {
            onToggleDone(id);
          }}
          className={`flex h-4.5 w-4.5 cursor-pointer items-center justify-center rounded border text-[10px] text-white ${done ? 'border-purple-500 bg-purple-500' : 'border-gray-300'} `}
        >
          {done ? '✓' : ''}
        </button>
      </div>
    </div>
  );
}

export default TaskItem;
