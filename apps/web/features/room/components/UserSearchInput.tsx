'use client';

// 유저 검색 입력 — 타이핑하면 GET /api/users?q= 로 검색, 결과를 드롭다운으로 보여주고 고르면 onPick.
// 방 생성 폼 / 방 관리 모달에서 공용으로 씀.
import { useEffect, useRef, useState } from 'react';

import { searchUsers, type UserSearchResult } from '@/features/room/roomApi';

interface UserSearchInputProps {
  onPick: (user: UserSearchResult) => void;
  /** 이미 선택했거나 멤버인 유저 id — 결과에서 숨김 */
  excludeIds?: string[];
  placeholder?: string;
  disabled?: boolean;
}

export default function UserSearchInput({
  onPick,
  excludeIds = [],
  placeholder = '아이디 또는 이름으로 검색',
  disabled = false,
}: UserSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const excludeSet = new Set(excludeIds);

  const reqId = useRef(0);

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

  const visible = results.filter((u) => !excludeSet.has(u.id));

  return (
    <div className="relative">
      <input
        value={query}
        disabled={disabled}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
        }}
        onBlur={() => {
          // 클릭이 먼저 처리되도록 약간 지연
          setTimeout(() => {
            setOpen(false);
          }, 150);
        }}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400 disabled:cursor-not-allowed disabled:bg-gray-50"
      />

      {open && query.trim() !== '' && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {loading && <div className="px-3 py-2 text-xs text-gray-400">검색 중…</div>}
          {!loading && visible.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-400">결과가 없어요</div>
          )}
          {visible.map((u) => (
            <button
              key={u.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={() => {
                onPick(u);
                setQuery('');
                setResults([]);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-semibold text-purple-600">
                {u.name.slice(0, 1)}
              </span>
              <span className="flex-1 truncate text-gray-800">{u.name}</span>
              <span className="shrink-0 font-mono text-[11px] text-gray-400">{u.loginId}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
