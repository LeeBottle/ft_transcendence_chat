'use client';
// CalendarGrid.tsx
// buildCal() 대체 — 월 네비게이션 + 날짜 그리드 + 태스크 띠

import type { CalendarTask } from '../types'

interface CalendarGridProps {
  year: number
  month: number // 0-indexed
  monthLabel: string
  tasks: CalendarTask[]
  selectedDay?: number
  todayDay?: number
  onSelectDay: (day: number) => void
  onChangeMonth: (delta: number) => void
}

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토']

interface TaskBar {
  task: CalendarTask
  isRealStart: boolean
  roundedClass: string
  showLabel: boolean
}

function getTaskBars(tasks: CalendarTask[], dateStr: string, isFirstOfRow: boolean, isLastOfRow: boolean): TaskBar[] {
  return tasks
    .filter((t) => t.start <= dateStr && t.end >= dateStr)
    .map((t) => {
      const isRealStart = t.start === dateStr
      const isRealEnd = t.end === dateStr

      let roundedClass: string
      if (isRealStart && isRealEnd) roundedClass = 'rounded-lg ml-1 mr-1'
      else if (isRealStart) roundedClass = 'rounded-l-lg ml-1'
      else if (isRealEnd) roundedClass = 'rounded-r-lg mr-1'
      else if (isFirstOfRow) roundedClass = 'rounded-l-lg ml-1'
      else if (isLastOfRow) roundedClass = 'rounded-r-lg mr-1'
      else roundedClass = ''

      return { task: t, isRealStart, roundedClass, showLabel: isRealStart || isFirstOfRow }
    })
}

function CalendarGrid({ year, month, monthLabel, tasks, selectedDay, todayDay, onSelectDay, onChangeMonth }: CalendarGridProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDayOfWeek }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="flex-1 p-5 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3.5">
        <span className="text-lg font-semibold text-gray-900 flex-1">{monthLabel}</span>
        <button
          onClick={() => onChangeMonth(-1)}
          className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50"
        >
          ‹
        </button>
        <button
          onClick={() => onChangeMonth(1)}
          className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7">
        {DOW_LABELS.map((dow) => (
          <div key={dow} className="text-center text-xs font-semibold text-gray-400 py-1">
            {dow}
          </div>
        ))}

        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="bg-white border border-gray-100" />

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayOfWeek = (firstDayOfWeek + day - 1) % 7
          const isFirstOfRow = dayOfWeek === 0
          const isLastOfRow = dayOfWeek === 6 || day === daysInMonth
          const isToday = day === todayDay
          const isSelected = day === selectedDay
          const bars = getTaskBars(tasks, dateStr, isFirstOfRow, isLastOfRow)

          return (
            <div
              key={day}
              onClick={() => onSelectDay(day)}
              className={`
                min-h-20 py-1 border border-gray-100 cursor-pointer bg-white hover:bg-gray-50
                ${isSelected ? 'bg-purple-50' : ''}
              `}
            >
              <div className={`text-xs pl-1.5 mb-1 ${isToday ? 'text-purple-600 font-bold' : 'text-gray-700'}`}>
                {day}
              </div>
              {bars.map(({ task, roundedClass, showLabel }) => (
                <div
                  key={task.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectDay(day)
                  }}
                  title={task.title}
                  style={{ backgroundColor: task.color }}
                  className={`h-4 mb-0.5 px-1 text-[9px] text-white flex items-center overflow-hidden whitespace-nowrap cursor-pointer ${roundedClass}`}
                >
                  {showLabel ? task.title : ''}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarGrid
