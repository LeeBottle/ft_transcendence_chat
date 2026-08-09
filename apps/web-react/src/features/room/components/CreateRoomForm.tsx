// CreateRoomForm.tsx
// 새 채팅방 만들기 (.create-view) — 이름 입력 + 팀원 초대 chip 목록

import { useState, type FormEvent } from 'react'

interface CreateRoomFormProps {
  onCancel: () => void
  onSubmit: (input: { name: string; memberIds: string[] }) => void
}

function CreateRoomForm({ onCancel, onSubmit }: CreateRoomFormProps) {
  const [name, setName] = useState('')
  const [inviteInput, setInviteInput] = useState('')
  const [memberIds, setMemberIds] = useState<string[]>([])

  function addMember(): void {
    const id = inviteInput.trim()
    if (!id) return
    if (memberIds.includes(id)) {
      setInviteInput('')
      return
    }
    setMemberIds([...memberIds, id])
    setInviteInput('')
  }

  function removeMember(id: string): void {
    setMemberIds(memberIds.filter((m) => m !== id))
  }

  function handleSubmit(e: FormEvent): void {
    e.preventDefault()
    onSubmit({ name, memberIds })
  }

  return (
    <main className="flex items-center justify-center h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-[440px] bg-white rounded-2xl border border-gray-200 overflow-hidden"
      >
        <div className="h-[50px] border-b border-gray-100 flex items-center px-5">
          <span className="text-sm font-semibold text-gray-900 flex-1">새 채팅방 만들기</span>
          <button
            type="button"
            onClick={onCancel}
            aria-label="닫기"
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:bg-gray-50 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="room-name" className="text-xs font-medium text-gray-500">채팅방 이름</label>
            <input
              id="room-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 디자인 팀, 3분기 프로젝트…"
              className="w-full h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="invite-id" className="text-xs font-medium text-gray-500">팀원 초대</label>
            <div className="flex gap-1.5">
              <input
                id="invite-id"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addMember()
                  }
                }}
                placeholder="아이디 입력"
                className="flex-1 h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
              />
              <button
                type="button"
                onClick={addMember}
                className="px-4 h-9 rounded-lg bg-purple-500 text-white text-sm whitespace-nowrap cursor-pointer hover:bg-purple-600 transition-colors"
              >
                추가
              </button>
            </div>

            {memberIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {memberIds.map((id) => (
                  <div
                    key={id}
                    className="flex items-center gap-1.5 pl-2.5 pr-1.5 h-7 rounded-full bg-gray-50 border border-gray-200 text-xs text-gray-700"
                  >
                    <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-600 text-[9px] font-semibold flex items-center justify-center">
                      {id.charAt(0).toUpperCase()}
                    </span>
                    <span>{id}</span>
                    <button
                      type="button"
                      onClick={() => removeMember(id)}
                      aria-label={`${id} 제거`}
                      className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 h-9 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 h-9 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 transition-colors cursor-pointer"
          >
            완료
          </button>
        </div>
      </form>
    </main>
  )
}

export default CreateRoomForm
