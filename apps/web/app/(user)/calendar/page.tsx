'use client';

import { useMemo, useState } from 'react';

import CalendarGrid from '@/features/calendar/components/CalendarGrid';
import CalendarSidePanel from '@/features/calendar/components/CalendarSidePanel';
import type { CalendarTask } from '@/features/calendar/types';

const INITIAL_TASKS: CalendarTask[] = [
  { id: 'ct1', title: '스프린트 리뷰 슬라이드', start: '2025-06-16', end: '2025-06-16', room: '디자인 팀', color: '#6C63FF' },
  { id: 'ct2', title: '피그마 최종본 공유', start: '2025-06-15', end: '2025-06-16', room: '디자인 팀', color: '#0F6E56' },
  { id: 'ct3', title: 'API 문서 업데이트', start: '2025-06-17', end: '2025-06-19', room: '개발팀', color: '#BA7517' },
];

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5); // 0-indexed, 5 = 6월
  const [selectedDay, setSelectedDay] = useState(16);
  const [tasks, setTasks] = useState<CalendarTask[]>(INITIAL_TASKS);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const selectedDate = toDateString(year, month, selectedDay);
  const tasksOnSelectedDay = useMemo(
    () => tasks.filter((task) => task.start <= selectedDate && task.end >= selectedDate),
    [tasks, selectedDate],
  );

  function handleChangeMonth(delta: number) {
    const next = new Date(year, month + delta, 1);

    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  // TODO(API): 저장 시 백엔드에 PATCH/POST 요청 필요 - 지금은 로컬 상태만 갱신하는 뼈대
  function handleSaveTask(updated: CalendarTask) {
    // SUCCESS: 목록에서 해당 id를 교체
    setTasks((prev) => prev.map((task) => (task.id === updated.id ? updated : task)));
    setEditingTaskId(null);
    // FAIL: 실패 시 setTasks를 롤백하고 에러 토스트를 띄워야 함 (백엔드 연동 시 추가)
  }

  // TODO(API): 삭제 시 백엔드에 DELETE 요청 필요 - 지금은 로컬 상태만 갱신하는 뼈대
  function handleDeleteTask(id: string) {
    // SUCCESS: 목록에서 제거
    setTasks((prev) => prev.filter((task) => task.id !== id));
    setEditingTaskId(null);
    // FAIL: 실패 시 목록을 그대로 유지하고 에러 토스트를 띄워야 함 (백엔드 연동 시 추가)
  }

  return (
    <div className="h-full flex">
      <CalendarGrid
        year={year}
        month={month}
        monthLabel={`${year}년 ${month + 1}월`}
        tasks={tasks}
        selectedDay={selectedDay}
        todayDay={16}
        onSelectDay={setSelectedDay}
        onChangeMonth={handleChangeMonth}
      />
      <CalendarSidePanel
        selectedLabel={`${month + 1}월 ${selectedDay}일`}
        tasks={tasksOnSelectedDay}
        editingTaskId={editingTaskId}
        onStartEdit={setEditingTaskId}
        onCancelEdit={() => { setEditingTaskId(null); }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
