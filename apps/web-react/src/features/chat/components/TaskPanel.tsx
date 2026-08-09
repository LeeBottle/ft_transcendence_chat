// TaskPanel.tsx (.task-panel)

import type { ReactNode } from 'react'
import TaskItem from './TaskItem'
import type { Task } from '../types'

export type ExtractStatus = 'idle' | 'loading' | 'done'

export interface SummarySection {
  label: string
  items: string[]
}

interface TaskPanelProps {
  open: boolean
  activeTab: 'task' | 'summary'
  onTabChange: (tab: 'task' | 'summary') => void

  taskStatus: ExtractStatus
  tasks: Task[]
  onExtractTasks: () => void
  onToggleChecked: (id: string) => void
  onToggleDone: (id: string) => void
  onDateChange: (id: string, field: 'start' | 'end', value: string) => void
  canSync: boolean
  onSync: () => void

  summaryStatus: ExtractStatus
  summarySections: SummarySection[]
  onExtractSummary: () => void
}

function TaskPanel({
  open,
  activeTab,
  onTabChange,
  taskStatus,
  tasks,
  onExtractTasks,
  onToggleChecked,
  onToggleDone,
  onDateChange,
  canSync,
  onSync,
  summaryStatus,
  summarySections,
  onExtractSummary,
}: TaskPanelProps) {
  if (!open) return null

  return (
    <div className="w-80 border-l border-gray-100 flex flex-col shrink-0 bg-gray-50">
      <div className="h-14 border-b border-gray-100 flex items-center px-3.5 gap-2 shrink-0 bg-white">
        <span className="text-purple-500">☑</span>
        <span className="text-sm font-semibold text-gray-900 flex-1">내 태스크</span>
      </div>

      <div className="flex border-b border-gray-100 bg-white shrink-0">
        <button
          onClick={() => onTabChange('task')}
          className={`
            flex-1 h-8.5 text-xs font-medium cursor-pointer border-b-2
            ${activeTab === 'task' ? 'text-purple-600 border-purple-500' : 'text-gray-500 border-transparent'}
          `}
        >
          Task
        </button>
        <button
          onClick={() => onTabChange('summary')}
          className={`
            flex-1 h-8.5 text-xs font-medium cursor-pointer border-b-2
            ${activeTab === 'summary' ? 'text-purple-600 border-purple-500' : 'text-gray-500 border-transparent'}
          `}
        >
          채팅 요약
        </button>
      </div>

      {activeTab === 'task' && (
        <div className="flex-1 overflow-y-auto flex flex-col">
          {taskStatus === 'idle' && (
            <EmptyState
              text={<>추출 버튼을 눌러<br />AI 태스크를 가져오세요</>}
              onExtract={onExtractTasks}
              warning="개인 캘린더 연동 전 화면 이동시 추출한 태스크가 사라져요"
            />
          )}

          {taskStatus === 'loading' && <LoadingState text="AI가 회의 내용을 분석하고 있어요" sub="각 참여자의 태스크를 추출 중입니다…" />}

          {taskStatus === 'done' && (
            <>
              <div className="flex-1 p-2.5">
                {tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleChecked={onToggleChecked}
                    onToggleDone={onToggleDone}
                    onDateChange={onDateChange}
                  />
                ))}
              </div>
              <div className="p-2.5 border-t border-gray-100 bg-white shrink-0">
                <button
                  onClick={onSync}
                  disabled={!canSync}
                  className={`
                    w-full h-9.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5
                    ${canSync
                      ? 'bg-purple-500 text-white cursor-pointer hover:bg-purple-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                  `}
                >
                  📅 {canSync ? '캘린더에 연동하기' : '날짜를 모두 입력해야 연동할 수 있어요'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="flex-1 overflow-y-auto flex flex-col">
          {summaryStatus === 'idle' && (
            <EmptyState
              text={<>추출 버튼을 눌러<br />채팅 요약을 가져오세요</>}
              onExtract={onExtractSummary}
              warning="개인 캘린더 연동 전 화면 이동시 추출한 태스크가 사라져요"
            />
          )}

          {summaryStatus === 'loading' && <LoadingState text="AI가 채팅을 요약하고 있어요" sub="주요 안건과 결정 사항을 정리 중입니다…" />}

          {summaryStatus === 'done' && (
            <div className="p-3 flex flex-col gap-2.5">
              {summarySections.map((section) => (
                <div key={section.label} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-3 pt-2 pb-1 border-b border-gray-100 bg-gray-50">
                    {section.label}
                  </div>
                  {section.items.map((item, i) => (
                    <div key={i} className="px-3 py-2 text-xs text-gray-900 border-b border-gray-100 last:border-b-0">
                      {item}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({ text, onExtract, warning }: { text: ReactNode; onExtract: () => void; warning: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="text-4xl text-gray-300">✨</span>
      <p className="text-[13px] text-gray-400 leading-relaxed">{text}</p>
      <button
        onClick={onExtract}
        className="h-10.5 px-7 rounded-full bg-purple-500 text-white text-sm font-semibold flex items-center gap-1.5 cursor-pointer shadow-[0_4px_14px_rgba(108,99,255,0.35)] hover:opacity-90"
      >
        ✨ 추출
      </button>
      <p className="text-[11px] text-gray-400 flex items-center gap-1">⚠ {warning}</p>
    </div>
  )
}

function LoadingState({ text, sub }: { text: string; sub: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3.5 px-4">
      <div className="w-9 h-9 rounded-full border-[3px] border-purple-100 border-t-purple-500 animate-spin" />
      <p className="text-[13px] text-gray-600 text-center leading-relaxed">
        <strong>{text}</strong>
        <br />
        {sub}
      </p>
    </div>
  )
}

export default TaskPanel
