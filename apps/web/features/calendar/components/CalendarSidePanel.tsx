'use client';

// CalendarSidePanel.tsx
// renderCalSide() 대체 — 선택한 날짜의 태스크 카드 목록 + 인라인 수정 폼
import { useEffect, useState } from 'react';

import type { CalendarTask, CalendarTaskStatusValue } from '../types';

const STATUS_LABEL: Record<CalendarTaskStatusValue, string> = {
  1: '예정',
  2: '진행중',
  3: '완료',
};

interface CalendarSidePanelProps {
  selectedLabel: string;
  tasks: CalendarTask[];
  editingTaskId: string | null;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSave: (task: CalendarTask) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onToggleComplete: (id: string, completed: boolean) => void | Promise<void>;
}

function CalendarSidePanel({
  selectedLabel,
  tasks,
  editingTaskId,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onToggleComplete,
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
          <div
            key={task.id}
            className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
          >
            <div className="flex items-center gap-2 border-b border-gray-200 px-2.5 py-2">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={(e) => {
                  void onToggleComplete(task.id, e.target.checked);
                }}
                aria-label="완료 표시"
                className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-purple-500"
              />
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: task.color }}
              />
              <span
                className={`flex-1 text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}
              >
                {task.title}
              </span>
              <button
                type="button"
                onClick={() => {
                  onStartEdit(task.id);
                }}
                aria-label="수정"
                className="cursor-pointer text-xs text-gray-400 hover:text-gray-600"
              >
                ✎
              </button>
            </div>
            <div className="flex flex-col gap-1 px-2.5 py-2 text-xs text-gray-500">
              <span>시작 {task.start}</span>
              <span>마감 {task.end}</span>
              <span className="text-gray-400">
                {task.room} · {STATUS_LABEL[task.status]}
              </span>
            </div>
          </div>
        ),
      )}
    </div>
  );
}

interface CalendarEditFormProps {
  task: CalendarTask;
  onCancel: () => void;
  onSave: (task: CalendarTask) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

function CalendarEditForm({ task, onCancel, onSave, onDelete }: CalendarEditFormProps) {
  const [draft, setDraft] = useState(task);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraft(task);
  }, [task]);

  async function run(action: () => void | Promise<void>): Promise<void> {
    setBusy(true);

    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-purple-200 bg-purple-50 p-2.5">
      <div className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: draft.color }}
        />
        <span className="flex-1 text-xs font-semibold text-purple-600">태스크 수정</span>
        <button
          type="button"
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
          onChange={(e) => {
            setDraft({ ...draft, title: e.target.value });
          }}
          className="h-7.5 rounded-md border border-gray-300 bg-white px-2 text-xs outline-none focus:border-purple-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-gray-500">시작일</label>
          <input
            type="date"
            value={draft.start}
            onChange={(e) => {
              setDraft({ ...draft, start: e.target.value });
            }}
            className="h-7.5 rounded-md border border-gray-300 bg-white px-2 text-xs outline-none focus:border-purple-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-gray-500">마감일</label>
          <input
            type="date"
            value={draft.end}
            onChange={(e) => {
              setDraft({ ...draft, end: e.target.value });
            }}
            className="h-7.5 rounded-md border border-gray-300 bg-white px-2 text-xs outline-none focus:border-purple-400"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-gray-500">채팅방</label>
        <input
          value={draft.room}
          readOnly
          className="h-7.5 cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-2 text-xs text-gray-400"
        />
      </div>

      <div className="mt-0.5 flex gap-1.5">
        <button
          type="button"
          disabled={busy || draft.title.trim() === '' || draft.end < draft.start}
          onClick={() => {
            void run(async () => {
              await onSave(draft);
            });
          }}
          className="h-7 cursor-pointer rounded-md bg-purple-500 px-2.5 text-xs text-white hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          저장
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void run(async () => {
              await onDelete(task.id);
            });
          }}
          className="h-7 cursor-pointer rounded-md border border-red-200 bg-red-50 px-2.5 text-xs text-red-600 disabled:opacity-50"
        >
          삭제
        </button>
        <button
          type="button"
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
