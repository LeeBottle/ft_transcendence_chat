'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';

import { useRouter } from 'next/navigation';

import { io, type Socket } from 'socket.io-client';

import {
  createMockJwtToken,
  DEFAULT_USER,
  getStoredActiveUser,
  getStoredDeletedRoomIds,
  getStoredRooms,
  getStoredVerifiedRooms,
  saveStoredActiveUser,
  saveStoredDeletedRoomId,
  saveStoredRooms,
  saveStoredVerifiedRoom,
  TEMP_USERS,
  type ChatRoom,
  type ChatRoomMember,
  type RoomType,
  type TempUser,
} from './types';

export default function ChatListPage() {
  const router = useRouter();

  const [selectedUser, setSelectedUser] = useState<TempUser>(DEFAULT_USER);
  const [roomTitle, setRoomTitle] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [apiLog, setApiLog] = useState<string>('');
  const [useRealApi, setUseRealApi] = useState<boolean>(true);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [isPrivateRoom, setIsPrivateRoom] = useState<boolean>(false);
  const [roomPassword, setRoomPassword] = useState<string>('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const queryUser =
        searchParams.get('userId') || searchParams.get('loginId') || searchParams.get('user');

      if (queryUser) {
        const found = TEMP_USERS.find(
          (u) => u.id === queryUser || u.loginId === queryUser,
        );

        if (found) {
          setSelectedUser(found);
          saveStoredActiveUser(found);
        } else {
          setSelectedUser(getStoredActiveUser());
        }
      } else {
        setSelectedUser(getStoredActiveUser());
      }
    } else {
      setSelectedUser(getStoredActiveUser());
    }

    setRooms(getStoredRooms());
  }, []);

  const fetchBackendRooms = () => {
    logApi('GET /api/chat/rooms (요청)', { userId: selectedUser.id });

    // 최신 로컬스토리지 데이터를 re-read하여 탭 간/로컬 상태 동기화 보장
    const storedRooms = getStoredRooms();

    void (async () => {
      let apiRooms: ChatRoom[] = [];

      try {
        const token = createMockJwtToken(selectedUser);
        const response = await fetch(`${apiUrl}/api/chat/rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = (await response.json()) as unknown[];

          logApi('GET /api/chat/rooms (응답 데이터)', data);

          if (Array.isArray(data)) {
            apiRooms = data.map((r: any) => ({
              id: r.id,
              title: r.title,
              type: r.type,
              hostId: r.creatorUserId,
              creatorUserId: r.creatorUserId,
              members: Array.isArray(r.members)
                ? r.members.map((m: any) => {
                    const matchedUser = TEMP_USERS.find(
                      (u) =>
                        u.id === m.userId ||
                        u.loginId === m.loginId ||
                        u.loginId === m.user?.loginId,
                    );

                    return {
                      userId: m.userId,
                      loginId: m.loginId ?? m.user?.loginId ?? matchedUser?.loginId ?? m.userId,
                      name: m.name ?? m.user?.name ?? matchedUser?.name ?? `사용자 ${m.userId}`,
                      role:
                        m.role === 'FOUNDER' ||
                        m.role === 'OWNER' ||
                        m.role === 'HOST' ||
                        m.userId === r.creatorUserId
                          ? ('FOUNDER' as const)
                          : m.role === 'OPERATOR' || m.role === 'MANAGER'
                            ? ('OPERATOR' as const)
                            : ('USER' as const),
                    };
                  })
                : [],
              hasPassword: r.hasPassword ?? r.isPrivate ?? false,
              isPrivate: r.isPrivate ?? r.hasPassword ?? false,
              createdAt: r.createdAt,
              closedAt: r.closedAt,
            }));
          }
        }
      } catch (error) {
        logApi(
          'GET /api/chat/rooms (실패)',
          error instanceof Error ? error.message : '알 수 없는 오류',
        );
      }

      setRooms((prev) => {
        const deletedIds = getStoredDeletedRoomIds();
        const storedRooms = getStoredRooms();
        const map = new Map<string, ChatRoom>();

        // 1. 백엔드 API가 반환한 사용자의 활성 방을 최신 기준 데이터로 반영
        for (const room of apiRooms) {
          map.set(room.id, room);
        }

        // 2. 백엔드에 전송되지 않은 클라이언트 전용 임시 방(room-..., temp-...) 중 삭제되지 않은 것만 유지
        const localTempRooms = [...storedRooms, ...prev].filter(
          (r) =>
            !deletedIds.includes(r.id) &&
            (r.id.startsWith('room-') || r.id.startsWith('temp-')),
        );

        for (const room of localTempRooms) {
          if (!map.has(room.id)) {
            map.set(room.id, room);
          }
        }

        const updated = Array.from(map.values());

        saveStoredRooms(updated);

        return updated;
      });
    })();
  };

  useEffect(() => {
    if (useRealApi) {
      fetchBackendRooms();
    }
  }, [selectedUser.id, useRealApi]);

  // Socket.IO 실시간 연결 및 room_updated, session_ended, room_created 이벤트 수신
  useEffect(() => {
    const token = createMockJwtToken(selectedUser);
    const socket: Socket = io(`${apiUrl}/chat`, {
      auth: { token },
      extraHeaders: { Authorization: `Bearer ${token}` },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      logApi('목록 페이지 소켓 실시간 연결 성공', { socketId: socket.id, userId: selectedUser.id });
    });

    socket.on('disconnect', (reason: string) => {
      setSocketConnected(false);
      logApi('목록 페이지 소켓 연결 끊김', { reason });
    });

    socket.on('room_created', (data: unknown) => {
      logApi('소켓 이벤트 수신 (room_created)', data);
      fetchBackendRooms();
    });

    socket.on('room_updated', (data: any) => {
      logApi('소켓 이벤트 수신 (room_updated)', data);

      const targetRoomId = data?.roomId;
      const closedTime = data?.closedAt ?? new Date().toISOString();

      if (targetRoomId) {
        setRooms((prevRooms) => {
          const updated = prevRooms.map((r) => {
            if (r.id === targetRoomId) {
              return { ...r, closedAt: closedTime };
            }
            return r;
          });
          saveStoredRooms(updated);
          return updated;
        });
      }

      fetchBackendRooms();
    });

    socket.on('session_ended', (data: any) => {
      logApi('소켓 이벤트 수신 (session_ended)', data);

      const targetRoomId = data?.roomId;
      const closedTime = data?.timestamp ?? new Date().toISOString();

      if (targetRoomId) {
        setRooms((prevRooms) => {
          const updated = prevRooms.map((r) => {
            if (r.id === targetRoomId) {
              return { ...r, closedAt: closedTime };
            }
            return r;
          });
          saveStoredRooms(updated);
          return updated;
        });
      }

      fetchBackendRooms();
    });

    socket.on('room_deleted', (data: any) => {
      logApi('소켓 이벤트 수신 (room_deleted)', data);

      const targetRoomId = data?.roomId;

      if (targetRoomId) {
        saveStoredDeletedRoomId(targetRoomId);

        setRooms((prevRooms) => {
          const updated = prevRooms.filter((r) => r.id !== targetRoomId);
          saveStoredRooms(updated);
          return updated;
        });
      }

      fetchBackendRooms();
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedUser.id, apiUrl]);

  const logApi = (action: string, data: unknown) => {
    const timestamp = new Date().toLocaleTimeString();

    setApiLog((prev) => `[${timestamp}] ${action}\n${JSON.stringify(data, null, 2)}\n\n${prev}`);
  };

  const handleUserChange = (user: TempUser) => {
    setSelectedUser(user);
    saveStoredActiveUser(user);
    setSelectedMemberIds([]);
    const latestStored = getStoredRooms();
    setRooms(latestStored);
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  // 1. 채팅방 생성 처리 및 페이지 이동 (/chat/[roomId])
  const handleCreateRoomSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!roomTitle.trim()) {
      return;
    }

    void (async () => {
      const hostMember: ChatRoomMember = {
        userId: selectedUser.id,
        loginId: selectedUser.loginId,
        name: selectedUser.name,
        role: 'FOUNDER',
      };

      const otherMembers: ChatRoomMember[] = TEMP_USERS.filter(
        (u) => u.id !== selectedUser.id && selectedMemberIds.includes(u.id),
      ).map((u) => ({
        userId: u.id,
        loginId: u.loginId,
        name: u.name,
        role: 'USER',
      }));

      const allMembers = [hostMember, ...otherMembers];

      const apiPayload = {
        title: roomTitle,
        memberUserIds: selectedMemberIds,
        ...(isPrivateRoom && roomPassword.trim()
          ? { password: roomPassword.trim().slice(0, 12) }
          : {}),
      };

      logApi('POST /api/chat/rooms (요청)', apiPayload);

      let createdRoom: ChatRoom;

      if (useRealApi) {
        try {
          const token = createMockJwtToken(selectedUser);
          const response = await fetch(`${apiUrl}/api/chat/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(apiPayload),
          });

          if (response.ok) {
            const resData = (await response.json()) as any;

            logApi('POST /api/chat/rooms (응답 성공)', resData);

            createdRoom = {
              id: resData.id,
              title: resData.title,
              type: resData.type,
              hostId: resData.creatorUserId ?? selectedUser.id,
              creatorUserId: resData.creatorUserId ?? selectedUser.id,
              members: (() => {
                const mappedBackendMembers = Array.isArray(resData.members)
                  ? resData.members.map((m: any) => {
                      const matchedUser = TEMP_USERS.find(
                        (u) =>
                          u.id === m.userId ||
                          u.loginId === m.loginId ||
                          u.loginId === m.user?.loginId,
                      );

                      return {
                        userId: m.userId,
                        loginId: m.loginId ?? m.user?.loginId ?? matchedUser?.loginId ?? m.userId,
                        name: m.name ?? m.user?.name ?? matchedUser?.name ?? `사용자 ${m.userId}`,
                        role:
                          m.role === 'FOUNDER' ||
                          m.role === 'OWNER' ||
                          m.role === 'HOST' ||
                          m.userId === resData.creatorUserId
                            ? ('FOUNDER' as const)
                            : m.role === 'OPERATOR' || m.role === 'MANAGER'
                              ? ('OPERATOR' as const)
                              : ('USER' as const),
                      };
                    })
                  : [];

                const map = new Map<string, ChatRoomMember>();

                for (const m of allMembers) {
                  map.set(m.userId, m);
                  map.set(m.loginId, m);
                }

                for (const m of mappedBackendMembers) {
                  map.set(m.userId, m);

                  if (m.loginId) {
                    map.set(m.loginId, m);
                  }
                }

                return Array.from(new Set(map.values()));
              })(),
              hasPassword: resData.hasPassword ?? isPrivateRoom,
              isPrivate: resData.isPrivate ?? isPrivateRoom,
              createdAt: resData.createdAt ?? new Date().toISOString(),
              closedAt: resData.closedAt ?? null,
            };
          } else {
            throw new Error(`API 응답 실패 (${response.status})`);
          }
        } catch (error) {
          logApi('POST /api/chat/rooms (백엔드 미연결/임시 생성)', {
            error: error instanceof Error ? error.message : '알 수 없는 오류',
            fallbackRoom: apiPayload,
          });

          createdRoom = {
            id: `room-${Date.now()}`,
            title: roomTitle,
            hasPassword: isPrivateRoom,
            isPrivate: isPrivateRoom,
            hostId: selectedUser.id,
            members: allMembers,
            createdAt: new Date().toISOString(),
          };
        }
      } else {
        createdRoom = {
          id: `room-${Date.now()}`,
          title: roomTitle,
          hasPassword: isPrivateRoom,
          isPrivate: isPrivateRoom,
          hostId: selectedUser.id,
          members: allMembers,
          createdAt: new Date().toISOString(),
        };
      }

      const updatedRooms = [createdRoom, ...rooms];

      saveStoredVerifiedRoom(selectedUser.id, createdRoom.id);

      setRooms(updatedRooms);
      saveStoredRooms(updatedRooms);
      setRoomTitle('');
      setRoomPassword('');
      setIsPrivateRoom(false);
      setSelectedMemberIds([]);

      // 생성 직후 생성된 채팅방 전용 페이지 (/chat/[roomId])로 이동
      router.push(`/chat/${createdRoom.id}`);
    })();
  };

  const handleEnterRoom = (room: ChatRoom) => {
    const isPrivate = Boolean(room.hasPassword || room.isPrivate);
    const verifiedRooms = getStoredVerifiedRooms(selectedUser.id);
    const isAlreadyVerified = verifiedRooms.includes(room.id);

    // 공개방이거나 이미 첫 방문 시 비밀번호 검증을 마친 경우 바로 입장
    if (!isPrivate || isAlreadyVerified) {
      router.push(`/chat/${room.id}`);
      return;
    }

    const inputPassword = prompt(`🔒 '${room.title}' 비공개방 비밀번호를 입력하세요 (최대 12자리):`);

    if (inputPassword === null) {
      return;
    }

    void (async () => {
      logApi(`POST /api/chat/rooms/${room.id}/verify-password (비밀번호 확인 요청)`, {
        roomId: room.id,
      });

      if (useRealApi) {
        try {
          const token = createMockJwtToken(selectedUser);
          const response = await fetch(`${apiUrl}/api/chat/rooms/${room.id}/verify-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ password: inputPassword }),
          });

          if (response.ok) {
            const resData = await response.json();
            logApi('비밀번호 확인 성공 (응답)', resData);
            saveStoredVerifiedRoom(selectedUser.id, room.id);
            router.push(`/chat/${room.id}`);
          } else {
            const errData = (await response.json().catch(() => ({}))) as any;
            alert(errData?.message ?? '채팅방 비밀번호가 일치하지 않습니다.');
          }
        } catch (error) {
          logApi(
            '비밀번호 확인 백엔드 연동 실패 (폴백 처리)',
            error instanceof Error ? error.message : '알 수 없는 오류',
          );
          saveStoredVerifiedRoom(selectedUser.id, room.id);
          router.push(`/chat/${room.id}`);
        }
      } else {
        saveStoredVerifiedRoom(selectedUser.id, room.id);
        router.push(`/chat/${room.id}`);
      }
    })();
  };

  // 2. 채팅방 삭제 (HOST 전용)
  const handleDeleteRoom = (roomId: string) => {
    void (async () => {
      logApi(`DELETE /api/chat/rooms/${roomId} (방장 삭제 요청)`, { roomId });

      if (useRealApi) {
        try {
          const token = createMockJwtToken(selectedUser);
          const response = await fetch(`${apiUrl}/api/chat/rooms/${roomId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            logApi(`DELETE /api/chat/rooms/${roomId} (응답 성공)`, { roomId });
          } else {
            const errData = (await response.json()) as any;
            logApi(`DELETE /api/chat/rooms/${roomId} (삭제 실패/권한 거부)`, errData);
            alert(errData?.message ?? '채팅방 방장(HOST)만 채팅방을 삭제할 수 있습니다.');
            return;
          }
        } catch (error) {
          logApi(
            `DELETE /api/chat/rooms/${roomId} (백엔드 미연결/임시 삭제)`,
            error instanceof Error ? error.message : '알 수 없는 오류',
          );
        }
      }

      saveStoredDeletedRoomId(roomId);

      setRooms((prevRooms) => {
        const updated = prevRooms.filter((r) => r.id !== roomId);
        saveStoredRooms(updated);
        return updated;
      });
    })();
  };

  // 3. 채팅방 퇴장 (MEMBER 전용: 본인만 참여 멤버에서 빠짐)
  const handleLeaveRoom = (roomId: string) => {
    void (async () => {
      logApi(`DELETE /api/chat/rooms/${roomId}/members/${selectedUser.id} (멤버 퇴장 요청)`, {
        roomId,
        userId: selectedUser.id,
      });

      if (useRealApi) {
        try {
          const token = createMockJwtToken(selectedUser);
          const response = await fetch(
            `${apiUrl}/api/chat/rooms/${roomId}/members/${selectedUser.id}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (response.ok) {
            logApi(`DELETE /api/chat/rooms/${roomId}/members/${selectedUser.id} (퇴장 성공)`, {
              roomId,
            });
          }
        } catch (error) {
          logApi(
            `DELETE /api/chat/rooms/${roomId}/members/${selectedUser.id} (퇴장 폴백)`,
            error instanceof Error ? error.message : '알 수 없는 오류',
          );
        }
      }

      setRooms((prevRooms) => {
        const updated = prevRooms.map((r) => {
          if (r.id === roomId) {
            return {
              ...r,
              members: r.members.filter(
                (m) =>
                  m.userId !== selectedUser.id &&
                  m.loginId !== selectedUser.loginId &&
                  m.name !== selectedUser.name,
              ),
            };
          }
          return r;
        });

        saveStoredRooms(updated);
        return updated;
      });
    })();
  };



  // 현재 선택된 사용자 계정이 참여자로 속해 있는 방 목록 필터링
  const userRooms = rooms.filter(
    (room) =>
      room.members.some(
        (m) =>
          m.userId === selectedUser.id ||
          m.loginId === selectedUser.loginId ||
          m.name === selectedUser.name ||
          m.userId === selectedUser.loginId ||
          m.loginId === selectedUser.id ||
          (selectedUser.id === '3' && (m.userId === '3' || m.loginId === 'c')) ||
          (selectedUser.id === '2' && (m.userId === '2' || m.loginId === 'b')) ||
          (selectedUser.id === '1' && (m.userId === '1' || m.loginId === 'a')),
      ) ||
      room.creatorUserId === selectedUser.id ||
      room.hostId === selectedUser.id,
  );

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'sans-serif',
        color: '#000',
        background: '#fff',
      }}
    >
      <header
        style={{ borderBottom: '1px solid #000', paddingBottom: '12px', marginBottom: '20px' }}
      >
        <div style={{ fontSize: '12px', marginBottom: '4px' }}>[단계 0] 임시 테스트 페이지</div>
        <h1 style={{ margin: '0 0 12px 0', fontSize: '22px' }}>채팅방 목록 및 생성</h1>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid #000',
            padding: '8px 12px',
          }}
        >
          <label
            htmlFor="user-select"
            style={{ fontSize: '14px' }}
          >
            접속 계정 선택:
          </label>
          <select
            id="user-select"
            value={selectedUser.loginId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              const u = TEMP_USERS.find((user) => user.loginId === e.target.value);

              if (u) {
                handleUserChange(u);
              }
            }}
            style={{ padding: '4px 8px', fontSize: '14px', border: '1px solid #000' }}
          >
            {TEMP_USERS.map((user) => (
              <option
                key={user.id}
                value={user.loginId}
              >
                {user.name} ({user.loginId})
              </option>
            ))}
          </select>
          <span style={{ fontSize: '12px', color: '#444', marginLeft: 'auto' }}>
            소켓 상태: {socketConnected ? '연결됨 (ON)' : '연결 해제 (OFF)'} | 선택 계정이 방 생성 시 FOUNDER가 되며, 초대받은 방도 목록에 표시됩니다.
          </span>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          {/* 채팅방 생성 폼 */}
          <section style={{ border: '1px solid #000', padding: '12px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
              새 채팅방 생성 (FOUNDER: {selectedUser.name})
            </h3>
            <form onSubmit={handleCreateRoomSubmit}>
              <div style={{ marginBottom: '8px' }}>
                <label
                  htmlFor="room-title"
                  style={{ display: 'block', marginBottom: '2px', fontSize: '13px' }}
                >
                  방 제목:
                </label>
                <input
                  id="room-title"
                  type="text"
                  value={roomTitle}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setRoomTitle(e.target.value);
                  }}
                  placeholder="방 제목 입력"
                  required
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    boxSizing: 'border-box',
                    border: '1px solid #000',
                  }}
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <span style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                  공개 여부 (비밀번호 설정):
                </span>
                <label style={{ marginRight: '16px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="room-privacy"
                    checked={!isPrivateRoom}
                    onChange={() => {
                      setIsPrivateRoom(false);
                      setRoomPassword('');
                    }}
                  />
                  공개방 (비밀번호 없음)
                </label>
                <label style={{ fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="room-privacy"
                    checked={isPrivateRoom}
                    onChange={() => setIsPrivateRoom(true)}
                  />
                  비공개방 (비밀번호 설정)
                </label>
              </div>

              {isPrivateRoom && (
                <div style={{ marginBottom: '8px' }}>
                  <label
                    htmlFor="room-password"
                    style={{ display: 'block', marginBottom: '2px', fontSize: '13px' }}
                  >
                    비밀번호 (최대 12자리):
                  </label>
                  <input
                    id="room-password"
                    type="password"
                    maxLength={12}
                    value={roomPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setRoomPassword(e.target.value);
                    }}
                    placeholder="비밀번호 입력 (최대 12자리)"
                    required={isPrivateRoom}
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      boxSizing: 'border-box',
                      border: '1px solid #000',
                    }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <span style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                  초대할 멤버 선택:
                </span>
                {TEMP_USERS.filter((u) => u.id !== selectedUser.id).map((otherUser) => (
                  <label
                    key={otherUser.id}
                    style={{ display: 'inline-block', marginRight: '10px', fontSize: '13px' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.includes(otherUser.id)}
                      onChange={() => {
                        toggleMemberSelection(otherUser.id);
                      }}
                    />
                    {otherUser.name} ({otherUser.loginId})
                  </label>
                ))}
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#fff',
                  border: '1px solid #000',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                채팅방 생성 및 입장 (/chat/[roomId])
              </button>
            </form>
          </section>

          {/* 참여 중인 채팅방 목록 */}
          <section style={{ border: '1px solid #000', padding: '12px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px' }}>내 채팅방 목록 ({userRooms.length})</h3>
              <button
                type="button"
                onClick={fetchBackendRooms}
                style={{
                  padding: '2px 6px',
                  fontSize: '11px',
                  background: '#fff',
                  border: '1px solid #000',
                  cursor: 'pointer',
                }}
              >
                채팅 목록 갱신
              </button>
            </div>

            {userRooms.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#666' }}>
                현재 계정({selectedUser.name})이 참여 중인 채팅방이 없습니다.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {userRooms.map((room) => {
                  const myMember = room.members.find(
                    (m) =>
                      m.userId === selectedUser.id ||
                      m.loginId === selectedUser.loginId ||
                      m.name === selectedUser.name,
                  );
                  const myRole =
                    myMember?.role ??
                    (room.hostId === selectedUser.id || room.creatorUserId === selectedUser.id
                      ? 'FOUNDER'
                      : 'USER');

                  const isRoomFounder =
                    myRole === 'FOUNDER' ||
                    myRole === 'HOST' ||
                    myRole === 'OWNER' ||
                    room.hostId === selectedUser.id ||
                    room.creatorUserId === selectedUser.id;

                  const hostUser = TEMP_USERS.find(
                    (u) =>
                      u.id === room.hostId ||
                      u.id === room.creatorUserId ||
                      u.loginId === room.hostId,
                  );
                  const hostName = hostUser?.name ?? room.hostId ?? '알 수 없음';

                  return (
                    <li
                      key={room.id}
                      style={{
                        border: '1px solid #000',
                        padding: '8px',
                        marginBottom: '8px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <strong style={{ fontSize: '14px' }}>
                          {room.title} {(room.hasPassword || room.isPrivate) && '🔒 [비공개]'}
                        </strong>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              handleEnterRoom(room);
                            }}
                            style={{
                              padding: '2px 6px',
                              fontSize: '11px',
                              background: '#fff',
                              border: '1px solid #000',
                              cursor: 'pointer',
                            }}
                          >
                            입장
                          </button>
                          {isRoomFounder ? (
                            <button
                              type="button"
                              onClick={() => {
                                handleDeleteRoom(room.id);
                              }}
                              style={{
                                padding: '2px 6px',
                                fontSize: '11px',
                                background: '#fff',
                                border: '1px solid #000',
                                cursor: 'pointer',
                              }}
                            >
                              삭제
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                handleLeaveRoom(room.id);
                              }}
                              style={{
                                padding: '2px 6px',
                                fontSize: '11px',
                                background: '#fff',
                                border: '1px solid #000',
                                cursor: 'pointer',
                              }}
                            >
                              퇴장
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#444', marginTop: '4px' }}>
                        유형: {room.type ?? 'GROUP'} | 내 권한: {myRole} | FOUNDER: {hostName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>
                        멤버: {room.members.map((m) => `${m.name}(${m.role})`).join(', ')}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* 우측: API 로그 */}
        <div>
          <section style={{ border: '1px solid #000', padding: '12px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px' }}>백엔드 API 요청 로그</h3>
              <label style={{ fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={useRealApi}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setUseRealApi(e.target.checked);
                  }}
                />
                실제 API 요청 시도
              </label>
            </div>
            <textarea
              readOnly
              value={apiLog || 'API 요청/응답 로그가 여기에 출력됩니다.'}
              style={{
                width: '100%',
                height: '420px',
                fontFamily: 'monospace',
                fontSize: '11px',
                padding: '8px',
                boxSizing: 'border-box',
                border: '1px solid #000',
                background: '#f8f8f8',
                color: '#000',
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
