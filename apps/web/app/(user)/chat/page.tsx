'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/features/auth/AuthContext';
import ChatHeader from '@/features/chat/components/ChatHeader';
import InputBar from '@/features/chat/components/InputBar';
import MessageList from '@/features/chat/components/MessageList';
import TaskPanel, {
  type ExtractStatus,
  type SummarySection,
} from '@/features/chat/components/TaskPanel';
import {
  fetchMessages,
  HISTORY_PAGE_SIZE,
  mapMessages,
  mergeMessages,
} from '@/features/chat/messages';
import { getChatSocket } from '@/features/chat/socket';
import type { Task } from '@/features/chat/types';
import { useRoomContext } from '@/features/room/RoomContext';

import type { ChatMessageResponse } from '@repo/schemas/chat';

type HistoryStatus = 'idle' | 'loading' | 'error';

export default function ChatPage() {
  const { userId } = useAuth();
  const { rooms, activeRoomId } = useRoomContext();
  const activeRoom = rooms.find((room) => room.id === activeRoomId);

  const [raw, setRaw] = useState<ChatMessageResponse[]>([]);
  const [historyStatus, setHistoryStatus] = useState<HistoryStatus>('idle');
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const [messageInput, setMessageInput] = useState('');
  const [taskPanelOpen, setTaskPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'task' | 'summary'>('task');
  const [meetingEnded, setMeetingEnded] = useState(false);

  // TaskPanel — 백엔드 AI 서비스가 스텁 상태. Phase 1-I 에서 실연동.
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStatus] = useState<ExtractStatus>('idle');
  const [summarySections] = useState<SummarySection[]>([]);
  const [summaryStatus] = useState<ExtractStatus>('idle');

  // await 이후 "아직 같은 방을 보고 있나" 확인용 (방 빠르게 전환 시 오래된 응답 무시)
  const activeRoomIdRef = useRef<string | null>(null);

  activeRoomIdRef.current = activeRoomId;

  const messages = useMemo(() => mapMessages(raw, userId), [raw, userId]);

  const loadHistory = useCallback(async (roomId: string) => {
    setHistoryStatus('loading');

    try {
      const history = await fetchMessages(roomId);

      if (activeRoomIdRef.current !== roomId) {
        return;
      }

      setRaw(history);
      setHasMoreOlder(history.length >= HISTORY_PAGE_SIZE);
      setHistoryStatus('idle');
    } catch (error) {
      if (activeRoomIdRef.current !== roomId) {
        return;
      }

      console.error(error);
      setHistoryStatus('error');
    }
  }, []);

  // 방이 바뀌면 히스토리 새로 로드
  useEffect(() => {
    setRaw([]);
    setHasMoreOlder(false);
    setMeetingEnded(false);

    if (activeRoomId === null) {
      setHistoryStatus('idle');

      return;
    }

    void loadHistory(activeRoomId);
  }, [activeRoomId, loadHistory]);

  // 실시간 new_message 구독
  useEffect(() => {
    const socket = getChatSocket();

    if (socket === null || activeRoomId === null) {
      return;
    }

    const handleNewMessage = (msg: ChatMessageResponse) => {
      if (msg.chatRoomId !== activeRoomId) {
        return;
      }

      setRaw((prev) => mergeMessages(prev, [msg], 'append'));
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [activeRoomId]);

  const handleLoadOlder = useCallback(async () => {
    const oldest = raw[0];

    if (activeRoomId === null || oldest === undefined || loadingOlder) {
      return;
    }

    setLoadingOlder(true);

    try {
      const older = await fetchMessages(activeRoomId, { before: oldest.id });

      if (activeRoomIdRef.current !== activeRoomId) {
        return;
      }

      setRaw((prev) => mergeMessages(prev, older, 'prepend'));
      setHasMoreOlder(older.length >= HISTORY_PAGE_SIZE);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingOlder(false);
    }
  }, [activeRoomId, raw, loadingOlder]);

  const handleSend = useCallback(() => {
    const content = messageInput.trim();
    const socket = getChatSocket();

    if (content === '' || activeRoomId === null || socket === null || meetingEnded) {
      return;
    }

    // 서버가 저장 후 new_message 로 되돌려주므로 낙관적 추가는 하지 않는다.
    socket.emit('send_message', { roomId: activeRoomId, content });
    setMessageInput('');
  }, [messageInput, activeRoomId, meetingEnded]);

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

  const canSync = tasks.some((task) => task.isAi && task.checked === true);

  if (!activeRoom) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        아직 채팅방이 없어요. 사이드바에서 새 채팅방을 만들어보세요.
      </div>
    );
  }

  let chatBody;

  if (historyStatus === 'error') {
    chatBody = (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-gray-400">
        메시지를 불러오지 못했어요.
        <button
          onClick={() => {
            void loadHistory(activeRoom.id);
          }}
          className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:border-purple-400 hover:text-purple-500"
        >
          다시 시도
        </button>
      </div>
    );
  } else if (historyStatus === 'loading') {
    chatBody = (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
        대화를 불러오는 중…
      </div>
    );
  } else {
    chatBody = (
      <MessageList
        messages={messages}
        meetingEnded={meetingEnded}
        hasMoreOlder={hasMoreOlder}
        loadingOlder={loadingOlder}
        onLoadOlder={() => {
          void handleLoadOlder();
        }}
      />
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

        {chatBody}

        <InputBar
          value={messageInput}
          onChange={setMessageInput}
          onSend={handleSend}
          disabled={meetingEnded}
        />
      </div>

      <TaskPanel
        open={taskPanelOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        taskStatus={taskStatus}
        tasks={tasks}
        onExtractTasks={() => {
          // Phase 1-I: 백엔드 AI 스텁
        }}
        onToggleChecked={handleToggleChecked}
        onToggleDone={handleToggleDone}
        onDateChange={handleDateChange}
        canSync={canSync}
        onSync={() => {
          // Phase 1-I / Phase 3: 캘린더 연동
        }}
        summaryStatus={summaryStatus}
        summarySections={summarySections}
        onExtractSummary={() => {
          // Phase 1-I: 백엔드 AI 스텁
        }}
      />
    </div>
  );
}
