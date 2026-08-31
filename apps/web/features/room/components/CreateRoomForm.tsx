'use client';

// CreateRoomForm.tsx
// 새 채팅방 만들기 (.create-view) — 이름 입력 + 유저 검색으로 팀원 초대
import { useState, type FormEvent } from 'react';

import UserSearchInput from '@/features/room/components/UserSearchInput';
import type { UserSearchResult } from '@/features/room/roomApi';

interface CreateRoomFormProps {
  onCancel: () => void;
  onSubmit: (input: { name: string; memberLoginIds: string[] }) => Promise<void>;
}

function CreateRoomForm({ onCancel, onSubmit }: CreateRoomFormProps) {
  const [name, setName] = useState('');
  const [members, setMembers] = useState<UserSearchResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addMember(user: UserSearchResult): void {
    setMembers((prev) => (prev.some((m) => m.id === user.id) ? prev : [...prev, user]));
  }

  function removeMember(id: string): void {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();

    const trimmed = name.trim();

    if (trimmed === '') {
      setError('채팅방 이름을 입력해 주세요.');

      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 백엔드가 loginId 로 멤버를 받는다 (memberUserLoginIds)
      await onSubmit({ name: trimmed, memberLoginIds: members.map((m) => m.loginId) });
      // 성공 시 상위에서 페이지 이동 → submitting 해제 불필요
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : '채팅방을 만들지 못했어요.');
      setSubmitting(false);
    }
  }

  return (
    <main className="flex h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        // overflow-hidden 을 걸면 UserSearchInput 의 검색 결과 드롭다운이 폼 경계에서 잘린다.
        // 대신 헤더/푸터에 개별로 라운드를 줘서 모서리를 정리한다.
        className="w-[440px] rounded-2xl border border-gray-200 bg-white"
      >
        <div className="flex h-[50px] items-center rounded-t-2xl border-b border-gray-100 px-5">
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
              onChange={(e) => {
                setName(e.target.value);
              }}
              maxLength={100}
              placeholder="예: 디자인 팀, 3분기 프로젝트…"
              className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-gray-500">팀원 초대 (선택)</span>
            <UserSearchInput
              onPick={addMember}
              excludeIds={members.map((m) => m.id)}
            />

            {members.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex h-7 items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 pr-1.5 pl-2.5 text-xs text-gray-700"
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-100 text-[9px] font-semibold text-purple-600">
                      {m.name.slice(0, 1)}
                    </span>
                    <span>{m.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        removeMember(m.id);
                      }}
                      aria-label={`${m.name} 제거`}
                      className="flex h-4 w-4 cursor-pointer items-center justify-center text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error !== null && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 rounded-b-2xl border-t border-gray-100 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 cursor-pointer rounded-lg border border-gray-300 px-4 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting || name.trim() === ''}
            className="h-9 cursor-pointer rounded-lg bg-purple-500 px-4 text-sm text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? '만드는 중…' : '완료'}
          </button>
        </div>
      </form>
    </main>
  );
}

export default CreateRoomForm;
