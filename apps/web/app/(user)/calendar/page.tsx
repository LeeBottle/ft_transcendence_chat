'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createTask,
  deleteTask,
  fetchTasks,
  setTaskCompletion,
  updateTask,
} from '@/features/calendar/calendarApi';
import CalendarGrid from '@/features/calendar/components/CalendarGrid';
import CalendarSidePanel from '@/features/calendar/components/CalendarSidePanel';
import CalendarTaskCreateModal, {
  type NewCalendarTaskInput,
} from '@/features/calendar/components/CalendarTaskCreateModal';
import type { CalendarTask } from '@/features/calendar/types';

type LoadStatus = 'loading' | 'idle' | 'error';

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// 그 달의 앞뒤 여백까지 포함한 조회 범위 (그리드가 6주치를 그리므로)
function monthQueryRange(year: number, month: number): { from: string; to: string } {
  const from = new Date(year, month, 1);

  from.setDate(from.getDate() - 7);

  const to = new Date(year, month + 1, 0);

  to.setDate(to.getDate() + 7);

  return {
    from: toDateString(from.getFullYear(), from.getMonth(), from.getDate()),
    to: toDateString(to.getFullYear(), to.getMonth(), to.getDate()),
  };
}

export default function CalendarPage() {
  const today = useMemo(() => new Date(), []);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const selectedDate = toDateString(year, month, selectedDay);

  const load = useCallback(async (y: number, m: number) => {
    setStatus('loading');

    try {
      const { from, to } = monthQueryRange(y, m);

      setTasks(await fetchTasks({ from, to }));
      setStatus('idle');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load(year, month);
  }, [year, month, load]);

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const tasksOnSelectedDay = useMemo(
    () => tasks.filter((task) => task.start <= selectedDate && task.end >= selectedDate),
    [tasks, selectedDate],
  );

  function handleChangeMonth(delta: number) {
    const next = new Date(year, month + delta, 1);

    setYear(next.getFullYear());
    setMonth(next.getMonth());
    setEditingTaskId(null);
  }

  function upsertTask(updated: CalendarTask) {
    setTasks((prev) => {
      const exists = prev.some((task) => task.id === updated.id);

      return exists
        ? prev.map((task) => (task.id === updated.id ? updated : task))
        : [...prev, updated];
    });
  }

  async function handleCreateTask(input: NewCalendarTaskInput): Promise<void> {
    const created = await createTask(input);

    upsertTask(created);
    setCreateModalOpen(false);
    setActionError(null);
  }

  async function handleSaveTask(draft: CalendarTask) {
    const original = tasks.find((task) => task.id === draft.id);
    const patch: { title?: string; start?: string; end?: string } = {};

    if (draft.title.trim() !== original?.title) {
      patch.title = draft.title.trim();
    }
    if (draft.start !== original?.start) {
      patch.start = draft.start;
    }
    if (draft.end !== original?.end) {
      patch.end = draft.end;
    }

    setActionError(null);

    try {
      if (Object.keys(patch).length > 0) {
        upsertTask(await updateTask(draft.id, patch));
      }

      setEditingTaskId(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '태스크를 수정하지 못했어요.');
    }
  }

  async function handleDeleteTask(id: string) {
    setActionError(null);

    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((task) => task.id !== id));
      setEditingTaskId(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '태스크를 삭제하지 못했어요.');
    }
  }

  async function handleToggleComplete(id: string, completed: boolean) {
    setActionError(null);

    try {
      upsertTask(await setTaskCompletion(id, completed));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '완료 상태를 바꾸지 못했어요.');
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-end gap-3 border-b border-gray-100 px-4">
        {status === 'loading' && <span className="text-xs text-gray-400">불러오는 중…</span>}
        {status === 'error' && (
          <button
            onClick={() => {
              void load(year, month);
            }}
            className="text-xs text-red-500 underline"
          >
            불러오기 실패 · 다시 시도
          </button>
        )}
        {actionError !== null && <span className="text-xs text-red-500">{actionError}</span>}
        <button
          onClick={() => {
            setCreateModalOpen(true);
          }}
          className="h-8 cursor-pointer rounded-lg bg-purple-500 px-3.5 text-sm font-medium text-white hover:bg-purple-600"
        >
          + 새 태스크
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <CalendarGrid
          year={year}
          month={month}
          monthLabel={`${year}년 ${month + 1}월`}
          tasks={tasks}
          selectedDay={selectedDay}
          todayDay={isCurrentMonth ? today.getDate() : undefined}
          onSelectDay={setSelectedDay}
          onChangeMonth={handleChangeMonth}
        />
        <CalendarSidePanel
          selectedLabel={`${month + 1}월 ${selectedDay}일`}
          tasks={tasksOnSelectedDay}
          editingTaskId={editingTaskId}
          onStartEdit={setEditingTaskId}
          onCancelEdit={() => {
            setEditingTaskId(null);
          }}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onToggleComplete={handleToggleComplete}
        />
      </div>

      <CalendarTaskCreateModal
        open={createModalOpen}
        defaultDate={selectedDate}
        onCancel={() => {
          setCreateModalOpen(false);
        }}
        onSubmit={handleCreateTask}
      />
    </div>
  );
}
