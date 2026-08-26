'use client';

// CalendarSidePanel.tsx
// renderCalSide() 대체 — 선택한 날짜의 태스크 카드 목록 + 인라인 수정 폼
import { useEffect, useState } from 'react';

import type { CalendarTask } from '../types';

interface CalendarSidePanelProps {
  selectedLabel: string;
  tasks: CalendarTask[];
  editingTaskId: string | null;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSave: (task: CalendarTask) => void;
  onDelete: (id: string) => void;
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
    <div className="flex w-65 flex-col gap-2 overflow-y-auto border-l border-gray-100 bg-white p-3.5">
      <div className="text-sm font-semibold text-gray-900">{selectedLabel}</div>

      {tasks.length === 0 && (
        <div className="py-6 text-center text-sm text-gray-400">등록된 태스크가 없어요</div>
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
            className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-left hover:border-gray-300"
          >
            <div className="flex items-center gap-2 border-b border-gray-200 px-2.5 py-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: task.color }}
              />
              <span className="flex-1 text-sm text-gray-900">{task.title}</span>
              <span className="text-xs text-gray-400">✎</span>
            </div>
            <div className="flex flex-col gap-1 px-2.5 py-2 text-xs text-gray-500">
              <span>시작 {task.start}</span>
              <span>마감 {task.end}</span>
              <span>{task.room}</span>
            </div>
          </button>
        ),
      )}
    </div>
  );
}

interface CalendarEditFormProps {
  task: CalendarTask;
  onCancel: () => void;
  onSave: (task: CalendarTask) => void;
  onDelete: (id: string) => void;
}

function CalendarEditForm({ task, onCancel, onSave, onDelete }: CalendarEditFormProps) {
  const [draft, setDraft] = useState(task);

  useEffect(() => {
    setDraft(task);
  }, [task]);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-purple-200 bg-purple-50 p-2.5">
      <div className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: draft.color }}
        />
        <span className="flex-1 text-xs font-semibold text-purple-600">태스크 수정</span>
        <button
          onClick={onCancel}
          className="cursor-pointer text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-gray-500">제목</label>
        <input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          className="h-7.5 rounded-md border border-gray-300 bg-white px-2 text-xs outline-none focus:border-purple-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-gray-500">시작일</label>
          <input
            type="date"
            value={draft.start}
            onChange={(e) => setDraft({ ...draft, start: e.target.value })}
            className="h-7.5 rounded-md border border-gray-300 bg-white px-2 text-xs outline-none focus:border-purple-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-gray-500">마감일</label>
          <input
            type="date"
            value={draft.end}
            onChange={(e) => setDraft({ ...draft, end: e.target.value })}
            className="h-7.5 rounded-md border border-gray-300 bg-white px-2 text-xs outline-none focus:border-purple-400"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-gray-500">채팅방</label>
        <input
          value={draft.room}
          onChange={(e) => setDraft({ ...draft, room: e.target.value })}
          className="h-7.5 rounded-md border border-gray-300 bg-white px-2 text-xs outline-none focus:border-purple-400"
        />
      </div>

      <div className="mt-0.5 flex gap-1.5">
        <button
          onClick={() => onSave(draft)}
          className="h-7 cursor-pointer rounded-md bg-purple-500 px-2.5 text-xs text-white hover:bg-purple-600"
        >
          저장
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="h-7 cursor-pointer rounded-md border border-red-200 bg-red-50 px-2.5 text-xs text-red-600"
        >
          삭제
        </button>
        <button
          onClick={onCancel}
          className="h-7 cursor-pointer rounded-md border border-gray-300 px-2.5 text-xs text-gray-500"
        >
          취소
        </button>
      </div>
    </div>
  );
}

export default CalendarSidePanel;
