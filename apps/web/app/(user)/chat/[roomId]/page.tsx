'use client';

// /chat/[roomId] — 실제 대화 화면. 어떤 방인지는 URL 이 정한다.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

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
import RoomManageModal from '@/features/room/components/RoomManageModal';
import { useRoomContext } from '@/features/room/RoomContext';

import type { ChatMessageResponse } from '@repo/schemas/chat';

type HistoryStatus = 'idle' | 'loading' | 'error';

export default function ChatRoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const router = useRouter();

  const { userId } = useAuth();
  const { rooms, roomsLoaded, refreshRooms } = useRoomContext();
  const activeRoom = rooms.find((room) => room.id === roomId);

  const [manageOpen, setManageOpen] = useState(false);

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
  const roomIdRef = useRef(roomId);

  roomIdRef.current = roomId;

  const messages = useMemo(() => mapMessages(raw, userId), [raw, userId]);

  const loadHistory = useCallback(async (targetRoomId: string) => {
    setHistoryStatus('loading');

    try {
      const history = await fetchMessages(targetRoomId);

      if (roomIdRef.current !== targetRoomId) {
        return;
      }

      setRaw(history);
      setHasMoreOlder(history.length >= HISTORY_PAGE_SIZE);
      setHistoryStatus('idle');
    } catch (error) {
      if (roomIdRef.current !== targetRoomId) {
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

    void loadHistory(roomId);
  }, [roomId, loadHistory]);

  // 실시간 new_message 구독
  useEffect(() => {
    const socket = getChatSocket();

    if (socket === null) {
      return undefined;
    }

    const handleNewMessage = (msg: ChatMessageResponse): void => {
      if (msg.chatRoomId !== roomId) {
        return;
      }

      setRaw((prev) => mergeMessages(prev, [msg], 'append'));
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [roomId]);

  const handleLoadOlder = useCallback(async () => {
    const oldest = raw[0];

    if (oldest === undefined || loadingOlder) {
      return;
    }

    setLoadingOlder(true);

    try {
      const older = await fetchMessages(roomId, { before: oldest.id });

      if (roomIdRef.current !== roomId) {
        return;
      }

      setRaw((prev) => mergeMessages(prev, older, 'prepend'));
      setHasMoreOlder(older.length >= HISTORY_PAGE_SIZE);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingOlder(false);
    }
  }, [roomId, raw, loadingOlder]);

  const handleSend = useCallback(() => {
    const content = messageInput.trim();
    const socket = getChatSocket();

    if (content === '' || socket === null || meetingEnded) {
      return;
    }

    // 서버가 저장 후 new_message 로 되돌려주므로 낙관적 추가는 하지 않는다.
    socket.emit('send_message', { roomId, content });
    setMessageInput('');
  }, [messageInput, roomId, meetingEnded]);

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

  // 헤더 부제목: 주제가 있으면 주제, 없으면 "나 뺀 멤버 이름 · 전체 인원수"
  const members = activeRoom?.members ?? [];
  const otherNames = members.filter((m) => m.userId !== userId).map((m) => m.name);
  const memberSubtitle =
    members.length === 0
      ? ''
      : `${otherNames.length > 0 ? otherNames.join(', ') : '나만 있는 방'} · ${members.length}명`;
  const topic = activeRoom?.topic;
  const headerSubtitle =
    topic !== null && topic !== undefined && topic !== '' ? topic : memberSubtitle;

  if (activeRoom === undefined) {
    if (!roomsLoaded) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-gray-400">
          불러오는 중…
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-gray-400">
        이 채팅방을 찾을 수 없어요. 나갔거나 삭제된 방일 수 있어요.
        <Link
          href="/chat"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-purple-400 hover:text-purple-500"
        >
          채팅방 목록으로
        </Link>
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
            void loadHistory(roomId);
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
          subtitle={headerSubtitle}
          taskPanelOpen={taskPanelOpen}
          onToggleTaskPanel={() => {
            setTaskPanelOpen((prev) => !prev);
          }}
          meetingEnded={meetingEnded}
          onEndMeeting={() => {
            setMeetingEnded(true);
          }}
          onOpenManage={() => {
            setManageOpen(true);
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

      {manageOpen && (
        <RoomManageModal
          room={activeRoom}
          myUserId={userId}
          onClose={() => {
            setManageOpen(false);
          }}
          onChanged={refreshRooms}
          onLeftRoom={() => {
            setManageOpen(false);
            router.push('/chat');
          }}
        />
      )}
    </div>
  );
}
