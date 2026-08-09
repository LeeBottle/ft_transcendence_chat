// AddUserModal.tsx
// saveAddUser() 대체 — 아이디/비밀번호/역할 필수, 이름/이메일 선택

import { useState } from 'react'
import type { NewAdminUserInput } from '../types'

interface AddUserModalProps {
  open: boolean
  onSubmit: (input: NewAdminUserInput) => void
  onCancel: () => void
}

function AddUserModal({ open, onSubmit, onCancel }: AddUserModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<NewAdminUserInput['role'] | ''>('')
  const [error, setError] = useState('')

  if (!open) return null

  function resetForm(): void {
    setUsername('')
    setPassword('')
    setName('')
    setEmail('')
    setRole('')
    setError('')
  }

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault()

    if (!username.trim()) return setError('아이디를 입력해주세요')
    if (!password.trim()) return setError('비밀번호를 입력해주세요')
    if (!role) return setError('역할을 선택해주세요')

    onSubmit({
      username: username.trim(),
      password: password.trim(),
      name: name.trim() || '-',
      email: email.trim() || '-',
      role,
    })
    resetForm()
  }

  function handleCancel(): void {
    resetForm()
    onCancel()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="
          flex flex-col gap-4
          bg-white rounded-2xl border border-gray-200
          px-8 py-7 w-96
        "
      >
        <p className="text-lg font-semibold text-gray-900">사용자 추가</p>

        <div className="flex flex-col gap-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="아이디 입력"
            className="px-3 h-9 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
            className="px-3 h-9 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름 입력 (선택)"
              className="px-3 h-9 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as NewAdminUserInput['role'])}
              className="px-3 h-9 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
            >
              <option value="">역할 선택</option>
              <option value="user">일반 회원</option>
              <option value="admin">관리자</option>
            </select>
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 입력 (선택)"
            className="px-3 h-9 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            신규 사용자의 초기 상태는 <span className="text-green-600 font-medium">활성</span>으로 자동 설정돼요.
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-1">
          <button
            type="button"
            onClick={handleCancel}
            className="
              px-4 h-9 rounded-lg
              border border-gray-300 text-gray-600 text-sm
              hover:bg-gray-50 transition-colors cursor-pointer
            "
          >
            취소
          </button>
          <button
            type="submit"
            className="
              px-4 h-9 rounded-lg text-sm text-white transition-colors cursor-pointer
              bg-purple-500 hover:bg-purple-600
            "
          >
            추가
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddUserModal
