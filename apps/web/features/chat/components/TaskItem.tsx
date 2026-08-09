'use client';
// TaskItem.tsx (.t-item)

import type { Task } from '../types'

interface TaskItemProps {
  task: Task
  onToggleChecked?: (id: string) => void
  onToggleDone: (id: string) => void
  onDateChange?: (id: string, field: 'start' | 'end', value: string) => void
}

function TaskItem({ task, onToggleChecked, onToggleDone, onDateChange }: TaskItemProps) {
  const { id, name, start, end, done, isAi, checked, existing } = task

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 mb-1.5 overflow-hidden">
      {isAi && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-100 text-purple-500 text-[9px] font-bold flex items-center justify-center z-10">
          AI
        </span>
      )}

      <div className="flex items-center gap-2 px-2.5 pt-2 pb-1.5">
        {existing ? (
          <span
            title="이미 캘린더에 연동됨"
            className="w-4.5 h-4.5 rounded shrink-0 bg-purple-500 flex items-center justify-center text-white text-[10px]"
          >
            ✓
          </span>
        ) : (
          <button
            onClick={() => onToggleChecked?.(id)}
            title="체크하면 캘린더에 삽입돼요"
            className={`
              w-4.5 h-4.5 rounded border shrink-0 cursor-pointer flex items-center justify-center text-[10px] text-white
              ${checked ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}
            `}
          >
            {checked ? '✓' : ''}
          </button>
        )}
        <span className={`text-[13px] flex-1 leading-snug ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {name}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 px-2.5 pb-2">
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium text-gray-400 uppercase flex items-center gap-1">
            시작일
            {!start && !existing && (
              <span className="text-[9px] bg-red-50 text-red-600 px-1 rounded">필수</span>
            )}
          </label>
          <input
            type="date"
            value={start ?? ''}
            disabled={existing}
            onChange={(e) => onDateChange?.(id, 'start', e.target.value)}
            className={`
              h-7 px-1.5 rounded-md border text-[11px] outline-none w-full
              ${existing ? 'bg-gray-50 text-gray-400' : 'bg-white'}
              ${!start && !existing ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            `}
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium text-gray-400 uppercase flex items-center gap-1">
            마감일
            {!end && !existing && (
              <span className="text-[9px] bg-red-50 text-red-600 px-1 rounded">필수</span>
            )}
          </label>
          <input
            type="date"
            value={end ?? ''}
            disabled={existing}
            onChange={(e) => onDateChange?.(id, 'end', e.target.value)}
            className={`
              h-7 px-1.5 rounded-md border text-[11px] outline-none w-full
              ${existing ? 'bg-gray-50 text-gray-400' : 'bg-white'}
              ${!end && !existing ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            `}
          />
        </div>
      </div>

      <div className="flex justify-end items-center gap-1.5 px-2.5 pb-2">
        <span className="text-[11px] text-gray-500">완료</span>
        <button
          onClick={() => onToggleDone(id)}
          className={`
            w-4.5 h-4.5 rounded border cursor-pointer flex items-center justify-center text-[10px] text-white
            ${done ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}
          `}
        >
          {done ? '✓' : ''}
        </button>
      </div>
    </div>
  )
}

export default TaskItem
