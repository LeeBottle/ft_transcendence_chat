'use client';

import { useEffect, useMemo, useState } from 'react';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Spinner from '@/components/ui/Spinner';
import {
  deleteAdminRoom,
  fetchAdminRooms,
  updateAdminRoomTitle,
  type AdminRoom,
} from '@/features/admin/adminApi';
import AdminTopbar from '@/features/admin/AdminTopbar';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date(iso));
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [pendingDelete, setPendingDelete] = useState<AdminRoom | null>(null);

  async function load(): Promise<void> {
    try {
      setError(null);
      setRooms(await fetchAdminRooms());
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
      return rooms;
    }

    return rooms.filter((r) => r.title.toLowerCase().includes(q) || r.id.includes(q));
  }, [rooms, search]);

  async function saveTitle(room: AdminRoom): Promise<void> {
    const next = draftTitle.trim();

    if (next === '' || next === room.title) {
      setEditingId(null);

      return;
    }

    setBusyId(room.id);
    setError(null);

    try {
      await updateAdminRoomTitle(room.id, next);
      setRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, title: next } : r)));
      setEditingId(null);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : '이름을 바꾸지 못했어요');
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
      await deleteAdminRoom(target.id);
      setRooms((prev) => prev.filter((r) => r.id !== target.id));
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : '삭제하지 못했어요');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <AdminTopbar
        icon="message"
        title="채팅방 관리"
        trailing={`총 ${rooms.length}개`}
      />

      <div className="flex items-center gap-2 px-6 pt-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          placeholder="채팅방 이름, ID 검색…"
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
                <th className="px-3 py-2.5">ID</th>
                <th className="px-3 py-2.5">채팅방 이름</th>
                <th className="px-3 py-2.5">생성자</th>
                <th className="px-3 py-2.5">멤버 수</th>
                <th className="px-3 py-2.5">생성일</th>
                <th className="px-3 py-2.5 text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const busy = busyId === r.id;
                const editing = editingId === r.id;

                return (
                  <tr
                    key={r.id}
                    className="border-border hover:bg-surface-muted border-b"
                  >
                    <td className="text-text-muted px-3 py-2.5 font-mono text-xs">{r.id}</td>
                    <td className="text-text px-3 py-2.5">
                      {editing ? (
                        <input
                          autoFocus
                          value={draftTitle}
                          maxLength={100}
                          onChange={(e) => {
                            setDraftTitle(e.target.value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              void saveTitle(r);
                            } else if (e.key === 'Escape') {
                              setEditingId(null);
                            }
                          }}
                          className="border-primary-ring bg-primary-soft h-8 w-full rounded border px-2 text-sm outline-none"
                        />
                      ) : (
                        r.title
                      )}
                    </td>
                    <td className="text-text-muted px-3 py-2.5 font-mono text-xs">
                      {r.creatorLoginId}
                    </td>
                    <td className="text-text-muted px-3 py-2.5">{r.memberCount}명</td>
                    <td className="text-text-muted px-3 py-2.5">{formatDate(r.createdAt)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-center gap-1.5">
                        {editing ? (
                          <>
                            <Button
                              size="sm"
                              loading={busy}
                              onClick={() => {
                                void saveTitle(r);
                              }}
                            >
                              저장
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingId(null);
                              }}
                            >
                              취소
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busy}
                              onClick={() => {
                                setDraftTitle(r.title);
                                setEditingId(r.id);
                              }}
                            >
                              이름 수정
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={busy}
                              onClick={() => {
                                setPendingDelete(r);
                              }}
                            >
                              삭제
                            </Button>
                          </>
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
            {rooms.length === 0 ? '채팅방이 없어요.' : '검색 결과가 없어요.'}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="채팅방을 삭제할까요?"
        description={
          pendingDelete === null ? undefined : `#${pendingDelete.id} ${pendingDelete.title}`
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
    </>
  );
}
