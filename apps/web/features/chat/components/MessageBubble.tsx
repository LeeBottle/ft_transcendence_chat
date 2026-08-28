'use client';

// MessageBubble.tsx (.bubble)
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const { isMe, authorName, content, time, avatarLabel, avatarColorClass } = message;

  return (
    <div className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
      {!isMe && (
        <span
          className={`mt-0.5 flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColorClass ?? 'bg-indigo-100 text-indigo-600'}`}
        >
          {avatarLabel}
        </span>
      )}
      <div className="max-w-[55%]">
        <div className={`mb-0.5 text-xs text-gray-400 ${isMe ? 'text-right' : ''}`}>
          {authorName}
        </div>
        <div
          className={`inline-block max-w-full rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed ${
            isMe
              ? 'rounded-tr-sm bg-purple-500 text-white'
              : 'rounded-tl-sm border border-gray-100 bg-gray-50 text-gray-900'
          } `}
        >
          {content}
        </div>
        <div className={`mt-1 text-[10px] text-gray-400 ${isMe ? 'text-right' : ''}`}>{time}</div>
      </div>
    </div>
  );
}

export default MessageBubble;
