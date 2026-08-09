// ChatHeader.tsx (.chat-hdr)

interface ChatHeaderProps {
  avatarLabel: string
  avatarColorClass: string
  roomName: string
  subtitle: string
  taskPanelOpen: boolean
  onToggleTaskPanel: () => void
  meetingEnded: boolean
  onEndMeeting: () => void
}

function ChatHeader({
  avatarLabel,
  avatarColorClass,
  roomName,
  subtitle,
  taskPanelOpen,
  onToggleTaskPanel,
  meetingEnded,
  onEndMeeting,
}: ChatHeaderProps) {
  return (
    <div className="h-14 border-b border-gray-100 flex items-center px-4.5 gap-2.5 shrink-0">
      <span className={`w-8.5 h-8.5 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${avatarColorClass}`}>
        {avatarLabel}
      </span>
      <div className="min-w-0">
        <div className="text-[15px] font-semibold text-gray-900 truncate">{roomName}</div>
        <div className="text-xs text-gray-400 truncate">{subtitle}</div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          aria-label="검색"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer"
        >
          🔍
        </button>
        <button
          onClick={onToggleTaskPanel}
          aria-label="태스크 패널"
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer
            ${taskPanelOpen ? 'bg-purple-50 text-purple-600' : 'text-gray-500 hover:bg-gray-50'}
          `}
        >
          ☑
        </button>
        <button
          onClick={onEndMeeting}
          disabled={meetingEnded}
          className={`
            h-7.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap
            ${meetingEnded
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-red-50 text-red-600 border border-red-200 cursor-pointer hover:bg-red-100'}
          `}
        >
          ■ {meetingEnded ? '종료됨' : '회의 종료'}
        </button>
      </div>
    </div>
  )
}

export default ChatHeader
