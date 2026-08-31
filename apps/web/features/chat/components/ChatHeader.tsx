'use client';

// ChatHeader.tsx (.chat-hdr)
import RoomMembersPopover from '@/features/room/components/RoomMembersPopover';

interface ChatHeaderProps {
  avatarLabel: string;
  avatarColorClass: string;
  roomName: string;
  roomId: string;
  /** 내 역할 라벨 ('방장' / '운영자' / '') */
  roleLabel: string;
  memberCount?: number;
  meetingEnded: boolean;
  canEndMeeting: boolean;
  onEndMeeting: () => void;
}

function ChatHeader({
  avatarLabel,
  avatarColorClass,
  roomName,
  roomId,
  roleLabel,
  memberCount,
  meetingEnded,
  canEndMeeting,
  onEndMeeting,
}: ChatHeaderProps) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-gray-100 px-4.5">
      <span
        className={`flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarColorClass}`}
      >
        {avatarLabel}
      </span>
      <div className="min-w-0">
        <div className="truncate text-[15px] font-semibold text-gray-900">{roomName}</div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          {roleLabel !== '' && <span>{roleLabel} ·</span>}
          <RoomMembersPopover
            roomId={roomId}
            memberCount={memberCount}
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {canEndMeeting && (
          <button
            onClick={onEndMeeting}
            disabled={meetingEnded}
            className={`flex h-7.5 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold whitespace-nowrap ${
              meetingEnded
                ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                : 'cursor-pointer border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
            } `}
          >
            ■ {meetingEnded ? '종료됨' : '회의 종료'}
          </button>
        )}
      </div>
    </div>
  );
}

export default ChatHeader;
