'use client';

import { useState } from 'react';

import UserTable from '@/features/admin/components/UserTable';
import type { AdminUser, NewAdminUserInput } from '@/features/admin/types';

const INITIAL_USERS: AdminUser[] = [
  {
    id: 1,
    username: 'user_01',
    name: '김지수',
    email: 'jisoo@company.com',
    role: 'user',
    joinDate: '2025-01-15',
    status: 'active',
  },
  {
    id: 2,
    username: 'user_02',
    name: '박민준',
    email: 'minjun@company.com',
    role: 'user',
    joinDate: '2025-02-03',
    status: 'suspended',
  },
  {
    id: 3,
    username: 'admin',
    name: '관리자',
    email: 'admin@company.com',
    role: 'admin',
    joinDate: '2024-12-01',
    status: 'active',
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(INITIAL_USERS);

  // TODO(API): POST /admin/users 로 사용자 생성 필요 - 지금은 mock
  function handleAddUser(input: NewAdminUserInput) {
    // SUCCESS: 새 사용자를 목록 맨 앞에 추가 (실제로는 서버가 생성한 id를 받아와야 함)
    setUsers((prev) => [
      {
        id: Date.now(),
        username: input.username,
        name: input.name,
        email: input.email,
        role: input.role,
        joinDate: new Date().toISOString().slice(0, 10),
        status: 'active',
      },
      ...prev,
    ]);
    // FAIL: 아이디 중복 등 실패 시 모달에 에러 메시지 표시 필요 (백엔드 연동 시 추가)
  }

  // TODO(API): PATCH /admin/users/:id 로 사용자 정보 수정 필요 - 지금은 mock
  function handleSaveUser(id: number, input: Pick<AdminUser, 'username' | 'name' | 'email'>) {
    // SUCCESS: 로컬 목록 갱신
    setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, ...input } : user)));
    // FAIL: 실패 시 원래 값으로 롤백 필요 (백엔드 연동 시 추가)
  }

  // TODO(API): PATCH /admin/users/:id/suspend 필요 - 지금은 mock
  function handleSuspendUser(id: number) {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, status: 'suspended' } : user)),
    );
  }

  // TODO(API): PATCH /admin/users/:id/restore 필요 - 지금은 mock
  function handleRestoreUser(id: number) {
    setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, status: 'active' } : user)));
  }

  // TODO(API): DELETE /admin/users/:id 필요 - 지금은 mock
  function handleDeleteUser(id: number) {
    // SUCCESS: 목록에서 제거
    setUsers((prev) => prev.filter((user) => user.id !== id));
    // FAIL: 실패 시 목록을 그대로 유지하고 에러 토스트 필요 (백엔드 연동 시 추가)
  }

  return (
    <UserTable
      users={users}
      onAddUser={handleAddUser}
      onSaveUser={handleSaveUser}
      onSuspendUser={handleSuspendUser}
      onRestoreUser={handleRestoreUser}
      onDeleteUser={handleDeleteUser}
    />
  );
}
