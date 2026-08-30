'use client';

// 친구 화면 — 디스코드 친구 탭 디자인 차용.
// 탭: 온라인 / 전체 / 친구 추가하기
// (디스코드의 "대기 중"·"차단됨" 탭은 백엔드에 친구요청/유저차단 API가 없어 제외 —
//  docs_yeom/0829_todos.md 5-A 참고)
import { useEffect, useMemo, useState } from 'react';

import Avatar from '@/components/Avatar';
import ConfirmDialog from '@/components/ConfirmDialog';
import AddFriendPanel from '@/features/friends/components/AddFriendPanel';
import { fetchFriends, removeFriend, type Friend } from '@/features/friends/friendsApi';

type Tab = 'online' | 'all' | 'add';

const LIST_TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'online', label: '온라인' },
  { id: 'all', label: '전체' },
];

function emptyText(friendCount: number, tab: Tab): string {
  if (friendCount === 0) {
    return '아직 친구가 없어요. "친구 추가하기"로 친구를 찾아보세요.';
  }

  if (tab === 'online') {
    return '온라인인 친구가 없어요.';
  }

  return '검색 결과가 없어요.';
}

export default function FriendsView() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('online');
  const [filter, setFilter] = useState('');
  const [pendingRemove, setPendingRemove] = useState<Friend | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function load(): Promise<void> {
    try {
      setError(null);
      setFriends(await fetchFriends());
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : '친구 목록을 불러오지 못했어요');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const online = useMemo(() => friends.filter((f) => f.isOnline), [friends]);

  const visible = useMemo(() => {
    const base = tab === 'online' ? online : friends;
    const q = filter.trim().toLowerCase();

    if (q === '') {
      return base;
    }

    return base.filter(
      (f) => f.name.toLowerCase().includes(q) || f.loginId.toLowerCase().includes(q),
    );
  }, [tab, online, friends, filter]);

  async function confirmRemove(): Promise<void> {
    if (pendingRemove === null) {
      return;
    }

    const target = pendingRemove;

    setPendingRemove(null);
    setRemovingId(target.id);

    try {
      await removeFriend(target.id);
      setFriends((prev) => prev.filter((f) => f.id !== target.id));
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : '친구를 삭제하지 못했어요');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* 상단 바 */}
      <div className="flex h-14 shrink-0 items-center gap-1 border-b border-gray-200 px-4">
        <span className="mr-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <span aria-hidden>👥</span> 친구
        </span>
        <div className="mx-1 h-5 w-px bg-gray-200" />

        {LIST_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
            }}
            className={`h-8 cursor-pointer rounded-md px-3 text-sm transition-colors ${
              tab === t.id
                ? 'bg-gray-100 font-medium text-gray-900'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t.label}
            {t.id === 'online' && online.length > 0 && (
              <span className="ml-1 text-xs text-gray-400">{online.length}</span>
            )}
          </button>
        ))}

        <button
          onClick={() => {
            setTab('add');
          }}
          className={`ml-2 h-8 cursor-pointer rounded-md px-3 text-sm font-medium text-white transition-colors ${
            tab === 'add' ? 'bg-green-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          친구 추가하기
        </button>
      </div>

      {tab === 'add' ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AddFriendPanel
            friendIds={friends.map((f) => f.id)}
            onAdded={() => {
              void load();
            }}
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* 검색 */}
          <div className="px-6 pt-4 pb-2">
            <input
              type="text"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
              }}
              placeholder="검색"
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-purple-400 focus:bg-white"
            />
          </div>

          {error !== null && <p className="px-6 py-2 text-xs text-red-500">{error}</p>}

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <p className="px-1 py-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              {tab === 'online' ? '온라인' : '전체 친구'} — {visible.length}
            </p>

            {loading && <p className="px-1 py-4 text-sm text-gray-400">불러오는 중…</p>}

            {!loading && visible.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <span
                  className="text-3xl"
                  aria-hidden
                >
                  🙃
                </span>
                <p className="text-sm text-gray-400">{emptyText(friends.length, tab)}</p>
              </div>
            )}

            <ul className="flex flex-col">
              {visible.map((f) => (
                <li
                  key={f.id}
                  className="group flex items-center gap-3 border-t border-gray-100 py-2.5 first:border-t-0"
                >
                  <div className="relative shrink-0">
                    <Avatar
                      name={f.name}
                      imageUrl={f.profileImagePath}
                      size="sm"
                    />
                    <span
                      className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white ${
                        f.isOnline ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      title={f.isOnline ? '온라인' : '오프라인'}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{f.name}</p>
                    <p className="truncate text-xs text-gray-400">
                      {f.loginId} · {f.isOnline ? '온라인' : '오프라인'}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={removingId === f.id}
                    onClick={() => {
                      setPendingRemove(f);
                    }}
                    className="h-8 shrink-0 rounded-lg border border-gray-200 px-3 text-xs text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                  >
                    {removingId === f.id ? '삭제 중…' : '친구 삭제'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingRemove !== null}
        title="친구를 삭제할까요?"
        description={
          pendingRemove === null
            ? undefined
            : `${pendingRemove.name} 님을 친구 목록에서 제거합니다.`
        }
        confirmLabel="삭제"
        danger
        onConfirm={() => {
          void confirmRemove();
        }}
        onCancel={() => {
          setPendingRemove(null);
        }}
      />
    </div>
  );
}
