'use client';
// MessageBubble.tsx (.bubble)

import type { Message } from '../types'

interface MessageBubbleProps {
  message: Message
}

function MessageBubble({ message }: MessageBubbleProps) {
  const { isMe, authorName, content, time, avatarLabel, avatarColorClass } = message

  return (
    <div className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
      {!isMe && (
        <span
          className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5 ${avatarColorClass ?? 'bg-indigo-100 text-indigo-600'}`}
        >
          {avatarLabel}
        </span>
      )}
      <div className="max-w-[55%]">
        <div className={`text-xs text-gray-400 mb-0.5 ${isMe ? 'text-right' : ''}`}>{authorName}</div>
        <div
          className={`
            inline-block px-3.5 py-2 rounded-2xl text-[13.5px] leading-relaxed max-w-full
            ${isMe
              ? 'bg-purple-500 text-white rounded-tr-sm'
              : 'bg-gray-50 border border-gray-100 text-gray-900 rounded-tl-sm'}
          `}
        >
          {content}
        </div>
        <div className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'text-right' : ''}`}>{time}</div>
      </div>
    </div>
  )
}

export default MessageBubble
