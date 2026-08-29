'use client';

// CalendarGrid.tsx
// buildCal() 대체 — 월 네비게이션 + 날짜 그리드 + 태스크 띠
import type { CalendarTask } from '../types';

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed
  monthLabel: string;
  tasks: CalendarTask[];
  selectedDay?: number;
  todayDay?: number;
  onSelectDay: (day: number) => void;
  onChangeMonth: (delta: number) => void;
}

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

interface TaskBar {
  task: CalendarTask;
  isRealStart: boolean;
  roundedClass: string;
  showLabel: boolean;
}

function getTaskBars(
  tasks: CalendarTask[],
  dateStr: string,
  isFirstOfRow: boolean,
  isLastOfRow: boolean,
): TaskBar[] {
  return tasks
    .filter((t) => t.start <= dateStr && t.end >= dateStr)
    .map((t) => {
      const isRealStart = t.start === dateStr;
      const isRealEnd = t.end === dateStr;

      let roundedClass: string;

      if (isRealStart && isRealEnd) {
        roundedClass = 'rounded-lg ml-1 mr-1';
      } else if (isRealStart) {
        roundedClass = 'rounded-l-lg ml-1';
      } else if (isRealEnd) {
        roundedClass = 'rounded-r-lg mr-1';
      } else if (isFirstOfRow) {
        roundedClass = 'rounded-l-lg ml-1';
      } else if (isLastOfRow) {
        roundedClass = 'rounded-r-lg mr-1';
      } else {
        roundedClass = '';
      }

      return { task: t, isRealStart, roundedClass, showLabel: isRealStart || isFirstOfRow };
    });
}

function CalendarGrid({
  year,
  month,
  monthLabel,
  tasks,
  selectedDay,
  todayDay,
  onSelectDay,
  onChangeMonth,
}: CalendarGridProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDayOfWeek }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="mb-3.5 flex items-center gap-2">
        <span className="flex-1 text-lg font-semibold text-gray-900">{monthLabel}</span>
        <button
          onClick={() => {
            onChangeMonth(-1);
          }}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50"
        >
          ‹
        </button>
        <button
          onClick={() => {
            onChangeMonth(1);
          }}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7">
        {DOW_LABELS.map((dow) => (
          <div
            key={dow}
            className="py-1 text-center text-xs font-semibold text-gray-400"
          >
            {dow}
          </div>
        ))}

        {cells.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="border border-gray-100 bg-white"
              />
            );
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayOfWeek = (firstDayOfWeek + day - 1) % 7;
          const isFirstOfRow = dayOfWeek === 0;
          const isLastOfRow = dayOfWeek === 6 || day === daysInMonth;
          const isToday = day === todayDay;
          const isSelected = day === selectedDay;
          const bars = getTaskBars(tasks, dateStr, isFirstOfRow, isLastOfRow);

          return (
            <div
              key={day}
              onClick={() => {
                onSelectDay(day);
              }}
              className={`min-h-20 cursor-pointer border border-gray-100 bg-white py-1 hover:bg-gray-50 ${isSelected ? 'bg-purple-50' : ''} `}
            >
              <div
                className={`mb-1 pl-1.5 text-xs ${isToday ? 'font-bold text-purple-600' : 'text-gray-700'}`}
              >
                {day}
              </div>
              {bars.map(({ task, roundedClass, showLabel }) => (
                <div
                  key={task.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDay(day);
                  }}
                  title={task.title}
                  style={{ backgroundColor: task.color }}
                  className={`mb-0.5 flex h-4 cursor-pointer items-center overflow-hidden px-1 text-[9px] whitespace-nowrap text-white ${roundedClass}`}
                >
                  {showLabel ? task.title : ''}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarGrid;
