'use client';

import { useState } from 'react';

import ChatHeader from '@/features/chat/components/ChatHeader';
import InputBar from '@/features/chat/components/InputBar';
import MessageList from '@/features/chat/components/MessageList';
import TaskPanel, {
  type ExtractStatus,
  type SummarySection,
} from '@/features/chat/components/TaskPanel';
import type { Message, Task } from '@/features/chat/types';
import { useRoomContext } from '@/features/room/RoomContext';

export default function ChatPage() {
  const { rooms, activeRoomId } = useRoomContext();
  const activeRoom = rooms.find((room) => room.id === activeRoomId);

  // TODO(API): GET /api/chat/rooms/:roomId/messages 로 히스토리 로드
  // TODO(WS): new_message 구독으로 실시간 추가
  const [messages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [taskPanelOpen, setTaskPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'task' | 'summary'>('task');
  const [meetingEnded, setMeetingEnded] = useState(false);

  // TODO(API): 회의 종료(POST /api/chat/rooms/:roomId/end-session) 응답의 aiResult 로 채운다.
  //            현재 백엔드 AI 서비스는 스텁(요약 텍스트만 반환) 상태.
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStatus] = useState<ExtractStatus>('idle');
  const [summarySections] = useState<SummarySection[]>([]);
  const [summaryStatus] = useState<ExtractStatus>('idle');

  // TODO(WS): send_message emit → new_message 수신으로 목록 갱신 (+ 내 메시지 dedup)
  function handleSend() {
    if (messageInput.trim() === '') {
      return;
    }

    setMessageInput('');
  }

  // TODO(API): AI 태스크 추출 (백엔드 스텁 상태)
  function handleExtractTasks() {
    // no-op
  }

  // TODO(API): AI 회의 요약 (백엔드 스텁 상태)
  function handleExtractSummary() {
    // no-op
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

  // TODO(API): 체크된 태스크를 캘린더에 반영
  function handleSync() {
    // no-op
  }

  const canSync = tasks.some((task) => task.isAi && task.checked === true);

  if (!activeRoom) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        아직 채팅방이 없어요. 사이드바에서 새 채팅방을 만들어보세요.
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          avatarLabel={activeRoom.avatarLabel}
          avatarColorClass="bg-indigo-100 text-indigo-600"
          roomName={activeRoom.name}
          subtitle=""
          taskPanelOpen={taskPanelOpen}
          onToggleTaskPanel={() => {
            setTaskPanelOpen((prev) => !prev);
          }}
          meetingEnded={meetingEnded}
          onEndMeeting={() => {
            setMeetingEnded(true);
          }}
        />
        <MessageList
          messages={messages}
          meetingEnded={meetingEnded}
        />
        <InputBar
          value={messageInput}
          onChange={setMessageInput}
          onSend={handleSend}
        />
      </div>

      <TaskPanel
        open={taskPanelOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        taskStatus={taskStatus}
        tasks={tasks}
        onExtractTasks={handleExtractTasks}
        onToggleChecked={handleToggleChecked}
        onToggleDone={handleToggleDone}
        onDateChange={handleDateChange}
        canSync={canSync}
        onSync={handleSync}
        summaryStatus={summaryStatus}
        summarySections={summarySections}
        onExtractSummary={handleExtractSummary}
      />
    </div>
  );
}
