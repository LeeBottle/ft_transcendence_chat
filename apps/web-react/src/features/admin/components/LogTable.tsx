// LogTable.tsx
// renderLogs() 대체 — 조회 전용, 채팅방/날짜로 필터링

import { useMemo, useState } from 'react'
import type { AdminLog } from '../types'

interface LogTableProps {
  logs: AdminLog[]
  rooms: { id: number; name: string }[]
}

function LogTable({ logs, rooms }: LogTableProps) {
  const [search, setSearch] = useState('')
  const [roomId, setRoomId] = useState('')
  const [date, setDate] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return logs.filter((log) => {
      const searchMatch =
        !q ||
        (log.chat_room_id.toString() + log.content).toLowerCase().includes(q)
      const roomMatch = !roomId || log.chat_room_id.toString() === roomId
      const dateMatch = !date || log.created_at.startsWith(date)
      return searchMatch && roomMatch && dateMatch
    })
  }, [logs, search, roomId, date])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold text-gray-900">채팅방 로그</span>
        <span className="text-xs text-gray-400">조회 전용</span>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="채팅방 ID, 내용 검색…"
          className="w-60 h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
        />
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="w-44 h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
        >
          <option value="">전체 채팅방</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              채팅방 #{room.id} — {room.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-40 h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
              <th className="px-5 py-3 font-medium">id</th>
              <th className="px-5 py-3 font-medium">chat_room_id</th>
              <th className="px-5 py-3 font-medium">sender_user_id</th>
              <th className="px-5 py-3 font-medium">content</th>
              <th className="px-5 py-3 font-medium">created_at</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-400">{log.id}</td>
                <td className="px-5 py-3 text-gray-400">{log.chat_room_id}</td>
                <td className="px-5 py-3 text-gray-400">{log.sender_user_id}</td>
                <td className="px-5 py-3 text-gray-900 max-w-90 truncate" title={log.content}>
                  {log.content}
                </td>
                <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {log.created_at}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LogTable
