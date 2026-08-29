'use client';

// RoomManageModal.tsx
// 채팅방 관리 — 주제 / 비밀번호 / 멤버(강퇴·차단·권한) / 차단 목록 / 방 나가기 / 방 삭제
// 목업에 없는 화면이라 신규 디자인. 권한(방장/운영자/일반)에 따라 버튼을 노출한다.
import { useEffect, useState } from 'react';

import {
  banMember,
  deleteRoom,
  fetchBans,
  kickMember,
  leaveRoom,
  unbanMember,
  updateMemberRole,
  updateRoomPassword,
  updateRoomTopic,
  type BannedMember,
} from '@/features/room/roomApi';
import type { Room, RoomMember } from '@/features/room/types';

interface RoomManageModalProps {
  room: Room;
  myUserId: string | null;
  onClose: () => void;
  /** 액션 성공 후 방 목록을 다시 불러온다 */
  onChanged: () => void | Promise<void>;
  /** 방을 나갔거나 삭제한 뒤 (모달 닫고 선택 해제) */
  onLeftRoom: () => void;
}

function isOwnerRole(role: string): boolean {
  return role === 'OWNER' || role === 'FOUNDER' || role === 'HOST';
}

function isManagerRole(role: string): boolean {
  return role === 'MANAGER' || role === 'OPERATOR';
}

function roleLabel(role: string): string {
  if (isOwnerRole(role)) {
    return '방장';
  }
  if (isManagerRole(role)) {
    return '운영자';
  }

  return '멤버';
}

type ApiRole = 'FOUNDER' | 'OPERATOR' | 'USER';

function roleToApi(role: string): ApiRole {
  if (isOwnerRole(role)) {
    return 'FOUNDER';
  }
  if (isManagerRole(role)) {
    return 'OPERATOR';
  }

  return 'USER';
}

export default function RoomManageModal({
  room,
  myUserId,
  onClose,
  onChanged,
  onLeftRoom,
}: RoomManageModalProps) {
  const members = room.members ?? [];
  const myMember = members.find((m) => m.userId === myUserId);
  const iAmOwner =
    (myMember !== undefined && isOwnerRole(myMember.role)) ||
    (myUserId !== null && room.creatorUserId === myUserId);
  const iAmManager = myMember !== undefined && isManagerRole(myMember.role);
  const canModerate = iAmOwner || iAmManager;

  const [topicInput, setTopicInput] = useState(room.topic ?? '');
  const [pwInput, setPwInput] = useState('');
  const [bans, setBans] = useState<BannedMember[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!canModerate) {
      return;
    }

    let alive = true;

    void fetchBans(room.id)
      .then((list) => {
        if (alive) {
          setBans(list);
        }
      })
      .catch(() => {
        // 차단 목록 실패는 조용히 무시 (핵심 기능 아님)
      });

    return () => {
      alive = false;
    };
  }, [room.id, canModerate]);

  async function run(key: string, action: () => Promise<void>, successMsg: string): Promise<void> {
    setBusy(key);
    setError(null);
    setNotice(null);

    try {
      await action();
      await onChanged();

      if (canModerate) {
        setBans(await fetchBans(room.id));
      }

      setNotice(successMsg);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : '처리하지 못했어요.');
    } finally {
      setBusy(null);
    }
  }

  async function handleLeave(): Promise<void> {
    if (myUserId === null) {
      return;
    }

    setBusy('leave');
    setError(null);

    try {
      await leaveRoom(room.id, myUserId);
      await onChanged();
      onLeftRoom();
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : '나가지 못했어요.');
      setBusy(null);
    }
  }

  async function handleDelete(): Promise<void> {
    setBusy('delete');
    setError(null);

    try {
      await deleteRoom(room.id);
      await onChanged();
      onLeftRoom();
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : '삭제하지 못했어요.');
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-[460px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex h-[50px] shrink-0 items-center border-b border-gray-100 px-5">
          <span className="flex-1 text-sm font-semibold text-gray-900">방 관리 · {room.name}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-gray-400 hover:bg-gray-50"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
          {error !== null && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}
          {notice !== null && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">{notice}</p>
          )}

          {/* 주제 — 방장/운영자 */}
          {canModerate ? (
            <section className="flex flex-col gap-1.5">
              <label
                htmlFor="rm-topic"
                className="text-xs font-semibold text-gray-700"
              >
                방 주제
              </label>
              <div className="flex gap-1.5">
                <input
                  id="rm-topic"
                  value={topicInput}
                  onChange={(e) => {
                    setTopicInput(e.target.value);
                  }}
                  maxLength={200}
                  placeholder="예: 3분기 스프린트 회의"
                  className="h-9 flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  disabled={busy !== null || topicInput.trim() === (room.topic ?? '')}
                  onClick={() => {
                    void run(
                      'topic',
                      async () => {
                        await updateRoomTopic(room.id, topicInput.trim());
                      },
                      '주제를 변경했어요.',
                    );
                  }}
                  className="h-9 shrink-0 cursor-pointer rounded-lg bg-purple-500 px-3 text-sm text-white hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  저장
                </button>
              </div>
            </section>
          ) : (
            room.topic !== null &&
            room.topic !== undefined &&
            room.topic !== '' && (
              <section className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-700">방 주제</span>
                <span className="text-sm text-gray-600">{room.topic}</span>
              </section>
            )
          )}

          {/* 비밀번호 — 방장 전용 */}
          {iAmOwner && (
            <section className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-700">
                비밀번호 {room.hasPassword === true ? '(설정됨)' : '(공개방)'}
              </span>
              <div className="flex gap-1.5">
                <input
                  value={pwInput}
                  onChange={(e) => {
                    setPwInput(e.target.value);
                  }}
                  maxLength={12}
                  type="password"
                  placeholder="새 비밀번호 (최대 12자)"
                  className="h-9 flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  disabled={busy !== null || pwInput.trim() === ''}
                  onClick={() => {
                    void run(
                      'pw',
                      async () => {
                        await updateRoomPassword(room.id, pwInput.trim());
                      },
                      '비밀번호를 설정했어요.',
                    ).then(() => {
                      setPwInput('');
                    });
                  }}
                  className="h-9 shrink-0 cursor-pointer rounded-lg bg-purple-500 px-3 text-sm text-white hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  설정
                </button>
                {room.hasPassword === true && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => {
                      void run(
                        'pw',
                        async () => {
                          await updateRoomPassword(room.id, null);
                        },
                        '비밀번호를 해제했어요 (공개방).',
                      );
                    }}
                    className="h-9 shrink-0 cursor-pointer rounded-lg border border-gray-300 px-3 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    해제
                  </button>
                )}
              </div>
            </section>
          )}

          {/* 멤버 목록 */}
          <section className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-700">멤버 ({members.length})</span>
            <div className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200">
              {members.map((m) => (
                <MemberRow
                  key={m.userId}
                  member={m}
                  isSelf={m.userId === myUserId}
                  iAmOwner={iAmOwner}
                  canModerate={canModerate}
                  busy={busy}
                  onKick={() => {
                    void run(
                      `kick:${m.userId}`,
                      async () => {
                        await kickMember(room.id, m.userId);
                      },
                      `${m.name} 님을 강퇴했어요.`,
                    );
                  }}
                  onBan={() => {
                    void run(
                      `ban:${m.userId}`,
                      async () => {
                        await banMember(room.id, m.userId);
                      },
                      `${m.name} 님을 차단했어요.`,
                    );
                  }}
                  onRole={(role) => {
                    void run(
                      `role:${m.userId}`,
                      async () => {
                        await updateMemberRole(room.id, m.userId, role);
                      },
                      `${m.name} 님의 권한을 바꿨어요.`,
                    );
                  }}
                />
              ))}
            </div>
          </section>

          {/* 차단 목록 — 방장/운영자 */}
          {canModerate && bans.length > 0 && (
            <section className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-700">
                차단된 사용자 ({bans.length})
              </span>
              <div className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200">
                {bans.map((b) => (
                  <div
                    key={b.userId}
                    className="flex items-center gap-2 px-3 py-2 text-sm"
                  >
                    <span className="flex-1 truncate text-gray-700">{b.name}</span>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => {
                        void run(
                          `unban:${b.userId}`,
                          async () => {
                            await unbanMember(room.id, b.userId);
                          },
                          `${b.name} 님 차단을 해제했어요.`,
                        );
                      }}
                      className="h-7 cursor-pointer rounded-md bg-gray-100 px-2.5 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                    >
                      차단 해제
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 방 나가기 / 삭제 */}
          <section className="flex gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => {
                void handleLeave();
              }}
              className="h-9 flex-1 cursor-pointer rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {busy === 'leave' ? '나가는 중…' : '방 나가기'}
            </button>
            {iAmOwner && (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => {
                  void handleDelete();
                }}
                className="h-9 flex-1 cursor-pointer rounded-lg border border-red-200 bg-red-50 text-sm text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                {busy === 'delete' ? '삭제 중…' : '방 삭제'}
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

interface MemberRowProps {
  member: RoomMember;
  isSelf: boolean;
  iAmOwner: boolean;
  canModerate: boolean;
  busy: string | null;
  onKick: () => void;
  onBan: () => void;
  onRole: (role: ApiRole) => void;
}

function MemberRow({
  member,
  isSelf,
  iAmOwner,
  canModerate,
  busy,
  onKick,
  onBan,
  onRole,
}: MemberRowProps) {
  const targetIsPrivileged = isOwnerRole(member.role) || isManagerRole(member.role);
  // 운영자는 방장/운영자를 강퇴·차단할 수 없음 (백엔드와 동일 규칙)
  const showKickBan = !isSelf && canModerate && (iAmOwner || !targetIsPrivileged);
  const showRole = !isSelf && iAmOwner;

  return (
    <div className="flex items-center gap-2 px-3 py-2 text-sm">
      <span className="flex-1 truncate text-gray-800">
        {member.name}
        {isSelf && <span className="ml-1 text-xs text-gray-400">(나)</span>}
      </span>

      {showRole ? (
        <select
          value={roleToApi(member.role)}
          disabled={busy !== null}
          onChange={(e) => {
            onRole(e.target.value as ApiRole);
          }}
          className="h-7 rounded-md border border-gray-300 bg-white px-1.5 text-xs outline-none focus:border-purple-400 disabled:opacity-50"
        >
          <option value="FOUNDER">방장</option>
          <option value="OPERATOR">운영자</option>
          <option value="USER">멤버</option>
        </select>
      ) : (
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">
          {roleLabel(member.role)}
        </span>
      )}

      {showKickBan && (
        <>
          <button
            type="button"
            disabled={busy !== null}
            onClick={onKick}
            className="h-7 cursor-pointer rounded-md bg-gray-100 px-2 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            강퇴
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={onBan}
            className="h-7 cursor-pointer rounded-md bg-red-100 px-2 text-xs text-red-600 hover:bg-red-200 disabled:opacity-50"
          >
            차단
          </button>
        </>
      )}
    </div>
  );
}
