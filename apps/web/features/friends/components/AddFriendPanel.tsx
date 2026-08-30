'use client';

// 디스코드 "친구 추가하기" 패널 차용.
// 디스코드는 정확한 사용자명을 입력하지만, 우리는 검색 API(GET /api/users?q=)가 있으니
// 입력 즉시 검색해서 결과를 보여주고 각 행에서 바로 추가한다.
import { useEffect, useRef, useState } from 'react';

import Avatar from '@/components/Avatar';
import { addFriend } from '@/features/friends/friendsApi';
import { searchUsers, type UserSearchResult } from '@/features/room/roomApi';

interface AddFriendPanelProps {
  friendIds: string[]; // 이미 친구인 user id — 결과에서 "친구" 로 표시
  onAdded: () => void; // 추가 성공 시 목록 새로고침
}

function addButtonLabel(alreadyFriend: boolean, busy: boolean): string {
  if (alreadyFriend) {
    return '친구';
  }

  if (busy) {
    return '추가 중…';
  }

  return '친구 추가';
}

export default function AddFriendPanel({ friendIds, onAdded }: AddFriendPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const reqId = useRef(0);

  const friendSet = new Set(friendIds);

  useEffect(() => {
    const q = query.trim();

    if (q === '') {
      setResults([]);
      setLoading(false);

      return;
    }

    setLoading(true);

    const id = ++reqId.current;
    const timer = setTimeout(() => {
      void searchUsers(q)
        .then((list) => {
          if (id === reqId.current) {
            setResults(list);
          }
        })
        .catch(() => {
          if (id === reqId.current) {
            setResults([]);
          }
        })
        .finally(() => {
          if (id === reqId.current) {
            setLoading(false);
          }
        });
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  async function handleAdd(user: UserSearchResult): Promise<void> {
    setBusyId(user.id);
    setError(null);

    try {
      await addFriend(user.id);
      setAddedIds((prev) => new Set(prev).add(user.id));
      onAdded();
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : '친구를 추가하지 못했어요');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-6 py-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-bold tracking-wide text-gray-800 uppercase">친구 추가하기</h2>
        <p className="text-xs text-gray-400">
          아이디나 이름으로 검색해서 친구를 추가할 수 있어요. 상대는 바로 친구 목록에 추가됩니다.
        </p>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
        }}
        placeholder="아이디 또는 이름으로 검색"
        className="h-11 rounded-lg border border-gray-300 px-3.5 text-sm outline-none focus:border-purple-400"
      />

      {error !== null && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex flex-col gap-1">
        {loading && <p className="px-1 py-2 text-xs text-gray-400">검색 중…</p>}

        {!loading && query.trim() !== '' && results.length === 0 && (
          <p className="px-1 py-2 text-xs text-gray-400">일치하는 사용자가 없어요.</p>
        )}

        {results.map((user) => {
          const alreadyFriend = friendSet.has(user.id) || addedIds.has(user.id);
          const busy = busyId === user.id;

          return (
            <div
              key={user.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50"
            >
              <Avatar
                name={user.name}
                imageUrl={user.profileImagePath}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
                <p className="truncate text-xs text-gray-400">{user.loginId}</p>
              </div>
              <button
                type="button"
                disabled={alreadyFriend || busy}
                onClick={() => {
                  void handleAdd(user);
                }}
                className={`h-8 shrink-0 rounded-lg px-3 text-xs font-medium transition-colors ${
                  alreadyFriend
                    ? 'cursor-default bg-gray-100 text-gray-400'
                    : 'cursor-pointer bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-60'
                }`}
              >
                {addButtonLabel(alreadyFriend, busy)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
