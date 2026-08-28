'use client';

// TaskPanel.tsx (.task-panel)
import type { ReactNode } from 'react';

import type { Task } from '../types';
import TaskItem from './TaskItem';

export type ExtractStatus = 'idle' | 'loading' | 'done';

export interface SummarySection {
  label: string;
  items: string[];
}

interface TaskPanelProps {
  open: boolean;
  activeTab: 'task' | 'summary';
  onTabChange: (tab: 'task' | 'summary') => void;

  taskStatus: ExtractStatus;
  tasks: Task[];
  onExtractTasks: () => void;
  onToggleChecked: (id: string) => void;
  onToggleDone: (id: string) => void;
  onDateChange: (id: string, field: 'start' | 'end', value: string) => void;
  canSync: boolean;
  onSync: () => void;

  summaryStatus: ExtractStatus;
  summarySections: SummarySection[];
  onExtractSummary: () => void;
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
  if (!open) return null;

  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-gray-100 bg-gray-50">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-100 bg-white px-3.5">
        <span className="text-purple-500">☑</span>
        <span className="flex-1 text-sm font-semibold text-gray-900">내 태스크</span>
      </div>

      <div className="flex shrink-0 border-b border-gray-100 bg-white">
        <button
          onClick={() => onTabChange('task')}
          className={`h-8.5 flex-1 cursor-pointer border-b-2 text-xs font-medium ${activeTab === 'task' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'} `}
        >
          Task
        </button>
        <button
          onClick={() => onTabChange('summary')}
          className={`h-8.5 flex-1 cursor-pointer border-b-2 text-xs font-medium ${activeTab === 'summary' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'} `}
        >
          채팅 요약
        </button>
      </div>

      {activeTab === 'task' && (
        <div className="flex flex-1 flex-col overflow-y-auto">
          {taskStatus === 'idle' && (
            <EmptyState
              text={
                <>
                  추출 버튼을 눌러
                  <br />
                  AI 태스크를 가져오세요
                </>
              }
              onExtract={onExtractTasks}
              warning="개인 캘린더 연동 전 화면 이동시 추출한 태스크가 사라져요"
            />
          )}

          {taskStatus === 'loading' && (
            <LoadingState
              text="AI가 회의 내용을 분석하고 있어요"
              sub="각 참여자의 태스크를 추출 중입니다…"
            />
          )}

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
              <div className="shrink-0 border-t border-gray-100 bg-white p-2.5">
                <button
                  onClick={onSync}
                  disabled={!canSync}
                  className={`flex h-9.5 w-full items-center justify-center gap-1.5 rounded-lg text-sm font-semibold ${
                    canSync
                      ? 'cursor-pointer bg-purple-500 text-white hover:bg-purple-600'
                      : 'cursor-not-allowed bg-gray-200 text-gray-400'
                  } `}
                >
                  📅 {canSync ? '캘린더에 연동하기' : '날짜를 모두 입력해야 연동할 수 있어요'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="flex flex-1 flex-col overflow-y-auto">
          {summaryStatus === 'idle' && (
            <EmptyState
              text={
                <>
                  추출 버튼을 눌러
                  <br />
                  채팅 요약을 가져오세요
                </>
              }
              onExtract={onExtractSummary}
              warning="개인 캘린더 연동 전 화면 이동시 추출한 태스크가 사라져요"
            />
          )}

          {summaryStatus === 'loading' && (
            <LoadingState
              text="AI가 채팅을 요약하고 있어요"
              sub="주요 안건과 결정 사항을 정리 중입니다…"
            />
          )}

          {summaryStatus === 'done' && (
            <div className="flex flex-col gap-2.5 p-3">
              {summarySections.map((section) => (
                <div
                  key={section.label}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white"
                >
                  <div className="border-b border-gray-100 bg-gray-50 px-3 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
                    {section.label}
                  </div>
                  {section.items.map((item, i) => (
                    <div
                      key={i}
                      className="border-b border-gray-100 px-3 py-2 text-xs text-gray-900 last:border-b-0"
                    >
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
  );
}

function EmptyState({
  text,
  onExtract,
  warning,
}: {
  text: ReactNode;
  onExtract: () => void;
  warning: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="text-4xl text-gray-300">✨</span>
      <p className="text-[13px] leading-relaxed text-gray-400">{text}</p>
      <button
        onClick={onExtract}
        className="flex h-10.5 cursor-pointer items-center gap-1.5 rounded-full bg-purple-500 px-7 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(108,99,255,0.35)] hover:opacity-90"
      >
        ✨ 추출
      </button>
      <p className="flex items-center gap-1 text-[11px] text-gray-400">⚠ {warning}</p>
    </div>
  );
}

function LoadingState({ text, sub }: { text: string; sub: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3.5 px-4">
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-purple-100 border-t-purple-500" />
      <p className="text-center text-[13px] leading-relaxed text-gray-600">
        <strong>{text}</strong>
        <br />
        {sub}
      </p>
    </div>
  );
}

export default TaskPanel;
