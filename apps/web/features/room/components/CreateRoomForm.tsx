'use client';

// CreateRoomForm.tsx
// 새 채팅방 만들기 (.create-view) — 이름 입력 + 팀원 초대 chip 목록
import { useState, type FormEvent } from 'react';

interface CreateRoomFormProps {
  onCancel: () => void;
  onSubmit: (input: { name: string; memberIds: string[] }) => void;
}

function CreateRoomForm({ onCancel, onSubmit }: CreateRoomFormProps) {
  const [name, setName] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);

  function addMember(): void {
    const id = inviteInput.trim();
    if (!id) return;
    if (memberIds.includes(id)) {
      setInviteInput('');
      return;
    }
    setMemberIds([...memberIds, id]);
    setInviteInput('');
  }

  function removeMember(id: string): void {
    setMemberIds(memberIds.filter((m) => m !== id));
  }

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    onSubmit({ name, memberIds });
  }

  return (
    <main className="flex h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-[440px] overflow-hidden rounded-2xl border border-gray-200 bg-white"
      >
        <div className="flex h-[50px] items-center border-b border-gray-100 px-5">
          <span className="flex-1 text-sm font-semibold text-gray-900">새 채팅방 만들기</span>
          <button
            type="button"
            onClick={onCancel}
            aria-label="닫기"
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-gray-400 hover:bg-gray-50"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="room-name"
              className="text-xs font-medium text-gray-500"
            >
              채팅방 이름
            </label>
            <input
              id="room-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 디자인 팀, 3분기 프로젝트…"
              className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="invite-id"
              className="text-xs font-medium text-gray-500"
            >
              팀원 초대
            </label>
            <div className="flex gap-1.5">
              <input
                id="invite-id"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addMember();
                  }
                }}
                placeholder="아이디 입력"
                className="h-9 flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
              />
              <button
                type="button"
                onClick={addMember}
                className="h-9 cursor-pointer rounded-lg bg-purple-500 px-4 text-sm whitespace-nowrap text-white transition-colors hover:bg-purple-600"
              >
                추가
              </button>
            </div>

            {memberIds.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {memberIds.map((id) => (
                  <div
                    key={id}
                    className="flex h-7 items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 pr-1.5 pl-2.5 text-xs text-gray-700"
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-100 text-[9px] font-semibold text-purple-600">
                      {id.charAt(0).toUpperCase()}
                    </span>
                    <span>{id}</span>
                    <button
                      type="button"
                      onClick={() => removeMember(id)}
                      aria-label={`${id} 제거`}
                      className="flex h-4 w-4 cursor-pointer items-center justify-center text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 cursor-pointer rounded-lg border border-gray-300 px-4 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            className="h-9 cursor-pointer rounded-lg bg-purple-500 px-4 text-sm text-white transition-colors hover:bg-purple-600"
          >
            완료
          </button>
        </div>
      </form>
    </main>
  );
}

export default CreateRoomForm;
