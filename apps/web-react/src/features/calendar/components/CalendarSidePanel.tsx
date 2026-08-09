// CalendarSidePanel.tsx
// renderCalSide() 대체 — 선택한 날짜의 태스크 카드 목록 + 인라인 수정 폼

import { useEffect, useState } from 'react'
import type { CalendarTask } from '../types'

interface CalendarSidePanelProps {
  selectedLabel: string
  tasks: CalendarTask[]
  editingTaskId: string | null
  onStartEdit: (id: string) => void
  onCancelEdit: () => void
  onSave: (task: CalendarTask) => void
  onDelete: (id: string) => void
}

function CalendarSidePanel({
  selectedLabel,
  tasks,
  editingTaskId,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: CalendarSidePanelProps) {
  return (
    <div className="w-65 border-l border-gray-100 p-3.5 overflow-y-auto flex flex-col gap-2 bg-white">
      <div className="text-sm font-semibold text-gray-900">{selectedLabel}</div>

      {tasks.length === 0 && (
        <div className="text-center py-6 text-gray-400 text-sm">등록된 태스크가 없어요</div>
      )}

      {tasks.map((task) =>
        editingTaskId === task.id ? (
          <CalendarEditForm
            key={task.id}
            task={task}
            onCancel={onCancelEdit}
            onSave={onSave}
            onDelete={onDelete}
          />
        ) : (
          <button
            key={task.id}
            onClick={() => onStartEdit(task.id)}
            className="text-left bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 cursor-pointer"
          >
            <div className="flex items-center gap-2 px-2.5 py-2 border-b border-gray-200">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: task.color }} />
              <span className="text-sm text-gray-900 flex-1">{task.title}</span>
              <span className="text-xs text-gray-400">✎</span>
            </div>
            <div className="flex flex-col gap-1 px-2.5 py-2 text-xs text-gray-500">
              <span>시작 {task.start}</span>
              <span>마감 {task.end}</span>
              <span>{task.room}</span>
            </div>
          </button>
        )
      )}
    </div>
  )
}

interface CalendarEditFormProps {
  task: CalendarTask
  onCancel: () => void
  onSave: (task: CalendarTask) => void
  onDelete: (id: string) => void
}

function CalendarEditForm({ task, onCancel, onSave, onDelete }: CalendarEditFormProps) {
  const [draft, setDraft] = useState(task)

  useEffect(() => {
    setDraft(task)
  }, [task])

  return (
    <div className="bg-purple-50 rounded-lg border border-purple-200 p-2.5 flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: draft.color }} />
        <span className="text-xs font-semibold text-purple-600 flex-1">태스크 수정</span>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-gray-500">제목</label>
        <input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          className="h-7.5 px-2 rounded-md border border-gray-300 text-xs outline-none focus:border-purple-400 bg-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-gray-500">시작일</label>
          <input
            type="date"
            value={draft.start}
            onChange={(e) => setDraft({ ...draft, start: e.target.value })}
            className="h-7.5 px-2 rounded-md border border-gray-300 text-xs outline-none focus:border-purple-400 bg-white"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-gray-500">마감일</label>
          <input
            type="date"
            value={draft.end}
            onChange={(e) => setDraft({ ...draft, end: e.target.value })}
            className="h-7.5 px-2 rounded-md border border-gray-300 text-xs outline-none focus:border-purple-400 bg-white"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-gray-500">채팅방</label>
        <input
          value={draft.room}
          onChange={(e) => setDraft({ ...draft, room: e.target.value })}
          className="h-7.5 px-2 rounded-md border border-gray-300 text-xs outline-none focus:border-purple-400 bg-white"
        />
      </div>

      <div className="flex gap-1.5 mt-0.5">
        <button
          onClick={() => onSave(draft)}
          className="h-7 px-2.5 rounded-md bg-purple-500 text-white text-xs cursor-pointer hover:bg-purple-600"
        >
          저장
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="h-7 px-2.5 rounded-md bg-red-50 text-red-600 border border-red-200 text-xs cursor-pointer"
        >
          삭제
        </button>
        <button
          onClick={onCancel}
          className="h-7 px-2.5 rounded-md border border-gray-300 text-gray-500 text-xs cursor-pointer"
        >
          취소
        </button>
      </div>
    </div>
  )
}

export default CalendarSidePanel
