// UserTable.tsx
// renderUsers() 대체 — 검색, 인라인 수정, 정지/복구, 삭제

import { useMemo, useState } from 'react'
import ConfirmDialog from '@components/ConfirmDialog'
import AddUserModal from './AddUserModal'
import type { AdminUser, NewAdminUserInput } from '../types'

interface UserTableProps {
  users: AdminUser[]
  onAddUser: (input: NewAdminUserInput) => void
  onSaveUser: (id: number, input: Pick<AdminUser, 'username' | 'name' | 'email'>) => void
  onSuspendUser: (id: number) => void
  onRestoreUser: (id: number) => void
  onDeleteUser: (id: number) => void
}

function UserTable({
  users,
  onAddUser,
  onSaveUser,
  onSuspendUser,
  onRestoreUser,
  onDeleteUser,
}: UserTableProps) {
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState({ username: '', name: '', email: '' })
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter(
      (u) => !q || (u.username + u.name + u.email).toLowerCase().includes(q)
    )
  }, [users, search])

  function startEdit(user: AdminUser): void {
    setEditingId(user.id)
    setDraft({ username: user.username, name: user.name, email: user.email })
  }

  function saveEdit(id: number): void {
    onSaveUser(id, draft)
    setEditingId(null)
  }

  function handleAddUser(input: NewAdminUserInput): void {
    onAddUser(input)
    setAddOpen(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold text-gray-900">사용자 관리</span>
        <span className="text-xs text-gray-400">총 {filtered.length}명</span>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름, 아이디 검색…"
          className="w-60 h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-purple-400"
        />
        <button
          onClick={() => setAddOpen(true)}
          className="ml-auto px-4 h-9 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 transition-colors cursor-pointer"
        >
          사용자 추가
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
              <th className="px-5 py-3 font-medium">#</th>
              <th className="px-5 py-3 font-medium">아이디</th>
              <th className="px-5 py-3 font-medium">이름</th>
              <th className="px-5 py-3 font-medium">이메일</th>
              <th className="px-5 py-3 font-medium">역할</th>
              <th className="px-5 py-3 font-medium">가입일</th>
              <th className="px-5 py-3 font-medium">상태</th>
              <th className="px-5 py-3 font-medium text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const isEditing = editingId === user.id

              if (isEditing) {
                return (
                  <tr key={user.id} className="border-t border-gray-100 bg-purple-50">
                    <td className="px-5 py-2 text-gray-400">{user.id}</td>
                    <td className="px-5 py-2">
                      <input
                        value={draft.username}
                        onChange={(e) => setDraft({ ...draft, username: e.target.value })}
                        className="w-full h-8 px-2 rounded-md border border-purple-300 text-sm outline-none bg-white"
                      />
                    </td>
                    <td className="px-5 py-2">
                      <input
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        className="w-full h-8 px-2 rounded-md border border-purple-300 text-sm outline-none bg-white"
                      />
                    </td>
                    <td className="px-5 py-2">
                      <input
                        value={draft.email}
                        onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                        className="w-full h-8 px-2 rounded-md border border-purple-300 text-sm outline-none bg-white"
                      />
                    </td>
                    <td className="px-5 py-2">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-5 py-2 text-xs text-gray-500">{user.joinDate}</td>
                    <td className="px-5 py-2">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-5 py-2 text-center whitespace-nowrap">
                      <button
                        onClick={() => saveEdit(user.id)}
                        className="px-2.5 h-7 rounded-md bg-green-100 text-green-700 text-xs cursor-pointer"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="ml-1 px-2.5 h-7 rounded-md border border-gray-300 text-gray-500 text-xs cursor-pointer"
                      >
                        취소
                      </button>
                    </td>
                  </tr>
                )
              }

              return (
                <tr
                  key={user.id}
                  onClick={() => startEdit(user)}
                  className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-5 py-3 text-gray-400">{user.id}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{user.username}</td>
                  <td className="px-5 py-3 text-gray-700">{user.name}</td>
                  <td className="px-5 py-3 text-gray-500">{user.email}</td>
                  <td className="px-5 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{user.joinDate}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={user.status} />
                  </td>
                  <td
                    className="px-5 py-3 text-center whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {user.status === 'active' ? (
                      <button
                        onClick={() => onSuspendUser(user.id)}
                        className="px-2.5 h-7 rounded-md bg-amber-100 text-amber-700 text-xs cursor-pointer"
                      >
                        정지
                      </button>
                    ) : (
                      <button
                        onClick={() => onRestoreUser(user.id)}
                        className="px-2.5 h-7 rounded-md bg-green-100 text-green-700 text-xs cursor-pointer"
                      >
                        복구
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(user)}
                      className="ml-1 px-2.5 h-7 rounded-md bg-red-100 text-red-600 text-xs cursor-pointer"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="사용자 삭제"
        description={
          deleteTarget
            ? `'${deleteTarget.name}(${deleteTarget.username})' 계정을 삭제할까요? 이 작업은 되돌릴 수 없어요.`
            : undefined
        }
        confirmLabel="삭제"
        danger
        onConfirm={() => {
          if (deleteTarget) onDeleteUser(deleteTarget.id)
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <AddUserModal open={addOpen} onSubmit={handleAddUser} onCancel={() => setAddOpen(false)} />
    </div>
  )
}

function RoleBadge({ role }: { role: AdminUser['role'] }) {
  return (
    <span
      className={`
        px-2 py-0.5 rounded-full text-xs
        ${role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}
      `}
    >
      {role === 'admin' ? '관리자' : '일반'}
    </span>
  )
}

function StatusBadge({ status }: { status: AdminUser['status'] }) {
  return (
    <span
      className={`
        px-2 py-0.5 rounded-full text-xs
        ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}
      `}
    >
      {status === 'active' ? '활성' : '정지'}
    </span>
  )
}

export default UserTable
