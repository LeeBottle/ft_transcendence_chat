'use client';

import { useState } from 'react';

import ChatHeader from '@/features/chat/components/ChatHeader';
import InputBar from '@/features/chat/components/InputBar';
import MessageList from '@/features/chat/components/MessageList';
import TaskPanel, { type ExtractStatus, type SummarySection } from '@/features/chat/components/TaskPanel';
import type { Message, Task } from '@/features/chat/types';
import { useRoomContext } from '@/features/room/RoomContext';

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    dateLabel: '2025년 6월 16일',
    authorName: '김지수',
    content: '안녕하세요! 오늘 스프린트 리뷰 준비 됐나요?',
    time: '오전 10:02',
    isMe: false,
    avatarLabel: '김',
    avatarColorClass: 'bg-indigo-100 text-indigo-600',
  },
  { id: '2', authorName: '나 (방장)', content: '네! 슬라이드 거의 완성했어요 👍', time: '오전 10:05', isMe: true },
  {
    id: '3',
    authorName: '박민준',
    content: '내일까지 API 문서 업데이트 꼭 해야 해요!',
    time: '오전 10:10',
    isMe: false,
    avatarLabel: '박',
    avatarColorClass: 'bg-teal-100 text-teal-600',
  },
];

// TODO(API): AI 추출은 실제로는 채팅 로그를 백엔드/LLM에 보내 태스크·요약을 받아와야 함 - 지금은 mock
async function mockExtractTasks(): Promise<Task[]> {
  return await new Promise((resolve) => {
    setTimeout(() => {
      // SUCCESS: 항상 성공하는 mock (백엔드 연동 시 실패 케이스도 reject로 추가)
      resolve([
        { id: 'e1', name: '피그마 최종본 팀 공유', start: '2025-06-15', end: '2025-06-16', done: true, isAi: false, existing: true },
        { id: 'ai1', name: '스프린트 리뷰 발표자료 최종 점검', start: null, end: null, done: false, isAi: true, checked: false },
        { id: 'ai2', name: '디자인 시안 내부 리뷰 요청', start: '2025-06-17', end: '2025-06-18', done: false, isAi: true, checked: true },
      ]);
    }, 1200);
  });
}

async function mockExtractSummary(): Promise<SummarySection[]> {
  return await new Promise((resolve) => {
    setTimeout(() => {
      // SUCCESS: 항상 성공하는 mock
      resolve([
        { label: '📋 회의 주요 안건', items: ['스프린트 리뷰 준비 현황 공유', '피그마 최종본 공유 일정 확인'] },
        { label: '✅ 결정 사항', items: ['피그마 최종본 → 오늘(6/16) 오후 4시까지 팀 공유'] },
      ]);
    }, 1200);
  });
}

export default function ChatPage() {
  const { rooms, activeRoomId } = useRoomContext();
  const activeRoom = rooms.find((room) => room.id === activeRoomId) ?? rooms[0];

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [messageInput, setMessageInput] = useState('');
  const [taskPanelOpen, setTaskPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'task' | 'summary'>('task');
  const [meetingEnded, setMeetingEnded] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStatus, setTaskStatus] = useState<ExtractStatus>('idle');
  const [summarySections, setSummarySections] = useState<SummarySection[]>([]);
  const [summaryStatus, setSummaryStatus] = useState<ExtractStatus>('idle');

  // TODO(API): 실제로는 백엔드/WebSocket으로 메시지 전송 필요 - 지금은 로컬 상태에만 추가
  function handleSend() {
    if (messageInput.trim() === '') {
      return;
    }

    // SUCCESS: 로컬 목록에 즉시 반영 (optimistic update)
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), authorName: '나 (방장)', content: messageInput, time: '지금', isMe: true },
    ]);
    setMessageInput('');
    // FAIL: 전송 실패 시 방금 추가한 메시지를 롤백하고 에러 표시 필요 (백엔드 연동 시 추가)
  }

  async function handleExtractTasks() {
    setTaskStatus('loading');
    try {
      const result = await mockExtractTasks();

      // SUCCESS: 추출된 태스크로 상태 교체
      setTasks(result);
      setTaskStatus('done');
    } catch {
      // FAIL: 추출 실패 - idle로 되돌리고 에러 토스트 필요 (백엔드 연동 시 추가)
      setTaskStatus('idle');
    }
  }

  async function handleExtractSummary() {
    setSummaryStatus('loading');
    try {
      const result = await mockExtractSummary();

      // SUCCESS: 추출된 요약으로 상태 교체
      setSummarySections(result);
      setSummaryStatus('done');
    } catch {
      // FAIL: 추출 실패 - idle로 되돌리고 에러 토스트 필요 (백엔드 연동 시 추가)
      setSummaryStatus('idle');
    }
  }

  function handleToggleChecked(id: string) {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, checked: !(task.checked ?? false) } : task)),
    );
  }

  function handleToggleDone(id: string) {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  function handleDateChange(id: string, field: 'start' | 'end', value: string) {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, [field]: value } : task)));
  }

  // TODO(API): 체크된 태스크를 실제 캘린더(백엔드)에 반영 필요 - 지금은 mock
  function handleSync() {
    // SUCCESS: 동기화 완료 처리 (지금은 콘솔 로그로 대체)
    console.warn(
      'sync to calendar',
      tasks.filter((task) => task.checked === true),
    );
    // FAIL: 동기화 실패 시 에러 토스트 필요 (백엔드 연동 시 추가)
  }

  const canSync = tasks.some((task) => task.isAi && task.checked === true);

  if (!activeRoom) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-400">
        아직 채팅방이 없어요. 사이드바에서 새 채팅방을 만들어보세요.
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          avatarLabel={activeRoom.avatarLabel}
          avatarColorClass="bg-indigo-100 text-indigo-600"
          roomName={activeRoom.name}
          subtitle="김지수, 박민준, 이수아 · 3명"
          taskPanelOpen={taskPanelOpen}
          onToggleTaskPanel={() => {
            setTaskPanelOpen((prev) => !prev);
          }}
          meetingEnded={meetingEnded}
          onEndMeeting={() => {
            setMeetingEnded(true);
          }}
        />
        <MessageList messages={messages} meetingEnded={meetingEnded} />
        <InputBar value={messageInput} onChange={setMessageInput} onSend={handleSend} />
      </div>

      <TaskPanel
        open={taskPanelOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        taskStatus={taskStatus}
        tasks={tasks}
        onExtractTasks={() => {
          void handleExtractTasks();
        }}
        onToggleChecked={handleToggleChecked}
        onToggleDone={handleToggleDone}
        onDateChange={handleDateChange}
        canSync={canSync}
        onSync={handleSync}
        summaryStatus={summaryStatus}
        summarySections={summarySections}
        onExtractSummary={() => {
          void handleExtractSummary();
        }}
      />
    </div>
  );
}
