'use client';

import { useEffect, useMemo, useState } from 'react';

import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import TextField from '@/components/ui/TextField';
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUserStatus,
  type AdminUser,
  type AdminUserRole,
} from '@/features/admin/adminApi';
import AdminTopbar from '@/features/admin/AdminTopbar';

const STATUS_LABEL: Record<AdminUser['status'], string> = {
  ACTIVE: '활성',
  SUSPENDED: '정지',
  WITHDRAWN: '탈퇴',
};

const STATUS_VARIANT: Record<AdminUser['status'], 'success' | 'danger' | 'neutral'> = {
  ACTIVE: 'success',
  SUSPENDED: 'danger',
  WITHDRAWN: 'neutral',
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date(iso));
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  async function load(): Promise<void> {
    try {
      setError(null);
      setUsers(await fetchAdminUsers());
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : '불러오지 못했어요');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (q === '') {
      return users;
    }

    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.loginId.toLowerCase().includes(q),
    );
  }, [users, search]);

  async function changeStatus(user: AdminUser, status: AdminUser['status']): Promise<void> {
    setBusyId(user.id);
    setError(null);

    try {
      await updateAdminUserStatus(user.id, status);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status } : u)));
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : '상태를 바꾸지 못했어요');
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete(): Promise<void> {
    if (pendingDelete === null) {
      return;
    }

    const target = pendingDelete;

    setPendingDelete(null);
    setBusyId(target.id);

    try {
      await deleteAdminUser(target.id);
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : '삭제하지 못했어요');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <AdminTopbar
        icon="user"
        title="사용자 관리"
        trailing={`총 ${users.length}명`}
      />

      <div className="flex items-center gap-2 px-6 pt-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          placeholder="이름, 아이디 검색…"
          className="border-border-strong bg-surface-muted text-body focus:border-primary-ring h-9 w-60 rounded-lg border px-3 outline-none"
        />
        <Button
          className="ml-auto"
          variant="secondary"
          size="sm"
          onClick={() => {
            setLoading(true);
            void load();
          }}
        >
          새로고침
        </Button>
        <Button
          onClick={() => {
            setAddOpen(true);
          }}
        >
          + 사용자 추가
        </Button>
      </div>

      {error !== null && (
        <div className="px-6 pt-3">
          <Alert
            variant="danger"
            onClose={() => {
              setError(null);
            }}
          >
            {error}
          </Alert>
        </div>
      )}

      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="py-16 text-center">
            <Spinner label="불러오는 중…" />
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-border text-text-subtle border-b-2 text-left text-[11px] font-semibold tracking-wide uppercase">
                <th className="px-3 py-2.5">아이디</th>
                <th className="px-3 py-2.5">이름</th>
                <th className="px-3 py-2.5">이메일</th>
                <th className="px-3 py-2.5">역할</th>
                <th className="px-3 py-2.5">가입일</th>
                <th className="px-3 py-2.5">상태</th>
                <th className="px-3 py-2.5 text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => {
                const busy = busyId === u.id;

                return (
                  <tr
                    key={u.id}
                    className="border-border hover:bg-surface-muted border-b"
                  >
                    <td className="text-text-muted px-3 py-2.5 font-mono text-xs">{u.loginId}</td>
                    <td className="text-text px-3 py-2.5">{u.name}</td>
                    <td className="text-text-muted px-3 py-2.5">{u.email}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant={u.role === 'ADMIN' ? 'primary' : 'neutral'}>
                        {u.role === 'ADMIN' ? '관리자' : '일반'}
                      </Badge>
                    </td>
                    <td className="text-text-muted px-3 py-2.5">{formatDate(u.createdAt)}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant={STATUS_VARIANT[u.status]}>{STATUS_LABEL[u.status]}</Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-center gap-1.5">
                        {u.status === 'ACTIVE' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={busy}
                            onClick={() => {
                              void changeStatus(u, 'SUSPENDED');
                            }}
                          >
                            정지
                          </Button>
                        )}
                        {u.status === 'SUSPENDED' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={busy}
                            onClick={() => {
                              void changeStatus(u, 'ACTIVE');
                            }}
                          >
                            복구
                          </Button>
                        )}
                        {u.status !== 'WITHDRAWN' && (
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={busy}
                            onClick={() => {
                              setPendingDelete(u);
                            }}
                          >
                            삭제
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!loading && visible.length === 0 && (
          <p className="text-text-subtle py-16 text-center text-sm">
            {users.length === 0 ? '사용자가 없어요.' : '검색 결과가 없어요.'}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="사용자를 삭제할까요?"
        description={
          pendingDelete === null ? undefined : `${pendingDelete.name} (${pendingDelete.loginId})`
        }
        confirmLabel="삭제"
        danger
        onConfirm={() => {
          void confirmDelete();
        }}
        onCancel={() => {
          setPendingDelete(null);
        }}
      />

      <AddUserModal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
        }}
        onCreated={(user) => {
          setUsers((prev) => [user, ...prev]);
          setAddOpen(false);
        }}
      />
    </>
  );
}

function AddUserModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (user: AdminUser) => void;
}) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminUserRole>('USER');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoginId('');
      setPassword('');
      setName('');
      setEmail('');
      setRole('USER');
      setError(null);
      setBusy(false);
    }
  }, [open]);

  async function submit(): Promise<void> {
    setBusy(true);
    setError(null);

    try {
      const created = await createAdminUser({ loginId, password, name, email, role });

      onCreated(created);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : '만들지 못했어요');
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="사용자 추가"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            loading={busy}
            disabled={loginId.trim() === '' || password === ''}
            onClick={() => {
              void submit();
            }}
          >
            추가
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <TextField
          label="아이디"
          value={loginId}
          onChange={(e) => {
            setLoginId(e.target.value);
          }}
        />
        <TextField
          label="비밀번호"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
          }}
        />
        <TextField
          label="이름"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
        <TextField
          label="이메일"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
          }}
        />
        <Select
          label="역할"
          value={role}
          onChange={(e) => {
            setRole(e.target.value === 'ADMIN' ? 'ADMIN' : 'USER');
          }}
        >
          <option value="USER">일반</option>
          <option value="ADMIN">관리자</option>
        </Select>
        {error !== null && <Alert variant="danger">{error}</Alert>}
      </div>
    </Modal>
  );
}
