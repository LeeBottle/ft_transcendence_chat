// RoomList.tsx
// 사이드바의 채팅방 목록 (room-av / sb-badge)

import type { Room } from '../types'

interface RoomListProps {
  rooms: Room[]
  activeRoomId?: string
  onSelectRoom: (id: string) => void
}

const AVATAR_COLOR_CLASSES: Record<Room['avatarColor'], string> = {
  indigo: 'bg-indigo-100 text-indigo-600',
  teal: 'bg-teal-100 text-teal-600',
  orange: 'bg-orange-100 text-orange-600',
  pink: 'bg-pink-100 text-pink-600',
}

function RoomList({ rooms, activeRoomId, onSelectRoom }: RoomListProps) {
  return (
    <div className="flex flex-col gap-1">
      {rooms.map((room) => {
        const isActive = room.id === activeRoomId

        return (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            className={`
              flex items-center gap-2
              px-3 h-10 rounded-lg text-sm text-left cursor-pointer transition-colors
              ${isActive ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-50'}
            `}
          >
            <span
              className={`
                w-6 h-6 rounded-full flex items-center justify-center
                text-[10px] font-semibold shrink-0
                ${isActive ? 'bg-white/20 text-white' : AVATAR_COLOR_CLASSES[room.avatarColor]}
              `}
            >
              {room.avatarLabel}
            </span>
            <span className="flex-1 truncate">{room.name}</span>
            {!!room.unreadCount && (
              <span
                className={`
                  h-[18px] min-w-[18px] px-1 rounded-full text-[10px] font-semibold
                  flex items-center justify-center
                  ${isActive ? 'bg-white/20 text-white' : 'bg-purple-500 text-white'}
                `}
              >
                {room.unreadCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default RoomList
