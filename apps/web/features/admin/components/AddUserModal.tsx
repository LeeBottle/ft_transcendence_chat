'use client';

// AddUserModal.tsx
// saveAddUser() 대체 — 아이디/비밀번호/역할 필수, 이름/이메일 선택
import { useState } from 'react';

import type { NewAdminUserInput } from '../types';

interface AddUserModalProps {
  open: boolean;
  onSubmit: (input: NewAdminUserInput) => void;
  onCancel: () => void;
}

function AddUserModal({ open, onSubmit, onCancel }: AddUserModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<NewAdminUserInput['role'] | ''>('');
  const [error, setError] = useState('');

  if (!open) {
    return null;
  }

  function resetForm(): void {
    setUsername('');
    setPassword('');
    setName('');
    setEmail('');
    setRole('');
    setError('');
  }

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();

    if (!username.trim()) {
      setError('아이디를 입력해주세요');

      return;
    }
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요');

      return;
    }
    if (!role) {
      setError('역할을 선택해주세요');

      return;
    }

    onSubmit({
      username: username.trim(),
      password: password.trim(),
      name: name.trim() || '-',
      email: email.trim() || '-',
      role,
    });
    resetForm();
  }

  function handleCancel(): void {
    resetForm();
    onCancel();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="flex w-96 flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-8 py-7"
      >
        <p className="text-lg font-semibold text-gray-900">사용자 추가</p>

        <div className="flex flex-col gap-3">
          <input
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
            }}
            placeholder="아이디 입력"
            className="h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            placeholder="비밀번호 입력"
            className="h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              placeholder="이름 입력 (선택)"
              className="h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
            />
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as NewAdminUserInput['role']);
              }}
              className="h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
            >
              <option value="">역할 선택</option>
              <option value="user">일반 회원</option>
              <option value="admin">관리자</option>
            </select>
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            placeholder="이메일 입력 (선택)"
            className="h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-400">
            신규 사용자의 초기 상태는 <span className="font-medium text-green-600">활성</span>으로
            자동 설정돼요.
          </p>
        </div>

        <div className="mt-1 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="h-9 cursor-pointer rounded-lg border border-gray-300 px-4 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            className="h-9 cursor-pointer rounded-lg bg-purple-500 px-4 text-sm text-white transition-colors hover:bg-purple-600"
          >
            추가
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddUserModal;
