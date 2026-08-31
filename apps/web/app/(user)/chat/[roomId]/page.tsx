'use client';

// /chat/[roomId] — 실제 대화 화면. 어떤 방인지는 URL 이 정한다.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { useAuth } from '@/features/auth/AuthContext';
import ChatHeader from '@/features/chat/components/ChatHeader';
import InputBar from '@/features/chat/components/InputBar';
import MessageList from '@/features/chat/components/MessageList';
import {
  fetchMessages,
  HISTORY_PAGE_SIZE,
  mapMessages,
  mergeMessages,
} from '@/features/chat/messages';
import { getChatSocket } from '@/features/chat/socket';
import { closeRoom } from '@/features/room/roomApi';
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

  const [raw, setRaw] = useState<ChatMessageResponse[]>([]);
  const [historyStatus, setHistoryStatus] = useState<HistoryStatus>('idle');
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const [messageInput, setMessageInput] = useState('');
  const [locallyEnded, setLocallyEnded] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // 서버 기준으로 이미 종료된 방(closedAt) 이거나, 방금 내가 종료한 경우
  const roomClosed = activeRoom?.closedAt !== null && activeRoom?.closedAt !== undefined;
  const meetingEnded = roomClosed || locallyEnded;

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
    setLocallyEnded(false);
    setSendError(null);

    void loadHistory(roomId);
  }, [roomId, loadHistory]);

  // 실시간 new_message + 전송 실패(exception) 구독
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

    const handleException = (payload: unknown): void => {
      const message =
        payload !== null && typeof payload === 'object' && 'message' in payload
          ? String(payload.message)
          : '메시지를 보내지 못했어요.';

      // 토큰/인증 오류는 RoomContext 가 처리 → 여기선 무시
      if (!message.includes('토큰') && !message.includes('인증')) {
        setSendError(message);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('exception', handleException);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('exception', handleException);
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

    setSendError(null);
    // 서버가 저장 후 new_message 로 되돌려주므로 낙관적 추가는 하지 않는다.
    socket.emit('send_message', { roomId, content });
    setMessageInput('');
  }, [messageInput, roomId, meetingEnded]);

  // 방장만 회의(방) 종료 가능
  const iAmOwner = activeRoom?.role === 'OWNER';

  const roleLabel = ((): string => {
    if (activeRoom?.role === 'OWNER') {
      return '방장';
    }
    if (activeRoom?.role === 'MANAGER') {
      return '운영자';
    }

    return '';
  })();

  async function handleEndMeeting(): Promise<void> {
    if (meetingEnded) {
      return;
    }

    try {
      await closeRoom(roomId);
      setLocallyEnded(true);
      await refreshRooms();
      router.push('/chat');
    } catch (error) {
      console.error(error);
    }
  }

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
    <div className="flex h-full min-w-0 flex-col">
      <ChatHeader
        avatarLabel={activeRoom.avatarLabel}
        avatarColorClass="bg-indigo-100 text-indigo-600"
        roomName={activeRoom.name}
        roomId={roomId}
        roleLabel={roleLabel}
        memberCount={activeRoom.memberCount}
        meetingEnded={meetingEnded}
        canEndMeeting={iAmOwner}
        onEndMeeting={() => {
          void handleEndMeeting();
        }}
      />

      {chatBody}

      {meetingEnded ? (
        <div className="shrink-0 border-t border-gray-100 px-4 py-3 text-center text-xs text-gray-400">
          종료된 채팅방이에요. 대화 내용은 볼 수 있지만 새 메시지는 보낼 수 없어요.
        </div>
      ) : (
        <>
          {sendError !== null && (
            <div className="shrink-0 bg-red-50 px-4 py-2 text-center text-xs text-red-600">
              {sendError}
            </div>
          )}
          <InputBar
            value={messageInput}
            onChange={setMessageInput}
            onSend={handleSend}
            disabled={false}
          />
        </>
      )}
    </div>
  );
}
