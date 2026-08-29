'use client';

// MessageList.tsx (.msgs)
import type { Message } from '../types';
import AiExtractCard from './AiExtractCard';
import MessageBubble from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  meetingEnded?: boolean;
}

function MessageList({ messages, meetingEnded }: MessageListProps) {
  return (
    <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-4.5 py-5">
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
        <>
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-center text-sm font-medium text-amber-800">
            ■ 방장이 회의를 종료했어요. AI가 태스크를 분석 중입니다…
          </div>
          <AiExtractCard
            label="회의가 종료됐어요"
            text="오른쪽 패널에서 추출 버튼을 눌러 AI 태스크·채팅 요약을 가져오세요."
          />
        </>
      )}
    </div>
  );
}

export default MessageList;
