'use client';

// MessageList.tsx (.msgs)
import { useEffect, useRef } from 'react';

import type { Message } from '../types';
import MessageBubble from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  meetingEnded?: boolean;
  hasMoreOlder?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
}

function MessageList({
  messages,
  meetingEnded = false,
  hasMoreOlder = false,
  loadingOlder = false,
  onLoadOlder,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageId = messages.at(-1)?.id;

  // 새 메시지가 맨 아래 붙으면(또는 최초 로드) 스크롤을 바닥으로.
  // 과거 메시지를 앞에 붙일 때는 lastMessageId 가 그대로라 스크롤이 안 튄다.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [lastMessageId]);

  return (
    <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-4.5 py-5">
      {onLoadOlder !== undefined && hasMoreOlder && (
        <div className="flex justify-center">
          <button
            onClick={onLoadOlder}
            disabled={loadingOlder}
            className="cursor-pointer rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:border-purple-300 hover:text-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingOlder ? '불러오는 중…' : '이전 메시지 더 보기'}
          </button>
        </div>
      )}

      {messages.length === 0 && !meetingEnded && (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-300">
          아직 메시지가 없어요. 첫 메시지를 보내보세요.
        </div>
      )}

      {messages.map((message) => (
        <div
          key={message.id}
          className="flex flex-col gap-3.5"
        >
          {message.dateLabel && (
            <div className="py-1 text-center text-xs text-gray-400">{message.dateLabel}</div>
          )}
          <MessageBubble message={message} />
        </div>
      ))}

      {meetingEnded && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-center text-sm font-medium text-amber-800">
          ■ 방장이 회의를 종료했어요.
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
